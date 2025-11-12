import { getItem, updateItem } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';
import { success, error, notFound } from '../utils/response.js';

/**
 * POST /juego/{sessionId}/finalizar
 * Finaliza la partida completa y declara al ganador
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

    // Validar que la partida esté activa
    if (sesion.estado !== 'activa') {
      return error('La partida ya fue finalizada', 400);
    }

    // Validar que se hayan jugado todas las rondas
    if (sesion.rondaActual < sesion.preguntasIds.length) {
      return error(`Aún faltan ${sesion.preguntasIds.length - sesion.rondaActual} ronda(s) por jugar`, 400);
    }

    // Validar que la última ronda esté finalizada
    if (sesion.faseActual !== 'finalizada') {
      return error('Debes finalizar la última ronda antes de terminar la partida', 400);
    }

    // Obtener sala
    const sala = await getItem(TABLES.ROOMS, { roomId: sesion.roomId });

    // Calcular estadísticas finales
    const rankingFinal = sesion.rankingActual || [];
    const ganador = rankingFinal[0] || null;
    
    const estadisticas = {
      totalRondas: sesion.preguntasIds.length,
      tiempoTotal: Date.now() - sesion.tiempoInicioPartida,
      jugadores: rankingFinal.length,
      puntuacionMaxima: ganador?.puntuacion || 0,
      puntuacionMinima: rankingFinal[rankingFinal.length - 1]?.puntuacion || 0,
      promedioAciertos: Object.values(sesion.puntuaciones).reduce((a, b) => a + b, 0) / rankingFinal.length
    };

    const timestamp = new Date().toISOString();

    // Actualizar sesión
    await updateItem(
      TABLES.GAME_SESSIONS,
      { sessionId },
      {
        estado: 'finalizada',
        faseActual: 'finalizada',
        estadisticas,
        finalizadoEn: timestamp,
        updatedAt: timestamp
      }
    );

    // Actualizar sala
    await updateItem(
      TABLES.ROOMS,
      { roomId: sesion.roomId },
      {
        estado: 'finalizada',
        updatedAt: timestamp
      }
    );

    return success({
      message: '🎉 ¡Partida finalizada!',
      ganador: ganador ? {
        userId: ganador.userId,
        nombre: ganador.nombre,
        avatarUrl: ganador.avatarUrl,
        puntuacion: ganador.puntuacion
      } : null,
      rankingFinal,
      estadisticas,
      instrucciones: 'Usa GET /juego/{sessionId}/ranking para ver el ranking detallado'
    });

  } catch (err) {
    console.error('Error al finalizar partida:', err);
    return error('Error interno al finalizar partida', 500);
  }
};