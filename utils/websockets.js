import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  DeleteConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { query } from './db.js';
import { TABLES, INDEXES } from './constants.js';

/**
 * Crear cliente de API Gateway Management
 */
export function createWebSocketClient() {
  const endpoint = process.env.WEBSOCKET_ENDPOINT;
  
  if (!endpoint) {
    throw new Error('WEBSOCKET_ENDPOINT no está configurado');
  }
  
  return new ApiGatewayManagementApiClient({
    endpoint,
    region: process.env.AWS_REGION || 'us-east-1',
  });
}

/**
 * Enviar mensaje a una conexión específica
 */
export async function sendToConnection(connectionId, data) {
  const client = createWebSocketClient();
  
  try {
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify(data),
    });
    
    await client.send(command);
    return true;
  } catch (error) {
    // Si la conexión está cerrada, retornar false
    if (error.statusCode === 410) {
      console.log(`Conexión ${connectionId} está cerrada`);
      return false;
    }
    
    console.error('Error enviando mensaje a conexión:', error);
    throw error;
  }
}

/**
 * Obtener todas las conexiones de una sala
 */
export async function getRoomConnections(roomId) {
  try {
    const connections = await query(
      TABLES.CONNECTIONS,
      {
        expression: 'roomId = :roomId',
        values: {
          ':roomId': roomId,
        },
      },
      {
        indexName: INDEXES.CONNECTIONS.ROOM_ID,
      }
    );
    
    return connections;
  } catch (error) {
    console.error('Error obteniendo conexiones de sala:', error);
    return [];
  }
}

/**
 * Obtener conexiones de un usuario
 */
export async function getUserConnections(userId) {
  try {
    const connections = await query(
      TABLES.CONNECTIONS,
      {
        expression: 'userId = :userId',
        values: {
          ':userId': userId,
        },
      },
      {
        indexName: INDEXES.CONNECTIONS.USER_ID,
      }
    );
    
    return connections;
  } catch (error) {
    console.error('Error obteniendo conexiones de usuario:', error);
    return [];
  }
}

/**
 * Broadcast a todos los jugadores de una sala
 */
export async function broadcastToRoom(roomId, eventType, data, excludeConnectionId = null) {
  const connections = await getRoomConnections(roomId);
  
  const message = {
    type: eventType,
    timestamp: new Date().toISOString(),
    data,
  };
  
  const sendPromises = connections
    .filter(conn => conn.connectionId !== excludeConnectionId)
    .map(async (conn) => {
      try {
        const sent = await sendToConnection(conn.connectionId, message);
        
        // Si la conexión está muerta, podríamos eliminarla aquí
        if (!sent) {
          console.log(`Conexión muerta detectada: ${conn.connectionId}`);
          // TODO: Considerar eliminar la conexión de la BD
        }
        
        return sent;
      } catch (error) {
        console.error(`Error enviando a ${conn.connectionId}:`, error);
        return false;
      }
    });
  
  const results = await Promise.allSettled(sendPromises);
  
  const successCount = results.filter(
    r => r.status === 'fulfilled' && r.value === true
  ).length;
  
  console.log(`Broadcast a sala ${roomId}: ${successCount}/${connections.length} exitosos`);
  
  return {
    total: connections.length,
    sent: successCount,
    failed: connections.length - successCount,
  };
}

/**
 * Enviar mensaje a un usuario específico (todas sus conexiones)
 */
export async function sendToUser(userId, eventType, data) {
  const connections = await getUserConnections(userId);
  
  const message = {
    type: eventType,
    timestamp: new Date().toISOString(),
    data,
  };
  
  const sendPromises = connections.map(conn => 
    sendToConnection(conn.connectionId, message)
  );
  
  const results = await Promise.allSettled(sendPromises);
  
  const successCount = results.filter(
    r => r.status === 'fulfilled' && r.value === true
  ).length;
  
  return {
    total: connections.length,
    sent: successCount,
    failed: connections.length - successCount,
  };
}

/**
 * Notificar error a una conexión
 */
export async function sendError(connectionId, errorCode, message) {
  return sendToConnection(connectionId, {
    type: 'error',
    timestamp: new Date().toISOString(),
    error: {
      code: errorCode,
      message,
    },
  });
}

/**
 * Crear respuesta para WebSocket
 */
export function createWebSocketResponse(statusCode = 200, body = null) {
  const response = {
    statusCode,
  };
  
  if (body) {
    response.body = JSON.stringify(body);
  }
  
  return response;
}

/**
 * Crear respuesta exitosa para WebSocket
 */
export function wsSuccess(message = 'OK') {
  return createWebSocketResponse(200, { message });
}

/**
 * Crear respuesta de error para WebSocket
 */
export function wsError(statusCode, errorCode, message) {
  return createWebSocketResponse(statusCode, {
    error: {
      code: errorCode,
      message,
    },
  });
}
