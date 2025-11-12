// ==========================================
// TABLAS DYNAMODB
// ==========================================
export const TABLES = {
  USERS: process.env.USERS_TABLE,
  ROOMS: process.env.ROOMS_TABLE,
  QUESTIONS: process.env.QUESTIONS_TABLE,
  GAME_SESSIONS: process.env.GAME_SESSIONS_TABLE,
  CONNECTIONS: process.env.CONNECTIONS_TABLE,
  GAME_HISTORY: process.env.GAME_HISTORY_TABLE,
};

// ==========================================
// ÍNDICES DE DYNAMODB
// ==========================================
export const INDEXES = {
  ROOMS: {
    ESTADO_CREATED_AT: 'EstadoCreatedAtIndex',
  },
  QUESTIONS: {
    TOPIC: 'TopicIndex',
    CATEGORIA: 'CategoriaIndex',
  },
  GAME_SESSIONS: {
    ROOM_ID: 'RoomIdIndex',
  },
  CONNECTIONS: {
    ROOM_ID: 'RoomIdIndex',
    USER_ID: 'UserIdIndex',
  },
  GAME_HISTORY: {
    USER_ID_TIMESTAMP: 'UserIdTimestampIndex',
  },
};

// ==========================================
// ESTADOS DE SALA
// ==========================================
export const ROOM_STATUS = {
  WAITING: 'esperando',
  IN_GAME: 'en_juego',
  FINISHED: 'finalizada',
};

// ==========================================
// ESTADOS DE SESIÓN DE JUEGO
// ==========================================
export const GAME_STATUS = {
  ACTIVE: 'activa',
  FINISHED: 'finalizada',
};

// ==========================================
// FASES DE LA PARTIDA
// ==========================================
export const GAME_PHASE = {
  ANSWERING: 'respondiendo',
  GUESSING: 'adivinando',
  FINISHED: 'finalizada',
};

// ==========================================
// CONFIGURACIÓN DE PARTIDA
// ==========================================
export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 8,

  // Opciones de número de preguntas
  QUESTIONS_OPTIONS: [10, 15, 20],
  DEFAULT_QUESTIONS: 10,

  // Tiempos (en segundos)
  DEFAULT_ANSWER_TIME: 150, // 2.5 minutos
  DEFAULT_GUESS_TIME: 150,
  MIN_TIME: 60, // 1 minuto
  MAX_TIME: 300, // 5 minutos

  // Puntuación
  DEFAULT_POINTS_CORRECT_GUESS: 10,
  MIN_POINTS: 5,
  MAX_POINTS: 20,

  // Opciones de respuesta
  OPTIONS_PER_QUESTION: 4,
};

// ==========================================
// TOPICS DISPONIBLES
// ==========================================
export const TOPICS = {
  GENERAL: 'cultura-general',
  MUSIC: 'musica',
  SPORTS: 'deportes',
  MOVIES: 'cine-series',
  FOOD: 'comida',
  TRAVEL: 'viajes',
  TECHNOLOGY: 'tecnologia',
  NATURE: 'naturaleza',
  HISTORY: 'historia',
  PERSONAL: 'personal',
};

export const TOPIC_LABELS = {
  [TOPICS.GENERAL]: 'Cultura General',
  [TOPICS.MUSIC]: 'Música',
  [TOPICS.SPORTS]: 'Deportes',
  [TOPICS.MOVIES]: 'Cine y Series',
  [TOPICS.FOOD]: 'Comida',
  [TOPICS.TRAVEL]: 'Viajes',
  [TOPICS.TECHNOLOGY]: 'Tecnología',
  [TOPICS.NATURE]: 'Naturaleza',
  [TOPICS.HISTORY]: 'Historia',
  [TOPICS.PERSONAL]: 'Personal',
};

// ==========================================
// CATEGORÍAS DE PREGUNTAS
// ==========================================
export const QUESTION_CATEGORIES = {
  PREFERENCES: 'preferencias',
  HYPOTHETICAL: 'hipoteticas',
  PERSONAL: 'personales',
};

export const CATEGORY_LABELS = {
  [QUESTION_CATEGORIES.PREFERENCES]: 'Preferencias',
  [QUESTION_CATEGORIES.HYPOTHETICAL]: 'Hipotéticas',
  [QUESTION_CATEGORIES.PERSONAL]: 'Personales',
};

