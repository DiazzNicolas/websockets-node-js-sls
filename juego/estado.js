import { getItem } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';
import { success, error, notFound } from '../utils/response.js';

/**
 * GET /juego/{sessionId}/estado
 * Obtiene el estado completo de una partida en curso
 * 
 * Path params:
 * - sessionId: ID de la sesión
 * 
 * Query params:
 * - userId (opcional): Si se proporciona, incluye info específica del jugador
 */
export const handler = async (event) => {
  try {
    const sessionId = event.pathParameters?.sessionId;
    const queryParams = event.queryStringParameters || {};
    const userId = queryParams.userId;

    if (!sessionId) {
      return error('El parámetro "sessionId" es obligatorio', 400);
    }

    // Obtener sesión
    const sesion = await getItem(TABLES.GAME_SESSIONS, { sessionId });

    if (!sesion) {
      return notFound('Sesión de juego no encontrada');
    }

    // Obtener sala para info adicional
    const sala = await getItem(TABLES.ROOMS, { roomId: sesion.roomId });

    // Construir respuesta base
    const respuesta = {
      sessionId: sesion.sessionId,
      roomId: sesion.roomId,
      estado: sesion.estado,
      faseActual: sesion.faseActual,
      rondaActual: sesion.rondaActual,
      totalRondas: sesion.preguntasIds.length,
      topic: sesion.topic,
      ranking: sesion.rankingActual || [],
      configuracion: sala?.configuracion || {},
      tiempoInicioPartida: sesion.tiempoInicioPartida,
      tiempoInicioRonda: sesion.tiempoInicioRonda
    };

    // Si estamos en una ronda activa, incluir info de la pregunta
    if (sesion.preguntaActual) {
      const pregunta = await getItem(TABLES.QUESTIONS, { questionId: sesion.preguntaActual });
      
      if (pregunta) {
        respuesta.preguntaActual = {
          questionId: pregunta.questionId,
          texto: pregunta.texto,
          opciones: pregunta.opciones,
          categoria: pregunta.categoria
        };
      }
    }

    // Información de progreso
    const totalJugadores = Object.keys(sesion.puntuaciones).length;
    
    respuesta.progreso = {
      jugadoresTotal: totalJugadores,
      respuestasRecibidas: Object.keys(sesion.respuestas || {}).length,
      adivinanzasRecibidas: Object.keys(sesion.adivinanzas || {}).length
    };

    // Si se proporciona userId, incluir info específica del jugador
    if (userId) {
      if (!sesion.puntuaciones.hasOwnProperty(userId)) {
        return error('El usuario no está en esta partida', 403);
      }

      respuesta.jugador = {
        userId,
        puntuacion: sesion.puntuaciones[userId],
        haRespondido: !!(sesion.respuestas && sesion.respuestas[userId]),
        haAdivinado: !!(sesion.adivinanzas && sesion.adivinanzas[userId])
      };

      // Si ya respondió, mostrar su respuesta
      if (sesion.respuestas && sesion.respuestas[userId]) {
        respuesta.jugador.respuesta = sesion.respuestas[userId];
      }

      // Si ya adivinó, mostrar su adivinanza
      if (sesion.adivinanzas && sesion.adivinanzas[userId]) {
        respuesta.jugador.adivinanza = sesion.adivinanzas[userId];
      }
    }

    return success(respuesta);

  } catch (err) {
    console.error('Error al obtener estado:', err);
    return error('Error interno al obtener estado', 500);
  }
};