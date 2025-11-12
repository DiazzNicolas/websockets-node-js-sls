import { scanItems } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';
import { success, error } from '../utils/response.js';

/**
 * GET /preguntas?limit=20&lastKey=...
 * Lista todas las preguntas activas con paginación
 * 
 * Query params:
 * - limit: número de preguntas a devolver (default: 20, max: 100)
 * - lastKey: clave de paginación (opcional)
 */
export const handler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const limit = Math.min(parseInt(queryParams.limit) || 20, 100);
    const lastKey = queryParams.lastKey;

    // Filtrar solo preguntas activas
    const resultado = await scanItems(
      TABLES.QUESTIONS,
      {
        FilterExpression: 'activa = :activa',
        ExpressionAttributeValues: {
          ':activa': true
        }
      },
      limit,
      lastKey
    );

    return success({
      preguntas: resultado.items || [],
      count: resultado.items?.length || 0,
      lastKey: resultado.lastKey || null,
      hasMore: !!resultado.lastKey
    });

  } catch (err) {
    console.error('Error al listar preguntas:', err);
    return error('Error interno al listar preguntas', 500);
  }
};