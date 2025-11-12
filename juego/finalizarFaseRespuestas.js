import { getItem, updateItem } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';
import { success, error, notFound } from '../utils/response.js';

/**
 * POST /juego/{sessionId}/fase-respuestas/finalizar
 * Finaliza la fase de respuestas y pasa a la fase de adivinanzas
 * 
 * Path params:
 * - sessionId: ID de la sesión
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

    // Validar estado y fase
    if (sesion.estado !== 'activa') {
      return error('La sesión no está activa', 400);
    }

    if (sesion.faseActual !== 'respondiendo') {
      return error('No estás en la fase de respuestas. Fase actual: ' + sesion.faseActual, 400);
    }

    // Validar que todos hayan respondido
    const totalJugadores = Object.keys(sesion.puntuaciones).length;
    const jugadoresRespondidos = Object.keys(sesion.respuestas || {}).length;

    if (jugadoresRespondidos < totalJugadores) {
      return error(`Aún faltan ${totalJugadores - jugadoresRespondidos} jugador(es) por responder`, 400);
    }

    // Obtener sala para info de jugadores
    const sala = await getItem(TABLES.ROOMS, { roomId: sesion.roomId });

    // Crear lista de jugadores con sus respuestas (sin revelar quién respondió qué)
    const jugadoresParaAdivinar = Object.keys(sesion.respuestas).map(uid => {
      const jugadorInfo = sala?.jugadores?.find(j => j.userId === uid);
      return {
        userId: uid,
        nombre: jugadorInfo?.nombre || 'Jugador desconocido',
        avatarUrl: jugadorInfo?.avatarUrl || null
      };
    });

    // Cambiar a fase de adivinanza
    await updateItem(
      TABLES.GAME_SESSIONS,
      { sessionId },
      {
        faseActual: 'adivinando',
        updatedAt: new Date().toISOString()
      }
    );

    // Obtener pregunta
    const pregunta = await getItem(TABLES.QUESTIONS, { questionId: sesion.preguntaActual });

    return success({
      message: 'Fase de respuestas finalizada. Comienza la fase de adivinanzas',
      fase: 'adivinando',
      pregunta: {
        texto: pregunta?.texto,
        opciones: pregunta?.opciones
      },
      jugadores: jugadoresParaAdivinar,
      instrucciones: 'Cada jugador debe adivinar qué respondió otro jugador usando POST /juego/{sessionId}/adivinar'
    });

  } catch (err) {
    console.error('Error al finalizar fase de respuestas:', err);
    return error('Error interno al finalizar fase de respuestas', 500);
  }
};