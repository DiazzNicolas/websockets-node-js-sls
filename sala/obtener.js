import { getItem } from '../utils/db.js';
import { success, error, withErrorHandling } from '../utils/response.js';
import { TABLES, ERRORS } from '../utils/constants.js';

/**
 * GET /sala/{roomId}
 * Obtiene los detalles completos de una sala específica
 */
export const handler = withErrorHandling(async (event) => {
  const { roomId } = event.pathParameters || {};

  // Validaciones
  if (!roomId) {
    return error('roomId es obligatorio', 400);
  }

  // Obtener sala
  const sala = await getItem(TABLES.ROOMS, { roomId });
  
  if (!sala) {
    return error('Sala no encontrada', 404);
  }

  return success({
    sala
  });
});