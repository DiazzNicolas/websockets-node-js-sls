import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { queryItems } from '../utils/db.js';
import { success, withErrorHandling } from '../utils/response.js';
import { TABLES, GAME_STATUS } from '../utils/constants.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * GET /salas/disponibles
 * Lista todas las salas disponibles para unirse (estado "esperando")
 * 
 * Query params opcionales:
 * - limit: Número máximo de salas a devolver (default: 20)
 * - lastKey: Para paginación
 */
export const handler = withErrorHandling(async (event) => {
  const queryParams = event.queryStringParameters || {};
  const limit = parseInt(queryParams.limit) || 20;
  
  // Usar el GSI EstadoCreatedAtIndex para obtener salas en estado "esperando"
  // ordenadas por fecha de creación (más recientes primero)
  const result = await queryItems(
    docClient,
    TABLES.ROOMS,
    'estado = :estado',
    { ':estado': GAME_STATUS.WAITING },
    'EstadoCreatedAtIndex',
    limit,
    queryParams.lastKey,
    false // ScanIndexForward = false para orden descendente (más recientes primero)
  );

  // Filtrar solo salas que no estén llenas
  const salasDisponibles = result.items.filter(sala => 
    sala.jugadores.length < sala.maxJugadores
  );

  // Formatear respuesta - devolver la sala completa tal como está
  const salasFormateadas = salasDisponibles.map(sala => {
    // Encontrar el host
    const host = sala.jugadores.find(j => j.userId === sala.hostId);
    
    return {
      roomId: sala.roomId,
      hostId: sala.hostId, // Cambiar hostUserId a hostId
      hostNombre: host?.nombre || 'Host',
      jugadores: sala.jugadores,
      maxJugadores: sala.maxJugadores,
      estado: sala.estado,
      configuracion: sala.configuracion,
      createdAt: sala.createdAt,
      updatedAt: sala.updatedAt
    };
  });

  return success({
    salas: salasFormateadas,
    count: salasFormateadas.length,
    lastKey: result.lastKey || null
  });
});