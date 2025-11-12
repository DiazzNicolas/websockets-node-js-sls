import { putItem } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';

/**
 * WebSocket: $connect
 * Se ejecuta cuando un cliente se conecta al WebSocket
 * 
 * Registra la conexión en DynamoDB para poder enviarle mensajes después
 */
export const handler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    
    // Extraer parámetros de query string (roomId y userId)
    const queryParams = event.queryStringParameters || {};
    const roomId = queryParams.roomId;
    const userId = queryParams.userId;

    console.log('Nueva conexión WebSocket:', { connectionId, roomId, userId });

    // Validar que se proporcionen roomId y userId
    if (!roomId || !userId) {
      console.error('Faltan parámetros roomId o userId');
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Se requieren los parámetros roomId y userId' 
        })
      };
    }

    const timestamp = new Date().toISOString();

    // Registrar conexión en la tabla
    const conexion = {
      connectionId,
      roomId,
      userId,
      connectedAt: timestamp,
      ttl: Math.floor(Date.now() / 1000) + (3 * 60 * 60) // Expira en 3 horas
    };

    await putItem(TABLES.CONNECTIONS, conexion);

    console.log('Conexión registrada exitosamente');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Conectado exitosamente',
        connectionId 
      })
    };

  } catch (error) {
    console.error('Error en connect handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error al establecer conexión' 
      })
    };
  }
};