// ==========================================
// WEBSOCKET
// ==========================================
export const WEBSOCKET_EVENTS = {
  // Cliente -> Servidor
  CONNECT: '$connect',
  DISCONNECT: '$disconnect',
  DEFAULT: '$default',
  GAME_EVENT: 'gameEvent',

  // Servidor -> Cliente
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  GAME_STARTED: 'game_started',
  ROUND_STARTED: 'round_started',
  PHASE_CHANGED: 'phase_changed',
  PLAYER_ANSWERED: 'player_answered',
  PLAYER_GUESSED: 'player_guessed',
  ROUND_ENDED: 'round_ended',
  GAME_ENDED: 'game_ended',
  CONFIG_UPDATED: 'config_updated',
  ERROR: 'error',
};

// ==========================================
// TTL (Time To Live) en horas
// ==========================================
export const TTL = {
  ROOM: 24, // 24 horas
  GAME_SESSION: 2, // 2 horas
  CONNECTION: 6, // 6 horas
};

// ==========================================
// CÓDIGOS DE ERROR
// ==========================================
export const ERROR_CODES = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',

  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',

  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  ROOM_IN_GAME: 'ROOM_IN_GAME',
  NOT_HOST: 'NOT_HOST',
  PLAYER_NOT_IN_ROOM: 'PLAYER_NOT_IN_ROOM',
  PLAYER_ALREADY_IN_ROOM: 'PLAYER_ALREADY_IN_ROOM',

  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  GAME_ALREADY_STARTED: 'GAME_ALREADY_STARTED',
  NOT_ENOUGH_PLAYERS: 'NOT_ENOUGH_PLAYERS',
  INVALID_PHASE: 'INVALID_PHASE',
  ALREADY_ANSWERED: 'ALREADY_ANSWERED',
  ALREADY_GUESSED: 'ALREADY_GUESSED',
  TIME_EXPIRED: 'TIME_EXPIRED',
  INVALID_OPTION: 'INVALID_OPTION',

  QUESTION_NOT_FOUND: 'QUESTION_NOT_FOUND',
  NOT_ENOUGH_QUESTIONS: 'NOT_ENOUGH_QUESTIONS',
  INVALID_TOPIC: 'INVALID_TOPIC',
};

// ==========================================
// MENSAJES DE ERROR
// ==========================================
export const ERROR_MESSAGES = {
  [ERROR_CODES.INTERNAL_ERROR]: 'Error interno del servidor',
  [ERROR_CODES.VALIDATION_ERROR]: 'Datos de entrada inválidos',
  [ERROR_CODES.NOT_FOUND]: 'Recurso no encontrado',
  [ERROR_CODES.UNAUTHORIZED]: 'No autorizado',

  [ERROR_CODES.USER_NOT_FOUND]: 'Usuario no encontrado',
  [ERROR_CODES.USER_ALREADY_EXISTS]: 'El usuario ya existe',

  [ERROR_CODES.ROOM_NOT_FOUND]: 'Sala no encontrada',
  [ERROR_CODES.ROOM_FULL]: 'La sala está llena',
  [ERROR_CODES.ROOM_IN_GAME]: 'La sala ya está en juego',
  [ERROR_CODES.NOT_HOST]: 'Solo el host puede realizar esta acción',
  [ERROR_CODES.PLAYER_NOT_IN_ROOM]: 'El jugador no está en la sala',
  [ERROR_CODES.PLAYER_ALREADY_IN_ROOM]: 'El jugador ya está en la sala',

  [ERROR_CODES.GAME_NOT_FOUND]: 'Partida no encontrada',
  [ERROR_CODES.GAME_ALREADY_STARTED]: 'La partida ya ha comenzado',
  [ERROR_CODES.NOT_ENOUGH_PLAYERS]: 'No hay suficientes jugadores',
  [ERROR_CODES.INVALID_PHASE]: 'Fase de juego inválida',
  [ERROR_CODES.ALREADY_ANSWERED]: 'Ya has respondido en esta ronda',
  [ERROR_CODES.ALREADY_GUESSED]: 'Ya has adivinado en esta ronda',
  [ERROR_CODES.TIME_EXPIRED]: 'El tiempo ha expirado',
  [ERROR_CODES.INVALID_OPTION]: 'Opción inválida',

  [ERROR_CODES.QUESTION_NOT_FOUND]: 'Pregunta no encontrada',
  [ERROR_CODES.NOT_ENOUGH_QUESTIONS]:
    'No hay suficientes preguntas disponibles para el topic seleccionado',
  [ERROR_CODES.INVALID_TOPIC]: 'Topic inválido',
};

// ==========================================
// VALIDACIONES
// ==========================================
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ\s]+$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  ROOM_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
  },
  QUESTION_TEXT: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 200,
  },
  OPTION_TEXT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
};
export const ERRORS = ERROR_MESSAGES;