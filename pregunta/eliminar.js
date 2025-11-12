import { getItem, updateItem } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';
import { success, error, notFound } from '../utils/response.js';

/**
 * DELETE /pregunta/{questionId}
 * Elimina una pregunta (soft delete - marca como inactiva)
 * 
 * Path params:
 * - questionId: ID de la pregunta a eliminar
 */
export const handler = async (event) => {
  try {
    const questionId = event.pathParameters?.questionId;

    if (!questionId) {
      return error('El parámetro "questionId" es obligatorio', 400);
    }

    // Verificar que la pregunta existe
    const preguntaExistente = await getItem(TABLES.QUESTIONS, { questionId });

    if (!preguntaExistente) {
      return notFound('Pregunta no encontrada');
    }

    // Verificar si ya está inactiva
    if (!preguntaExistente.activa) {
      return error('La pregunta ya está inactiva', 400);
    }

    // Marcar como inactiva (soft delete)
    await updateItem(
      TABLES.QUESTIONS,
      { questionId },
      {
        activa: false,
        deletedAt: new Date().toISOString()
      }
    );

    return success({
      message: 'Pregunta eliminada exitosamente',
      questionId
    });

  } catch (err) {
    console.error('Error al eliminar pregunta:', err);
    return error('Error interno al eliminar pregunta', 500);
  }
};