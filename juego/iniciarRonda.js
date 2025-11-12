import { getItem, updateItem } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';
import { success, error, notFound } from '../utils/response.js';

/**
 * POST /juego/{sessionId}/ronda
 * Inicia una nueva ronda en la partida
 * Avanza a la siguiente pregunta y resetea respuestas/adivinanzas
 * 
 * Path params:
 * - sessionId: ID de la sesión de juego
 */
export const handler = async (event) => {
  try {
    const sessionId = event.pathParameters?.sessionId;

    if (!sessionId) {
      return error('El parámetro "sessionId" es obligatorio', 400);
    }

    // Obtener sesión
    const sesion = await getItem(TABLES.GAME_SESSIONS, { sessionId });

    if (!sesion) {
      return notFound('Sesión de juego no encontrada');
    }

    // Validar estado de la sesión
    if (sesion.estado !== 'activa') {
      return error('La sesión no está activa', 400);
    }

    // Validar que no estemos en medio de una ronda
    if (sesion.faseActual === 'respondiendo' || sesion.faseActual === 'adivinando') {
      return error('Ya hay una ronda en curso. Finaliza la fase actual primero', 400);
    }

    // Validar que no hayamos terminado todas las preguntas
    const siguienteRonda = sesion.rondaActual + 1;
    
    if (siguienteRonda > sesion.preguntasIds.length) {
      return error('Ya se han jugado todas las rondas. Finaliza la partida', 400);
    }

    // Obtener la siguiente pregunta
    const siguientePreguntaId = sesion.preguntasIds[sesion.rondaActual];
    
    const pregunta = await getItem(TABLES.QUESTIONS, { questionId: siguientePreguntaId });

    if (!pregunta) {
      return error('Pregunta no encontrada', 404);
    }

    // Actualizar sesión para iniciar nueva ronda
    await updateItem(
      TABLES.GAME_SESSIONS,
      { sessionId },
      {
        rondaActual: siguienteRonda,
        preguntaActual: siguientePreguntaId,
        faseActual: 'respondiendo',
        respuestas: {},
        adivinanzas: {},
        tiempoInicioRonda: Date.now(),
        updatedAt: new Date().toISOString()
      }
    );

    // Incrementar contador de uso de la pregunta
    await updateItem(
      TABLES.QUESTIONS,
      { questionId: siguientePreguntaId },
      {
        vecesUsada: (pregunta.vecesUsada || 0) + 1
      }
    );

    return success({
      message: 'Nueva ronda iniciada',
      ronda: siguienteRonda,
      totalRondas: sesion.preguntasIds.length,
      fase: 'respondiendo',
      pregunta: {
        questionId: pregunta.questionId,
        texto: pregunta.texto,
        opciones: pregunta.opciones,
        categoria: pregunta.categoria
      },
      instrucciones: 'Los jugadores deben enviar sus respuestas usando POST /juego/{sessionId}/responder'
    });

  } catch (err) {
    console.error('Error al iniciar ronda:', err);
    return error('Error interno al iniciar ronda', 500);
  }
};