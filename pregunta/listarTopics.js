import { scanItems } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';
import { success, error } from '../utils/response.js';

/**
 * GET /preguntas/topics
 * Devuelve la lista de topics únicos disponibles
 * 
 * Response:
 * {
 *   topics: ["cultura-general", "deportes", "tecnologia"],
 *   count: 3
 * }
 */
export const handler = async (event) => {
  try {
    // Escanear todas las preguntas activas
    // Solo proyectamos el campo 'topic' para optimizar
    const resultado = await scanItems(
      TABLES.QUESTIONS,
      {
        FilterExpression: 'activa = :activa',
        ExpressionAttributeValues: {
          ':activa': true
        },
        ProjectionExpression: 'topic'
      }
    );

    // Extraer topics únicos
    const topicsSet = new Set();
    
    if (resultado.items) {
      resultado.items.forEach(item => {
        if (item.topic) {
          topicsSet.add(item.topic);
        }
      });
    }

    const topics = Array.from(topicsSet).sort();

    return success({
      topics,
      count: topics.length
    });

  } catch (err) {
    console.error('Error al listar topics:', err);
    return error('Error interno al listar topics', 500);
  }
};