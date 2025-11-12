import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getItem, updateItem, getCurrentTimestamp } from '../utils/db.js';
import { success, error, withErrorHandling } from '../utils/response.js';
import { TABLES, GAME_STATUS, ERRORS } from '../utils/constants.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * PUT /sala/{roomId}/configuracion
 * Actualiza la configuración de una sala (solo el host puede hacerlo)
 * 
 * Body:
 * {
 *   userId: "user-xxx",      // ID del usuario que hace la actualización
 *   configuracion: {
 *     numeroPreguntas: 15,
 *     tiempoRespuesta: 120,
 *     tiempoAdivinanza: 120,
 *     puntosAdivinanzaCorrecta: 15,
 *     topic: "historia"
 *   }
 * }
 */
export const handler = withErrorHandling(async (event) => {
  const { roomId } = event.pathParameters || {};
  const body = JSON.parse(event.body || '{}');
  const { userId, configuracion } = body;

  // Validaciones
  if (!roomId || !userId || !configuracion) {
    return error(ERRORS.MISSING_FIELDS('roomId, userId, configuracion'), 400);
  }

  // Obtener sala
  const sala = await getItem(docClient, TABLES.ROOMS, { roomId });
  if (!sala) {
    return error('Sala no encontrada', 404);
  }

  // Verificar que el usuario es el host
  if (sala.hostUserId !== userId) {
    return error('Solo el host puede actualizar la configuración de la sala', 403);
  }

  // Verificar que la sala no esté en juego
  if (sala.estado !== GAME_STATUS.WAITING) {
    return error('No se puede actualizar la configuración de una sala en juego o finalizada', 400);
  }

  // Validar configuración
  const nuevaConfig = {
    ...sala.configuracion,
    ...configuracion
  };

  // Validaciones específicas
  if (nuevaConfig.numeroPreguntas && ![10, 15, 20].includes(nuevaConfig.numeroPreguntas)) {
    return error('numeroPreguntas debe ser 10, 15 o 20', 400);
  }

  if (nuevaConfig.tiempoRespuesta && (nuevaConfig.tiempoRespuesta < 30 || nuevaConfig.tiempoRespuesta > 300)) {
    return error('tiempoRespuesta debe estar entre 30 y 300 segundos', 400);
  }

  if (nuevaConfig.tiempoAdivinanza && (nuevaConfig.tiempoAdivinanza < 30 || nuevaConfig.tiempoAdivinanza > 300)) {
    return error('tiempoAdivinanza debe estar entre 30 y 300 segundos', 400);
  }

  if (nuevaConfig.puntosAdivinanzaCorrecta && nuevaConfig.puntosAdivinanzaCorrecta < 1) {
    return error('puntosAdivinanzaCorrecta debe ser mayor a 0', 400);
  }

  // Actualizar configuración
  await updateItem(
    docClient,
    TABLES.ROOMS,
    { roomId },
    {
      configuracion: nuevaConfig,
      updatedAt: getCurrentTimestamp()
    }
  );

  // Obtener sala actualizada
  const salaActualizada = await getItem(docClient, TABLES.ROOMS, { roomId });

  return success({
    message: 'Configuración actualizada exitosamente',
    sala: salaActualizada
  });
});