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

  // Formatear respuesta con información resumida
  const salasFormateadas = salasDisponibles.map(sala => ({
    roomId: sala.roomId,
    nombre: sala.nombre,
    hostUserId: sala.hostUserId,
    hostNombre: sala.jugadores.find(j => j.userId === sala.hostUserId)?.nombre || 'Host',
    jugadoresActuales: sala.jugadores.length,
    maxJugadores: sala.maxJugadores,
    configuracion: {
      numeroPreguntas: sala.configuracion.numeroPreguntas,
      topic: sala.configuracion.topic
    },
    createdAt: sala.createdAt
  }));

  return success({
    salas: salasFormateadas,
    count: salasFormateadas.length,
    lastKey: result.lastKey || null
  });
});