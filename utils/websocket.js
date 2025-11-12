import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { queryItems, deleteItem } from './db.js';
import { TABLES } from './constants.js';

/**
 * Obtiene el cliente de API Gateway Management configurado
 */
const getApiGatewayClient = () => {
  const endpoint = process.env.WEBSOCKET_ENDPOINT.replace('wss://', 'https://');
  return new ApiGatewayManagementApiClient({ endpoint });
};

/**
 * Envía un mensaje a una conexión específica
 * 
 * @param {string} connectionId - ID de la conexión
 * @param {object} data - Datos a enviar
 * @returns {Promise<boolean>} - true si se envió exitosamente
 */
export const sendMessage = async (connectionId, data) => {
  try {
    const apiGateway = getApiGatewayClient();

    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify(data)
    });

    await apiGateway.send(command);
    console.log('Mensaje enviado a conexión:', connectionId);
    return true;

  } catch (error) {
    console.error('Error al enviar mensaje:', error);

    // Si la conexión está obsoleta (410), eliminarla
    if (error.statusCode === 410) {
      console.log('Conexión obsoleta, eliminando:', connectionId);
      try {
        await deleteItem(TABLES.CONNECTIONS, { connectionId });
      } catch (deleteError) {
        console.error('Error al eliminar conexión obsoleta:', deleteError);
      }
    }

    return false;
  }
};

/**
 * Envía un mensaje a todas las conexiones de una sala
 * 
 * @param {string} roomId - ID de la sala
 * @param {object} data - Datos a enviar
 * @param {string} excludeUserId - (Opcional) ID de usuario a excluir
 * @returns {Promise<object>} - Estadísticas del envío
 */
export const broadcast = async (roomId, data, excludeUserId = null) => {
  try {
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

    let conexiones = conexionesResult.items || [];

    // Filtrar usuario excluido si se especifica
    if (excludeUserId) {
      conexiones = conexiones.filter(c => c.userId !== excludeUserId);
    }

    if (conexiones.length === 0) {
      console.log('No hay conexiones activas para broadcast');
      return { total: 0, exitosos: 0, fallidos: 0 };
    }

    // Agregar timestamp al mensaje
    const mensaje = {
      ...data,
      timestamp: new Date().toISOString()
    };

    // Enviar a todas las conexiones
    const resultados = await Promise.all(
      conexiones.map(conexion => sendMessage(conexion.connectionId, mensaje))
    );

    const exitosos = resultados.filter(r => r).length;
    const fallidos = resultados.filter(r => !r).length;

    console.log('Broadcast completado:', { 
      total: conexiones.length, 
      exitosos, 
      fallidos 
    });

    return {
      total: conexiones.length,
      exitosos,
      fallidos
    };

  } catch (error) {
    console.error('Error en broadcast:', error);
    throw error;
  }
};

/**
 * Envía un mensaje a un usuario específico (todas sus conexiones)
 * 
 * @param {string} userId - ID del usuario
 * @param {object} data - Datos a enviar
 * @returns {Promise<object>} - Estadísticas del envío
 */
export const sendToUser = async (userId, data) => {
  try {
    // Obtener todas las conexiones del usuario
    const conexionesResult = await queryItems(
      TABLES.CONNECTIONS,
      {
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }
    );

    const conexiones = conexionesResult.items || [];

    if (conexiones.length === 0) {
      console.log('Usuario no tiene conexiones activas:', userId);
      return { total: 0, exitosos: 0, fallidos: 0 };
    }

    // Agregar timestamp
    const mensaje = {
      ...data,
      timestamp: new Date().toISOString()
    };

    // Enviar a todas las conexiones del usuario
    const resultados = await Promise.all(
      conexiones.map(conexion => sendMessage(conexion.connectionId, mensaje))
    );

    const exitosos = resultados.filter(r => r).length;
    const fallidos = resultados.filter(r => !r).length;

    return {
      total: conexiones.length,
      exitosos,
      fallidos
    };

  } catch (error) {
    console.error('Error al enviar a usuario:', error);
    throw error;
  }
};

/**
 * Desconecta forzosamente una conexión
 * 
 * @param {string} connectionId - ID de la conexión a cerrar
 * @returns {Promise<boolean>}
 */
export const disconnectClient = async (connectionId) => {
  try {
    const apiGateway = getApiGatewayClient();

    await apiGateway.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify({ 
        event: 'forceDisconnect',
        message: 'Conexión cerrada por el servidor' 
      })
    }));

    // Eliminar de la base de datos
    await deleteItem(TABLES.CONNECTIONS, { connectionId });

    console.log('Cliente desconectado:', connectionId);
    return true;

  } catch (error) {
    console.error('Error al desconectar cliente:', error);
    return false;
  }
};

/**
 * Obtiene todas las conexiones activas de una sala
 * 
 * @param {string} roomId - ID de la sala
 * @returns {Promise<Array>} - Lista de conexiones
 */
export const getConnectedClients = async (roomId) => {
  try {
    const resultado = await queryItems(
      TABLES.CONNECTIONS,
      {
        IndexName: 'RoomIdIndex',
        KeyConditionExpression: 'roomId = :roomId',
        ExpressionAttributeValues: {
          ':roomId': roomId
        }
      }
    );

    return resultado.items || [];

  } catch (error) {
    console.error('Error al obtener clientes conectados:', error);
    return [];
  }
};

/**
 * Notifica eventos del juego a una sala
 * Wrapper conveniente para eventos específicos del juego
 */
export const notifyGameEvent = async (roomId, event, eventData) => {
  return await broadcast(roomId, {
    event,
    data: eventData
  });
};

export default {
  sendMessage,
  broadcast,
  sendToUser,
  disconnectClient,
  getConnectedClients,
  notifyGameEvent
};