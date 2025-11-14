import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { putItem, getItem } from '../utils/db.js';
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
 *   maxJugadores: 4,         // Máximo de jugadores (opcional, default: 4)
 *   numeroPreguntas: 10,     // Número de preguntas (opcional, default: 10)
 *   tiempoRespuesta: 150,    // Tiempo de respuesta en segundos (opcional, default: 150)
 *   tiempoAdivinanza: 150,   // Tiempo de adivinanza en segundos (opcional, default: 150)
 *   puntosAdivinanzaCorrecta: 10, // Puntos por adivinanza correcta (opcional, default: 10)
 *   topic: "cultura-general" // Tema de las preguntas (opcional, default: "cultura-general")
 * }
 */
export const handler = withErrorHandling(async (event) => {
  const body = JSON.parse(event.body || '{}');
  const { 
    userId, 
    maxJugadores = 4,
    numeroPreguntas = 10,
    tiempoRespuesta = 150,
    tiempoAdivinanza = 150,
    puntosAdivinanzaCorrecta = 10,
    topic = 'cultura-general'
  } = body;

  // Validaciones
  if (!userId) {
    return error('El campo userId es obligatorio', 400);
  }

  // Verificar que el usuario existe
  const usuario = await getItem(docClient, TABLES.USERS, { userId });
  if (!usuario) {
    return error('Usuario no encontrado', 404);
  }

  // Validar configuración
  if (![10, 15, 20].includes(numeroPreguntas)) {
    return error('numeroPreguntas debe ser 10, 15 o 20', 400);
  }

  if (maxJugadores < 2 || maxJugadores > 8) {
    return error('maxJugadores debe estar entre 2 y 8', 400);
  }

  if (tiempoRespuesta < 30 || tiempoRespuesta > 300) {
    return error('tiempoRespuesta debe estar entre 30 y 300 segundos', 400);
  }

  if (tiempoAdivinanza < 30 || tiempoAdivinanza > 300) {
    return error('tiempoAdivinanza debe estar entre 30 y 300 segundos', 400);
  }

  const roomId = generateId('room');
  const timestamp = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 horas

  const sala = {
    roomId,
    hostId: userId, // ✅ CAMBIO: hostUserId → hostId
    jugadores: [
      {
        userId: usuario.userId,
        nombre: usuario.nombre,
        avatarUrl: usuario.avatarUrl || '',
      }
    ],
    maxJugadores,
    estado: GAME_STATUS.WAITING,
    configuracion: {
      numeroPreguntas,
      tiempoRespuesta,
      tiempoAdivinanza,
      puntosAdivinanzaCorrecta,
      topic
    },
    createdAt: timestamp,
    updatedAt: timestamp, // ✅ AGREGADO
    ttl
  };

  await putItem(docClient, TABLES.ROOMS, sala);

  console.log('✅ Sala creada:', roomId);

  return success({
    message: 'Sala creada exitosamente',
    sala
  });
});