import { getItem, updateItem, getCurrentTimestamp } from '../utils/db.js';
import { success, error, withErrorHandling } from '../utils/response.js';
import { TABLES, GAME_STATUS, ERRORS } from '../utils/constants.js';

/**
 * POST /sala/{roomId}/unirse
 * Permite a un jugador unirse a una sala existente
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

  // Obtener sala - ✅ SIN docClient
  const sala = await getItem(TABLES.ROOMS, { roomId });
  if (!sala) {
    return error('Sala no encontrada', 404);
  }

  // Verificar estado de la sala
  if (sala.estado !== GAME_STATUS.WAITING) {
    return error('No puedes unirte a una sala que ya está en juego o finalizada', 400);
  }

  // Verificar que el usuario existe - ✅ SIN docClient
  const usuario = await getItem(TABLES.USERS, { userId });
  if (!usuario) {
    return error('Usuario no encontrado', 404);
  }

  // Verificar si el usuario ya está en la sala
  const jugadores = sala.jugadores || []; // ✅ Protección contra undefined
  const yaEstaEnSala = jugadores.some(j => j.userId === userId);
  
  if (yaEstaEnSala) {
    return error('El usuario ya está en esta sala', 400);
  }

  // Verificar capacidad
  if (jugadores.length >= sala.maxJugadores) {
    return error('La sala está llena', 400);
  }

  // Agregar jugador
  const nuevoJugador = {
    userId: usuario.userId,
    nombre: usuario.nombre,
    avatarUrl: usuario.avatarUrl || '',
    conectado: true
  };

  const jugadoresActualizados = [...jugadores, nuevoJugador];

  // Actualizar sala - ✅ SIN docClient
  await updateItem(
    TABLES.ROOMS,
    { roomId },
    {
      jugadores: jugadoresActualizados,
      updatedAt: getCurrentTimestamp()
    }
  );

  // Obtener sala actualizada - ✅ SIN docClient
  const salaActualizada = await getItem(TABLES.ROOMS, { roomId });

  return success({
    message: 'Te has unido a la sala exitosamente',
    sala: salaActualizada
  });
});