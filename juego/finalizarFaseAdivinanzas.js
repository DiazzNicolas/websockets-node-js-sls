import { getItem, updateItem } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';
import { success, error, notFound } from '../utils/response.js';

/**
 * POST /juego/{sessionId}/fase-adivinanzas/finalizar
 * Finaliza la fase de adivinanzas, calcula puntos y actualiza el ranking
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

    if (sesion.faseActual !== 'adivinando') {
      return error('No estás en la fase de adivinanzas. Fase actual: ' + sesion.faseActual, 400);
    }

    // Validar que todos hayan adivinado
    const totalJugadores = Object.keys(sesion.puntuaciones).length;
    const jugadoresAdivinados = Object.keys(sesion.adivinanzas || {}).length;

    if (jugadoresAdivinados < totalJugadores) {
      return error(`Aún faltan ${totalJugadores - jugadoresAdivinados} jugador(es) por adivinar`, 400);
    }

    // Obtener sala para configuración y datos de jugadores
    const sala = await getItem(TABLES.ROOMS, { roomId: sesion.roomId });
    const puntosAdivinanza = sala?.configuracion?.puntosAdivinanzaCorrecta || 10;

    // Calcular puntos
    const puntuacionesActualizadas = { ...sesion.puntuaciones };
    const resultadosRonda = [];

    for (const [userId, adivinanza] of Object.entries(sesion.adivinanzas)) {
      const targetUserId = adivinanza.target;
      const respuestaReal = sesion.respuestas[targetUserId];
      const adivinanzaUsuario = adivinanza.adivinanza;
      
      const acierto = respuestaReal === adivinanzaUsuario;

      if (acierto) {
        puntuacionesActualizadas[userId] += puntosAdivinanza;
      }

      const jugadorInfo = sala?.jugadores?.find(j => j.userId === userId);
      const targetInfo = sala?.jugadores?.find(j => j.userId === targetUserId);

      resultadosRonda.push({
        userId,
        nombre: jugadorInfo?.nombre || 'Jugador',
        targetUserId,
        targetNombre: targetInfo?.nombre || 'Jugador',
        adivinanza: adivinanzaUsuario,
        respuestaReal,
        acierto,
        puntosGanados: acierto ? puntosAdivinanza : 0
      });
    }

    // Crear ranking actualizado
    const rankingActual = Object.entries(puntuacionesActualizadas)
      .map(([uid, puntos]) => {
        const jugadorInfo = sala?.jugadores?.find(j => j.userId === uid);
        return {
          userId: uid,
          nombre: jugadorInfo?.nombre || 'Jugador',
          avatarUrl: jugadorInfo?.avatarUrl || null,
          puntuacion: puntos
        };
      })
      .sort((a, b) => b.puntuacion - a.puntuacion); // Ordenar de mayor a menor

    // Guardar historial de la ronda
    const historialRondas = [
      ...(sesion.historialRondas || []),
      {
        ronda: sesion.rondaActual,
        preguntaId: sesion.preguntaActual,
        respuestas: sesion.respuestas,
        adivinanzas: sesion.adivinanzas,
        resultados: resultadosRonda,
        timestamp: new Date().toISOString()
      }
    ];

    // Actualizar sesión
    await updateItem(
      TABLES.GAME_SESSIONS,
      { sessionId },
      {
        faseActual: 'finalizada', // Esta ronda está finalizada
        puntuaciones: puntuacionesActualizadas,
        rankingActual,
        historialRondas,
        updatedAt: new Date().toISOString()
      }
    );

    return success({
      message: 'Fase de adivinanzas finalizada',
      resultados: resultadosRonda,
      ranking: rankingActual,
      rondaActual: sesion.rondaActual,
      totalRondas: sesion.preguntasIds.length,
      siguientePaso: sesion.rondaActual < sesion.preguntasIds.length
        ? 'Usa POST /juego/{sessionId}/ronda para la siguiente pregunta'
        : 'Usa POST /juego/{sessionId}/finalizar para terminar la partida'
    });

  } catch (err) {
    console.error('Error al finalizar fase de adivinanzas:', err);
    return error('Error interno al finalizar fase de adivinanzas', 500);
  }
};