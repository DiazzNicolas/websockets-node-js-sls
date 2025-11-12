import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getItem } from '../utils/db.js';
import { success, error, withErrorHandling } from '../utils/response.js';
import { TABLES, ERRORS } from '../utils/constants.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * GET /sala/{roomId}
 * Obtiene los detalles completos de una sala específica
 */
export const handler = withErrorHandling(async (event) => {
  const { roomId } = event.pathParameters || {};

  // Validaciones
  if (!roomId) {
    return error(ERRORS.MISSING_FIELDS('roomId'), 400);
  }

  // Obtener sala
  const sala = await getItem(docClient, TABLES.ROOMS, { roomId });
  
  if (!sala) {
    return error('Sala no encontrada', 404);
  }

  return success({
    sala
  });
});