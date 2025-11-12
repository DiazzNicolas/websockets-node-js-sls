import { getItem, updateItem } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';
import { success, error, notFound } from '../utils/response.js';

/**
 * POST /juego/{sessionId}/adivinar
 * Un jugador intenta adivinar la respuesta de otro jugador
 * 
 * Path params:
 * - sessionId: ID de la sesión
 * 
 * Body:
 * {
 *   userId: "user-xxx",           // Quien adivina
 *   targetUserId: "user-yyy",      // A quién le adivina
 *   adivinanza: "Azul"             // Qué cree que respondió
 * }
 */
export const handler = async (event) => {
  try {
    const sessionId = event.pathParameters?.sessionId;
    const body = JSON.parse(event.body || '{}');
    const { userId, targetUserId, adivinanza } = body;

    // Validaciones
    if (!sessionId) {
      return error('El parámetro "sessionId" es obligatorio', 400);
    }

    if (!userId || !targetUserId || !adivinanza) {
      return error('Los campos "userId", "targetUserId" y "adivinanza" son obligatorios', 400);
    }

    // No puedes adivinarte a ti mismo
    if (userId === targetUserId) {
      return error('No puedes adivinar tu propia respuesta', 400);
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

    if (sesion.faseActual !== 'adivinando') {
      return error('No es el momento de adivinar. Fase actual: ' + sesion.faseActual, 400);
    }

    // Validar que ambos usuarios estén en la partida
    if (!sesion.puntuaciones.hasOwnProperty(userId)) {
      return error('El usuario no está en esta partida', 403);
    }

    if (!sesion.puntuaciones.hasOwnProperty(targetUserId)) {
      return error('El usuario objetivo no está en esta partida', 404);
    }

    // Validar que el usuario objetivo haya respondido
    if (!sesion.respuestas || !sesion.respuestas[targetUserId]) {
      return error('El usuario objetivo no ha respondido aún', 400);
    }

    // Validar que no haya adivinado ya
    if (sesion.adivinanzas && sesion.adivinanzas[userId]) {
      return error('Ya has enviado tu adivinanza para esta ronda', 400);
    }

    // Obtener pregunta para validar opciones
    const pregunta = await getItem(TABLES.QUESTIONS, { questionId: sesion.preguntaActual });

    if (!pregunta || !pregunta.opciones.includes(adivinanza)) {
      return error('La adivinanza debe ser una de las opciones válidas', 400);
    }

    // Guardar adivinanza
    const adivinanzasActualizadas = {
      ...(sesion.adivinanzas || {}),
      [userId]: {
        target: targetUserId,
        adivinanza: adivinanza
      }
    };

    await updateItem(
      TABLES.GAME_SESSIONS,
      { sessionId },
      {
        adivinanzas: adivinanzasActualizadas,
        updatedAt: new Date().toISOString()
      }
    );

    // Contar progreso
    const totalJugadores = Object.keys(sesion.puntuaciones).length;
    const jugadoresAdivinados = Object.keys(adivinanzasActualizadas).length;

    return success({
      message: 'Adivinanza registrada exitosamente',
      userId,
      targetUserId,
      progreso: {
        adivinados: jugadoresAdivinados,
        total: totalJugadores,
        faltantes: totalJugadores - jugadoresAdivinados
      },
      todosAdivinaron: jugadoresAdivinados === totalJugadores,
      instrucciones: jugadoresAdivinados === totalJugadores
        ? 'Todos han adivinado. Usa POST /juego/{sessionId}/fase-adivinanzas/finalizar para calcular puntos'
        : `Esperando ${totalJugadores - jugadoresAdivinados} adivinanza(s) más`
    });

  } catch (err) {
    console.error('Error al enviar adivinanza:', err);
    return error('Error interno al enviar adivinanza', 500);
  }
};