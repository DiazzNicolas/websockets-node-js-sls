import { queryItems } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';
import { success, error } from '../utils/response.js';

/**
 * GET /preguntas/topic/{topic}?limit=20&lastKey=...
 * Lista preguntas filtradas por topic específico
 * 
 * Path params:
 * - topic: el topic a filtrar (ej: "cultura-general", "deportes")
 * 
 * Query params:
 * - limit: número de preguntas (default: 20, max: 100)
 * - lastKey: paginación
 */
export const handler = async (event) => {
  try {
    const topic = event.pathParameters?.topic;
    
    if (!topic) {
      return error('El parámetro "topic" es obligatorio', 400);
    }

    const queryParams = event.queryStringParameters || {};
    const limit = Math.min(parseInt(queryParams.limit) || 20, 100);
    const lastKey = queryParams.lastKey;

    // Query usando el índice TopicIndex
    const resultado = await queryItems(
      TABLES.QUESTIONS,
      {
        IndexName: 'TopicIndex',
        KeyConditionExpression: 'topic = :topic',
        FilterExpression: 'activa = :activa',
        ExpressionAttributeValues: {
          ':topic': topic.toLowerCase().trim(),
          ':activa': true
        }
      },
      limit,
      lastKey
    );

    return success({
      topic,
      preguntas: resultado.items || [],
      count: resultado.items?.length || 0,
      lastKey: resultado.lastKey || null,
      hasMore: !!resultado.lastKey
    });

  } catch (err) {
    console.error('Error al listar preguntas por topic:', err);
    return error('Error interno al listar preguntas por topic', 500);
  }
};