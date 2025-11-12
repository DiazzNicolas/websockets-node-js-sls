import { getItem } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';
import { success, error, notFound } from '../utils/response.js';

/**
 * GET /juego/{sessionId}/ranking
 * Obtiene el ranking detallado de una partida específica
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

    // Obtener sala para info adicional
    const sala = await getItem(TABLES.ROOMS, { roomId: sesion.roomId });

    // Ranking actual/final
    const ranking = sesion.rankingActual || [];

    // Calcular posiciones
    const rankingConPosiciones = ranking.map((jugador, index) => ({
      posicion: index + 1,
      ...jugador,
      esPrimero: index === 0,
      esUltimo: index === ranking.length - 1
    }));

    // Información detallada por jugador
    const detalleJugadores = ranking.map(jugador => {
      // Contar aciertos en el historial
      let aciertos = 0;
      let fallos = 0;

      if (sesion.historialRondas) {
        sesion.historialRondas.forEach(ronda => {
          const resultado = ronda.resultados?.find(r => r.userId === jugador.userId);
          if (resultado) {
            if (resultado.acierto) aciertos++;
            else fallos++;
          }
        });
      }

      return {
        userId: jugador.userId,
        nombre: jugador.nombre,
        avatarUrl: jugador.avatarUrl,
        puntuacion: jugador.puntuacion,
        aciertos,
        fallos,
        totalRondas: sesion.preguntasIds.length,
        porcentajeAcierto: sesion.preguntasIds.length > 0 
          ? Math.round((aciertos / sesion.preguntasIds.length) * 100) 
          : 0
      };
    });

    return success({
      sessionId,
      roomId: sesion.roomId,
      nombreSala: sala?.nombre || 'Sala sin nombre',
      estado: sesion.estado,
      ranking: rankingConPosiciones,
      detalleJugadores,
      estadisticas: {
        totalRondas: sesion.preguntasIds.length,
        rondasJugadas: sesion.rondaActual,
        topic: sesion.topic,
        puntuacionMaxima: ranking[0]?.puntuacion || 0,
        puntuacionMinima: ranking[ranking.length - 1]?.puntuacion || 0,
        tiempoTotal: sesion.finalizadoEn 
          ? Date.now() - sesion.tiempoInicioPartida 
          : null
      },
      ganador: ranking[0] ? {
        userId: ranking[0].userId,
        nombre: ranking[0].nombre,
        avatarUrl: ranking[0].avatarUrl,
        puntuacion: ranking[0].puntuacion
      } : null
    });

  } catch (err) {
    console.error('Error al obtener ranking:', err);
    return error('Error interno al obtener ranking', 500);
  }
};