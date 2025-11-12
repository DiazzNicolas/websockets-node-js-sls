import { getItem, deleteItem, updateItem } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';

/**
 * WebSocket: $disconnect
 * Se ejecuta cuando un cliente se desconecta del WebSocket
 * 
 * Elimina la conexión de DynamoDB y marca al jugador como desconectado
 */
export const handler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;

    console.log('Desconexión WebSocket:', connectionId);

    // Buscar la conexión para obtener roomId y userId
    const conexion = await getItem(TABLES.CONNECTIONS, { connectionId });

    if (!conexion) {
      console.log('Conexión no encontrada en la base de datos');
      return { statusCode: 200, body: 'OK' };
    }

    const { roomId, userId } = conexion;

    // Eliminar la conexión de la tabla
    await deleteItem(TABLES.CONNECTIONS, { connectionId });

    console.log('Conexión eliminada:', { connectionId, roomId, userId });

    // Marcar al jugador como desconectado en la sala
    if (roomId && userId) {
      try {
        const sala = await getItem(TABLES.ROOMS, { roomId });

        if (sala && sala.jugadores) {
          // Actualizar el estado de conexión del jugador
          const jugadoresActualizados = sala.jugadores.map(jugador => {
            if (jugador.userId === userId) {
              return { ...jugador, conectado: false };
            }
            return jugador;
          });

          await updateItem(
            TABLES.ROOMS,
            { roomId },
            {
              jugadores: jugadoresActualizados,
              updatedAt: new Date().toISOString()
            }
          );

          console.log('Jugador marcado como desconectado en la sala');
        }
      } catch (error) {
        console.error('Error al actualizar estado del jugador:', error);
        // No fallar si no se puede actualizar la sala
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Desconectado exitosamente' })
    };

  } catch (error) {
    console.error('Error en disconnect handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al desconectar' })
    };
  }
};