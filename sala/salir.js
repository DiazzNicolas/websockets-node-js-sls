import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getItem, updateItem, deleteItem, getCurrentTimestamp } from '../utils/db.js';
import { success, error, withErrorHandling } from '../utils/response.js';
import { TABLES, GAME_STATUS, ERRORS } from '../utils/constants.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * POST /sala/{roomId}/salir
 * Permite a un jugador salir de una sala
 * 
 * Body:
 * {
 *   userId: "user-xxx"
 * }
 */
export const handler = withErrorHandling(async (event) => {
  const { roomId } = event.pathParameters || {};
  const body = JSON.parse(event.body || '{}');
  const { userId } = body;

  // Validaciones
  if (!roomId || !userId) {
    return error(ERRORS.MISSING_FIELDS('roomId, userId'), 400);
  }

  // Obtener sala
  const sala = await getItem(docClient, TABLES.ROOMS, { roomId });
  if (!sala) {
    return error('Sala no encontrada', 404);
  }

  // Verificar que el usuario está en la sala
  const jugadorIndex = sala.jugadores.findIndex(j => j.userId === userId);
  if (jugadorIndex === -1) {
    return error('El usuario no está en esta sala', 400);
  }

  // Remover jugador
  const jugadoresActualizados = sala.jugadores.filter(j => j.userId !== userId);

  // Si la sala queda vacía, eliminarla
  if (jugadoresActualizados.length === 0) {
    await deleteItem(docClient, TABLES.ROOMS, { roomId });
    
    return success({
      message: 'Has salido de la sala. La sala fue eliminada porque quedó vacía',
      salaEliminada: true
    });
  }

  // Si el host se va, asignar nuevo host (el primer jugador restante)
  let nuevoHostUserId = sala.hostUserId;
  if (sala.hostUserId === userId) {
    nuevoHostUserId = jugadoresActualizados[0].userId;
  }

  // Actualizar sala
  await updateItem(
    docClient,
    TABLES.ROOMS,
    { roomId },
    {
      jugadores: jugadoresActualizados,
      hostUserId: nuevoHostUserId,
      updatedAt: getCurrentTimestamp()
    }
  );

  // Obtener sala actualizada
  const salaActualizada = await getItem(docClient, TABLES.ROOMS, { roomId });

  return success({
    message: 'Has salido de la sala exitosamente',
    nuevoHost: sala.hostUserId === userId ? nuevoHostUserId : null,
    sala: salaActualizada
  });
});