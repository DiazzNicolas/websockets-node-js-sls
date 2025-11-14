import { getItem, updateItem, deleteItem, getCurrentTimestamp } from '../utils/db.js';
import { success, error, withErrorHandling } from '../utils/response.js';
import { TABLES } from '../utils/constants.js';

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
    return error('roomId y userId son obligatorios', 400);
  }

  // Obtener sala
  const sala = await getItem(TABLES.ROOMS, { roomId });
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
    await deleteItem(TABLES.ROOMS, { roomId });
    
    return success({
      message: 'Has salido de la sala. La sala fue eliminada porque quedó vacía',
      salaEliminada: true
    });
  }

  // Si el host se va, asignar nuevo host (el primer jugador restante)
  // ⚠️ IMPORTANTE: Tu esquema usa "hostId", no "hostUserId"
  let nuevoHostId = sala.hostId;
  if (sala.hostId === userId) {
    nuevoHostId = jugadoresActualizados[0].userId;
  }

  // Actualizar sala
  await updateItem(
    TABLES.ROOMS,
    { roomId },
    {
      jugadores: jugadoresActualizados,
      hostId: nuevoHostId, // ✅ Cambiado de hostUserId a hostId
      updatedAt: getCurrentTimestamp()
    }
  );

  // Obtener sala actualizada
  const salaActualizada = await getItem(TABLES.ROOMS, { roomId });

  return success({
    message: 'Has salido de la sala exitosamente',
    nuevoHost: sala.hostId === userId ? nuevoHostId : null,
    sala: salaActualizada
  });
});