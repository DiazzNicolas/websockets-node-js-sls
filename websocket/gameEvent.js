import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { getItem, queryItems } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';

/**
 * WebSocket: gameEvent
 * Maneja eventos del juego y notifica a los jugadores
 * 
 * Tipos de eventos soportados:
 * - playerJoined: Un jugador se unió a la sala
 * - playerLeft: Un jugador salió de la sala
 * - gameStarted: La partida comenzó
 * - roundStarted: Nueva ronda iniciada
 * - playerAnswered: Un jugador respondió
 * - guessPhaseStarted: Fase de adivinanzas comenzó
 * - playerGuessed: Un jugador adivinó
 * - roundEnded: Ronda finalizada con resultados
 * - gameEnded: Partida finalizada
 * - chatMessage: Mensaje de chat
 */
export const handler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const body = JSON.parse(event.body || '{}');
    const { action, data } = body;

    console.log('Game event recibido:', { connectionId, action, data });

    // Validar estructura del mensaje
    if (!action || !data || !data.roomId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Se requiere "action" y "data.roomId"' 
        })
      };
    }

    const { roomId } = data;

    // Obtener todas las conexiones de la sala
    const conexionesResult = await queryItems(
      TABLES.CONNECTIONS,
      {
        IndexName: 'RoomIdIndex',
        KeyConditionExpression: 'roomId = :roomId',
        ExpressionAttributeValues: {
          ':roomId': roomId
        }
      }
    );

    const conexiones = conexionesResult.items || [];

    if (conexiones.length === 0) {
      console.log('No hay conexiones activas en la sala');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No hay jugadores conectados' 
        })
      };
    }

    // Preparar el mensaje para enviar
    const mensaje = {
      event: action,
      data: {
        ...data,
        timestamp: new Date().toISOString()
      }
    };

    // Configurar cliente de API Gateway Management
    const endpoint = process.env.WEBSOCKET_ENDPOINT.replace('wss://', 'https://');
    const apiGateway = new ApiGatewayManagementApiClient({
      endpoint
    });

    // Enviar mensaje a todas las conexiones
    const envios = conexiones.map(async (conexion) => {
      try {
        const command = new PostToConnectionCommand({
          ConnectionId: conexion.connectionId,
          Data: JSON.stringify(mensaje)
        });

        await apiGateway.send(command);
        console.log('Mensaje enviado a:', conexion.connectionId);
        return { success: true, connectionId: conexion.connectionId };

      } catch (error) {
        console.error('Error al enviar a:', conexion.connectionId, error);
        
        // Si la conexión está obsoleta (410), eliminarla
        if (error.statusCode === 410) {
          console.log('Conexión obsoleta, eliminando:', conexion.connectionId);
          try {
            const { deleteItem } = await import('../utils/db.js');
            await deleteItem(TABLES.CONNECTIONS, { 
              connectionId: conexion.connectionId 
            });
          } catch (deleteError) {
            console.error('Error al eliminar conexión:', deleteError);
          }
        }

        return { success: false, connectionId: conexion.connectionId, error };
      }
    });

    const resultados = await Promise.all(envios);
    const exitosos = resultados.filter(r => r.success).length;
    const fallidos = resultados.filter(r => !r.success).length;

    console.log('Broadcast completado:', { 
      total: conexiones.length, 
      exitosos, 
      fallidos 
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Evento enviado',
        action,
        roomId,
        estadisticas: {
          conexionesActivas: conexiones.length,
          enviadosExitosos: exitosos,
          enviadosFallidos: fallidos
        }
      })
    };

  } catch (error) {
    console.error('Error en gameEvent handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error al procesar evento del juego' 
      })
    };
  }
};