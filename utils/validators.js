import {
  VALIDATION,
  GAME_CONFIG,
  TOPICS,
  QUESTION_CATEGORIES,
  ROOM_STATUS,
  GAME_PHASE,
} from './constants.js';

// ==========================================
// VALIDADORES BÁSICOS
// ==========================================

/**
 * Validar que un campo sea requerido
 */
export function required(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} es requerido`;
  }
  return null;
}

/**
 * Validar string no vacío
 */
export function isNonEmptyString(value, fieldName) {
  const requiredError = required(value, fieldName);
  if (requiredError) return requiredError;
  
  if (typeof value !== 'string' || value.trim().length === 0) {
    return `${fieldName} debe ser un texto válido`;
  }
  return null;
}

/**
 * Validar longitud de string
 */
export function stringLength(value, fieldName, minLength, maxLength) {
  const stringError = isNonEmptyString(value, fieldName);
  if (stringError) return stringError;
  
  const trimmed = value.trim();
  if (minLength && trimmed.length < minLength) {
    return `${fieldName} debe tener al menos ${minLength} caracteres`;
  }
  if (maxLength && trimmed.length > maxLength) {
    return `${fieldName} debe tener máximo ${maxLength} caracteres`;
  }
  return null;
}

/**
 * Validar patrón regex
 */
export function matchesPattern(value, fieldName, pattern, message) {
  const stringError = isNonEmptyString(value, fieldName);
  if (stringError) return stringError;
  
  if (!pattern.test(value)) {
    return message || `${fieldName} tiene un formato inválido`;
  }
  return null;
}

/**
 * Validar número en rango
 */
export function isNumberInRange(value, fieldName, min, max) {
  if (typeof value !== 'number' || isNaN(value)) {
    return `${fieldName} debe ser un número válido`;
  }
  if (min !== undefined && value < min) {
    return `${fieldName} debe ser al menos ${min}`;
  }
  if (max !== undefined && value > max) {
    return `${fieldName} debe ser máximo ${max}`;
  }
  return null;
}

/**
 * Validar que sea un array
 */
export function isArray(value, fieldName) {
  if (!Array.isArray(value)) {
    return `${fieldName} debe ser un array`;
  }
  return null;
}

/**
 * Validar longitud de array
 */
export function arrayLength(value, fieldName, minLength, maxLength) {
  const arrayError = isArray(value, fieldName);
  if (arrayError) return arrayError;
  
  if (minLength !== undefined && value.length < minLength) {
    return `${fieldName} debe tener al menos ${minLength} elementos`;
  }
  if (maxLength !== undefined && value.length > maxLength) {
    return `${fieldName} debe tener máximo ${maxLength} elementos`;
  }
  return null;
}

/**
 * Validar que sea uno de los valores permitidos
 */
export function isOneOf(value, fieldName, allowedValues) {
  if (!allowedValues.includes(value)) {
    return `${fieldName} debe ser uno de: ${allowedValues.join(', ')}`;
  }
  return null;
}

// ==========================================
// VALIDADORES DE DOMINIO
// ==========================================

/**
 * Validar nombre de usuario
 */
export function validateUsername(username) {
  const errors = [];
  
  const lengthError = stringLength(
    username,
    'Nombre de usuario',
    VALIDATION.USERNAME.MIN_LENGTH,
    VALIDATION.USERNAME.MAX_LENGTH
  );
  if (lengthError) errors.push(lengthError);
  
  const patternError = matchesPattern(
    username,
    'Nombre de usuario',
    VALIDATION.USERNAME.PATTERN,
    'El nombre de usuario solo puede contener letras, números, guiones bajos y espacios'
  );
  if (patternError) errors.push(patternError);
  
  return errors;
}

/**
 * Vacio
 */
export function isEmpty(value) {
  return value === undefined || value === null || value === '' || 
         (typeof value === 'string' && value.trim() === '');
}
/**
 * Validar email
 */
export function validateEmail(email) {
  const errors = [];
  
  const stringError = isNonEmptyString(email, 'Email');
  if (stringError) {
    errors.push(stringError);
    return errors;
  }
  
  const patternError = matchesPattern(
    email,
    'Email',
    VALIDATION.EMAIL.PATTERN,
    'Email inválido'
  );
  if (patternError) errors.push(patternError);
  
  return errors;
}

/**
 * Validar creación de usuario
 */
export function validateCreateUser(data) {
  const errors = [];
  
  // Nombre
  const requiredError = required(data.nombre, 'Nombre');
  if (requiredError) {
    errors.push(requiredError);
  } else {
    errors.push(...validateUsername(data.nombre));
  }
  
  // Email
  if (data.email) {
    errors.push(...validateEmail(data.email));
  }
  
  // Avatar URL (opcional)
  if (data.avatarUrl && typeof data.avatarUrl !== 'string') {
    errors.push('avatarUrl debe ser un string');
  }
  
  return errors;
}

/**
 * Validar nombre de sala
 */
export function validateRoomName(nombre) {
  return stringLength(
    nombre,
    'Nombre de sala',
    VALIDATION.ROOM_NAME.MIN_LENGTH,
    VALIDATION.ROOM_NAME.MAX_LENGTH
  );
}

/**
 * Validar configuración de sala
 */
export function validateRoomConfig(config) {
  const errors = [];
  
  // Número de preguntas
  if (config.numeroPreguntas !== undefined) {
    const validOptions = GAME_CONFIG.QUESTIONS_OPTIONS;
    const optionError = isOneOf(
      config.numeroPreguntas,
      'Número de preguntas',
      validOptions
    );
    if (optionError) errors.push(optionError);
  }
  
  // Tiempo de respuesta
  if (config.tiempoRespuesta !== undefined) {
    const rangeError = isNumberInRange(
      config.tiempoRespuesta,
      'Tiempo de respuesta',
      GAME_CONFIG.MIN_TIME,
      GAME_CONFIG.MAX_TIME
    );
    if (rangeError) errors.push(rangeError);
  }
  
  // Tiempo de adivinanza
  if (config.tiempoAdivinanza !== undefined) {
    const rangeError = isNumberInRange(
      config.tiempoAdivinanza,
      'Tiempo de adivinanza',
      GAME_CONFIG.MIN_TIME,
      GAME_CONFIG.MAX_TIME
    );
    if (rangeError) errors.push(rangeError);
  }
  
  // Puntos por adivinanza correcta
  if (config.puntosAdivinanzaCorrecta !== undefined) {
    const rangeError = isNumberInRange(
      config.puntosAdivinanzaCorrecta,
      'Puntos por adivinanza correcta',
      GAME_CONFIG.MIN_POINTS,
      GAME_CONFIG.MAX_POINTS
    );
    if (rangeError) errors.push(rangeError);
  }
  
  // Topic
  if (config.topic !== undefined) {
    const topicError = isOneOf(
      config.topic,
      'Topic',
      Object.values(TOPICS)
    );
    if (topicError) errors.push(topicError);
  }
  
  return errors;
}

/**
 * Validar creación de sala
 */
export function validateCreateRoom(data) {
  const errors = [];
  
  // Nombre de sala
  const nameError = validateRoomName(data.nombre);
  if (nameError) errors.push(nameError);
  
  // Host user ID
  const hostError = required(data.hostUserId, 'Host user ID');
  if (hostError) errors.push(hostError);
  
  // Max jugadores
  if (data.maxJugadores !== undefined) {
    const rangeError = isNumberInRange(
      data.maxJugadores,
      'Máximo de jugadores',
      GAME_CONFIG.MIN_PLAYERS,
      GAME_CONFIG.MAX_PLAYERS
    );
    if (rangeError) errors.push(rangeError);
  }
  
  // Configuración
  if (data.configuracion) {
    errors.push(...validateRoomConfig(data.configuracion));
  }
  
  return errors;
}

/**
 * Validar texto de pregunta
 */
export function validateQuestionText(texto) {
  return stringLength(
    texto,
    'Texto de pregunta',
    VALIDATION.QUESTION_TEXT.MIN_LENGTH,
    VALIDATION.QUESTION_TEXT.MAX_LENGTH
  );
}

/**
 * Validar opciones de pregunta
 */
export function validateQuestionOptions(opciones) {
  const errors = [];
  
  // Debe ser array
  const arrayError = isArray(opciones, 'Opciones');
  if (arrayError) {
    errors.push(arrayError);
    return errors;
  }
  
  // Debe tener exactamente 4 opciones
  if (opciones.length !== GAME_CONFIG.OPTIONS_PER_QUESTION) {
    errors.push(`Debe haber exactamente ${GAME_CONFIG.OPTIONS_PER_QUESTION} opciones`);
    return errors;
  }
  
  // Cada opción debe ser válida
  opciones.forEach((opcion, index) => {
    const optionError = stringLength(
      opcion,
      `Opción ${index + 1}`,
      VALIDATION.OPTION_TEXT.MIN_LENGTH,
      VALIDATION.OPTION_TEXT.MAX_LENGTH
    );
    if (optionError) errors.push(optionError);
  });
  
  // No debe haber opciones duplicadas
  const uniqueOptions = new Set(opciones.map(o => o.trim().toLowerCase()));
  if (uniqueOptions.size !== opciones.length) {
    errors.push('No puede haber opciones duplicadas');
  }
  
  return errors;
}

/**
 * Validar creación de pregunta
 */
export function validateCreateQuestion(data) {
  const errors = [];
  
  // Texto
  const textError = validateQuestionText(data.texto);
  if (textError) errors.push(textError);
  
  // Topic
  const topicError = required(data.topic, 'Topic');
  if (topicError) {
    errors.push(topicError);
  } else {
    const validTopicError = isOneOf(data.topic, 'Topic', Object.values(TOPICS));
    if (validTopicError) errors.push(validTopicError);
  }
  
  // Categoría
  const categoriaError = required(data.categoria, 'Categoría');
  if (categoriaError) {
    errors.push(categoriaError);
  } else {
    const validCategoriaError = isOneOf(
      data.categoria,
      'Categoría',
      Object.values(QUESTION_CATEGORIES)
    );
    if (validCategoriaError) errors.push(validCategoriaError);
  }
  
  // Opciones
  errors.push(...validateQuestionOptions(data.opciones));
  
  return errors;
}

/**
 * Validar respuesta de jugador
 */
export function validatePlayerAnswer(data) {
  const errors = [];
  
  const requiredError = required(data.respuesta, 'Respuesta');
  if (requiredError) errors.push(requiredError);
  
  const stringError = isNonEmptyString(data.respuesta, 'Respuesta');
  if (stringError) errors.push(stringError);
  
  return errors;
}

/**
 * Validar adivinanza de jugador
 */
export function validatePlayerGuess(data) {
  const errors = [];
  
  const targetError = required(data.targetUserId, 'Target user ID');
  if (targetError) errors.push(targetError);
  
  const guessError = required(data.adivinanza, 'Adivinanza');
  if (guessError) errors.push(guessError);
  
  const stringError = isNonEmptyString(data.adivinanza, 'Adivinanza');
  if (stringError) errors.push(stringError);
  
  return errors;
}

/**
 * Ejecutar validaciones y retornar errores
 */
export function validate(validationFn, data) {
  const errors = validationFn(data);
  return errors.length > 0 ? errors : null;
}
