import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { success, withErrorHandling } from '../utils/response.js';
import { TABLES } from '../utils/constants.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * GET /salas/disponibles
 * Lista todas las salas disponibles para unirse (estado "esperando")
 */
export const handler = withErrorHandling(async (event) => {
  const queryParams = event.queryStringParameters || {};
  const limit = parseInt(queryParams.limit) || 20;
  
  try {
    // Hacer un scan simple primero para debuggear
    const command = new ScanCommand({
      TableName: TABLES.ROOMS,
      FilterExpression: 'estado = :estado',
      ExpressionAttributeValues: {
        ':estado': 'esperando'
      },
      Limit: limit
    });

    const result = await docClient.send(command);
    const items = result.Items || [];

    // Filtrar salas que no estén llenas
    const salasDisponibles = items.filter(sala => 
      sala.jugadores && sala.jugadores.length < sala.maxJugadores
    );

    console.log(`✅ Salas encontradas: ${salasDisponibles.length}`);

    return success({
      salas: salasDisponibles,
      count: salasDisponibles.length,
      lastKey: result.LastEvaluatedKey || null
    });
  } catch (err) {
    console.error('❌ Error en listarSalas:', err);
    throw err;
  }
});