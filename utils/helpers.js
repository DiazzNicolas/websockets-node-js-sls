import { v4 as uuidv4 } from 'uuid';

// ==========================================
// GENERADORES DE IDs
// ==========================================

/**
 * Generar ID único
 */
export function generateId(prefix = '') {
  const uuid = uuidv4();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

/**
 * Generar ID de usuario
 */
export function generateUserId() {
  return generateId('user');
}

/**
 * Generar ID de sala
 */
export function generateRoomId() {
  return generateId('room');
}

/**
 * Generar ID de pregunta
 */
export function generateQuestionId() {
  return generateId('q');
}

/**
 * Generar ID de sesión de juego
 */
export function generateSessionId() {
  return generateId('session');
}

/**
 * Generar ID de partida (historial)
 */
export function generateGameId() {
  return generateId('game');
}

// ==========================================
// UTILIDADES DE ARRAYS
// ==========================================

export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function randomSample(array, count) {
  if (count >= array.length) {
    return shuffleArray(array);
  }

  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

export function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// ==========================================
// UTILIDADES DE OBJETOS
// ==========================================

export function removeUndefined(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

export function omit(obj, keys) {
  const keysToOmit = new Set(keys);
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (!keysToOmit.has(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

// ==========================================
// UTILIDADES DE TIEMPO
// ==========================================

export function now() {
  return Date.now();
}

export function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

export function hasExpired(startTime, durationSeconds) {
  const currentTime = now();
  const elapsedSeconds = (currentTime - startTime) / 1000;
  return elapsedSeconds >= durationSeconds;
}

export function remainingTime(startTime, durationSeconds) {
  const currentTime = now();
  const elapsedSeconds = (currentTime - startTime) / 1000;
  const remaining = durationSeconds - elapsedSeconds;
  return Math.max(0, Math.floor(remaining));
}

export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// ==========================================
// UTILIDADES DE JUEGO
// ==========================================

export function selectRandomTarget(userId, playerIds) {
  const availableTargets = playerIds.filter(id => id !== userId);
  if (availableTargets.length === 0) return null;
  return randomElement(availableTargets);
}

export function calculateScore(correctGuesses, pointsPerGuess) {
  return correctGuesses * pointsPerGuess;
}

export function determineWinners(puntuaciones) {
  if (!puntuaciones || Object.keys(puntuaciones).length === 0) {
    return [];
  }

  const maxScore = Math.max(...Object.values(puntuaciones));

  return Object.entries(puntuaciones)
    .filter(([_, score]) => score === maxScore)
    .map(([userId]) => userId);
}

export function createPlayerSummary(user, additionalFields = {}) {
  return {
    userId: user.userId,
    nombre: user.nombre,
    avatarUrl: user.avatarUrl || null,
    ...additionalFields,
  };
}

export function createRoomSummary(room) {
  return {
    roomId: room.roomId,
    nombre: room.nombre,
    hostUserId: room.hostUserId,
    jugadoresActuales: room.jugadores?.length || 0,
    maxJugadores: room.maxJugadores,
    estado: room.estado,
    configuracion: room.configuracion,
    createdAt: room.createdAt,
  };
}

// ==========================================
// UTILIDADES DE VALIDACIÓN
// ==========================================

export function isEmptyArray(value) {
  return Array.isArray(value) && value.length === 0;
}

export function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

export function allPlayersCompleted(players, completedMap) {
  return players.every(player => Object.prototype.hasOwnProperty.call(completedMap, player.userId));
}

export function countCompleted(completedMap) {
  return Object.keys(completedMap).length;
}

// ==========================================
// UTILIDADES DE STRING
// ==========================================

export function normalizeString(str) {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function compareStrings(str1, str2) {
  return normalizeString(str1) === normalizeString(str2);
}

export function truncate(str, maxLength, suffix = '...') {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - suffix.length) + suffix;
}

// ==========================================
// UTILIDADES DE PAGINACIÓN
// ==========================================

export function createPaginatedResponse(items, total, page, pageSize) {
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
    },
  };
}

// ==========================================
// DELAY / SLEEP
// ==========================================

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
