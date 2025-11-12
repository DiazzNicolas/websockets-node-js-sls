import { getItem, putItem, updateItem, queryItems } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';
import { success, error, notFound } from '../utils/response.js';
import { generateId, shuffleArray, pickRandom } from '../utils/helpers.js';

/**
 * POST /juego/{roomId}/iniciar
 * Inicia una nueva partida en una sala existente
 * 
 * Path params:
 * - roomId: ID de la sala
 * 
 * Body:
 * {
 *   userId: "user-xxx" // Debe ser el host
 * }
 */
export const handler = async (event) => {
  try {
    const roomId = event.pathParameters?.roomId;
    const body = JSON.parse(event.body || '{}');
    const { userId } = body;

    // Validaciones básicas
    if (!roomId) {
      return error('El parámetro "roomId" es obligatorio', 400);
    }

    if (!userId) {
      return error('El campo "userId" es obligatorio', 400);
    }

    // Obtener la sala
    const sala = await getItem(TABLES.ROOMS, { roomId });

    if (!sala) {
      return notFound('Sala no encontrada');
    }

    // Validar que el usuario sea el host
    if (sala.hostUserId !== userId) {
      return error('Solo el host puede iniciar la partida', 403);
    }

    // Validar estado de la sala
    if (sala.estado !== 'esperando') {
      return error('La sala no está en estado de espera', 400);
    }

    // Validar cantidad mínima de jugadores (al menos 2)
    if (!sala.jugadores || sala.jugadores.length < 2) {
      return error('Se necesitan al menos 2 jugadores para iniciar', 400);
    }

    // Obtener configuración
    const config = sala.configuracion || {};
    const numeroPreguntas = config.numeroPreguntas || 10;
    const topic = config.topic || 'cultura-general';

    // Buscar preguntas del topic especificado
    const resultadoPreguntas = await queryItems(
      TABLES.QUESTIONS,
      {
        IndexName: 'TopicIndex',
        KeyConditionExpression: 'topic = :topic',
        FilterExpression: 'activa = :activa',
        ExpressionAttributeValues: {
          ':topic': topic,
          ':activa': true
        }
      },
      100 // Traer hasta 100 para tener variedad
    );

    const preguntasDisponibles = resultadoPreguntas.items || [];

    if (preguntasDisponibles.length < numeroPreguntas) {
      return error(`No hay suficientes preguntas activas para el topic "${topic}". Se necesitan ${numeroPreguntas}, hay ${preguntasDisponibles.length}`, 400);
    }

    // Seleccionar preguntas aleatorias
    const preguntasSeleccionadas = shuffleArray([...preguntasDisponibles])
      .slice(0, numeroPreguntas);

    const preguntasIds = preguntasSeleccionadas.map(p => p.questionId);

    // Generar ID de sesión
    const sessionId = generateId('session');
    const timestamp = new Date().toISOString();

    // Inicializar puntuaciones
    const puntuaciones = {};
    sala.jugadores.forEach(jugador => {
      puntuaciones[jugador.userId] = 0;
    });

    // Crear ranking inicial
    const rankingActual = sala.jugadores.map(jugador => ({
      userId: jugador.userId,
      nombre: jugador.nombre,
      avatarUrl: jugador.avatarUrl || null,
      puntuacion: 0
    }));

    // Crear sesión de juego
    const sesion = {
      sessionId,
      roomId,
      topic,
      preguntasIds,
      rondaActual: 0,
      preguntaActual: null,
      faseActual: 'inicializada', // inicializada | respondiendo | adivinando | finalizada
      respuestas: {},
      adivinanzas: {},
      puntuaciones,
      rankingActual,
      historialRondas: [],
      tiempoInicioPartida: Date.now(),
      tiempoInicioRonda: null,
      estado: 'activa',
      createdAt: timestamp,
      ttl: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // Expira en 2 horas
    };

    // Guardar sesión
    await putItem(TABLES.GAME_SESSIONS, sesion);

    // Actualizar sala
    await updateItem(
      TABLES.ROOMS,
      { roomId },
      {
        estado: 'en_juego',
        sessionId,
        updatedAt: timestamp
      }
    );

    return success({
      message: 'Partida iniciada exitosamente',
      sessionId,
      roomId,
      numeroPreguntas,
      topic,
      jugadores: sala.jugadores.length,
      instrucciones: 'Usa POST /juego/{sessionId}/ronda para iniciar la primera ronda'
    });

  } catch (err) {
    console.error('Error al iniciar partida:', err);
    return error('Error interno al iniciar partida', 500);
  }
};