import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { putItem, getItem, getCurrentTimestamp } from '../utils/db.js';
import { success, error, withErrorHandling } from '../utils/response.js';
import { generateId } from '../utils/helpers.js';
import { TABLES, GAME_STATUS, ERRORS } from '../utils/constants.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * POST /sala/crear
 * Crea una nueva sala de juego
 * 
 * Body:
 * {
 *   userId: "user-xxx",      // ID del usuario que crea la sala (será el host)
 *   nombre: "Sala de Juan",  // Nombre de la sala (opcional)
 *   maxJugadores: 8,         // Máximo de jugadores (opcional, default: 8)
 *   configuracion: {         // Configuración del juego (opcional)
 *     numeroPreguntas: 10,
 *     tiempoRespuesta: 150,
 *     tiempoAdivinanza: 150,
 *     puntosAdivinanzaCorrecta: 10,
 *     topic: "cultura-general"
 *   }
 * }
 */
export const handler = withErrorHandling(async (event) => {
  const body = JSON.parse(event.body || '{}');
  const { userId, nombre, maxJugadores = 8, configuracion = {} } = body;

  // Validaciones
  if (!userId) {
    return error(ERRORS.MISSING_FIELDS('userId'), 400);
  }

  // Verificar que el usuario existe
  const usuario = await getItem(docClient, TABLES.USERS, { userId });
  if (!usuario) {
    return error('Usuario no encontrado', 404);
  }

  // Configuración por defecto
  const configDefault = {
    numeroPreguntas: 10,
    tiempoRespuesta: 150,
    tiempoAdivinanza: 150,
    puntosAdivinanzaCorrecta: 10,
    topic: 'cultura-general',
    ...configuracion
  };

  // Validar configuración
  if (![10, 15, 20].includes(configDefault.numeroPreguntas)) {
    return error('numeroPreguntas debe ser 10, 15 o 20', 400);
  }

  if (maxJugadores < 2 || maxJugadores > 8) {
    return error('maxJugadores debe estar entre 2 y 8', 400);
  }

  const roomId = generateId('room');
  const timestamp = getCurrentTimestamp();
  const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 horas

  const sala = {
    roomId,
    nombre: nombre || `Sala de ${usuario.nombre}`,
    hostUserId: userId,
    jugadores: [
      {
        userId: usuario.userId,
        nombre: usuario.nombre,
        avatarUrl: usuario.avatarUrl || '',
        conectado: true
      }
    ],
    maxJugadores,
    estado: GAME_STATUS.WAITING,
    configuracion: configDefault,
    sessionId: null,
    createdAt: timestamp,
    ttl
  };

  await putItem(docClient, TABLES.ROOMS, sala);

  return success({
    message: 'Sala creada exitosamente',
    sala
  });
});