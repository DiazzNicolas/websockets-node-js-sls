import { getItem, updateItem } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';
import { success, error, notFound } from '../utils/response.js';

/**
 * POST /juego/{sessionId}/responder
 * Un jugador envía su respuesta a la pregunta actual
 * 
 * Path params:
 * - sessionId: ID de la sesión
 * 
 * Body:
 * {
 *   userId: "user-xxx",
 *   respuesta: "Azul"
 * }
 */
export const handler = async (event) => {
  try {
    const sessionId = event.pathParameters?.sessionId;
    const body = JSON.parse(event.body || '{}');
    const { userId, respuesta } = body;

    // Validaciones
    if (!sessionId) {
      return error('El parámetro "sessionId" es obligatorio', 400);
    }

    if (!userId || !respuesta) {
      return error('Los campos "userId" y "respuesta" son obligatorios', 400);
    }

    // Obtener sesión
    const sesion = await getItem(TABLES.GAME_SESSIONS, { sessionId });

    if (!sesion) {
      return notFound('Sesión de juego no encontrada');
    }

    // Validar estado y fase
    if (sesion.estado !== 'activa') {
      return error('La sesión no está activa', 400);
    }

    if (sesion.faseActual !== 'respondiendo') {
      return error('No es el momento de responder. Fase actual: ' + sesion.faseActual, 400);
    }

    // Validar que el usuario esté en la partida
    const esJugador = sesion.puntuaciones.hasOwnProperty(userId);
    if (!esJugador) {
      return error('El usuario no está en esta partida', 403);
    }

    // Validar que no haya respondido ya
    if (sesion.respuestas && sesion.respuestas[userId]) {
      return error('Ya has enviado tu respuesta para esta ronda', 400);
    }

    // Obtener pregunta para validar la respuesta
    const pregunta = await getItem(TABLES.QUESTIONS, { questionId: sesion.preguntaActual });

    if (!pregunta) {
      return error('Pregunta no encontrada', 404);
    }

    // Validar que la respuesta sea una de las opciones válidas
    if (!pregunta.opciones.includes(respuesta)) {
      return error('La respuesta debe ser una de las opciones válidas: ' + pregunta.opciones.join(', '), 400);
    }

    // Guardar respuesta
    const respuestasActualizadas = {
      ...(sesion.respuestas || {}),
      [userId]: respuesta
    };

    await updateItem(
      TABLES.GAME_SESSIONS,
      { sessionId },
      {
        respuestas: respuestasActualizadas,
        updatedAt: new Date().toISOString()
      }
    );

    // Contar cuántos han respondido
    const totalJugadores = Object.keys(sesion.puntuaciones).length;
    const jugadoresRespondidos = Object.keys(respuestasActualizadas).length;

    return success({
      message: 'Respuesta registrada exitosamente',
      userId,
      respuesta,
      progreso: {
        respondidos: jugadoresRespondidos,
        total: totalJugadores,
        faltantes: totalJugadores - jugadoresRespondidos
      },
      todosRespondieron: jugadoresRespondidos === totalJugadores,
      instrucciones: jugadoresRespondidos === totalJugadores 
        ? 'Todos han respondido. Usa POST /juego/{sessionId}/fase-respuestas/finalizar para continuar'
        : `Esperando ${totalJugadores - jugadoresRespondidos} respuesta(s) más`
    });

  } catch (err) {
    console.error('Error al enviar respuesta:', err);
    return error('Error interno al enviar respuesta', 500);
  }
};