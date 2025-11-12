import { ERROR_MESSAGES } from './constants.js';

/**
 * Crear respuesta HTTP exitosa
 */
export function success(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      success: true,
      data,
    }),
  };
}

/**
 * Crear respuesta HTTP de error
 */
export function error(errorCode, message = null, statusCode = 400, details = null) {
  const errorMessage = message || ERROR_MESSAGES[errorCode] || 'Error desconocido';

  const responseBody = {
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
    },
  };

  if (details) {
    responseBody.error.details = details;
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(responseBody),
  };
}

/**
 * Crear respuesta de validación fallida
 */
export function validationError(details) {
  return error('VALIDATION_ERROR', 'Datos de entrada inválidos', 400, details);
}

/**
 * Crear respuesta de recurso no encontrado
 */
export function notFound(resource = 'Recurso') {
  return error('NOT_FOUND', `${resource} no encontrado`, 404);
}

/**
 * Crear respuesta de error interno
 */
export function internalError(errorDetails = null) {
  console.error('Error interno:', errorDetails);

  const details = process.env.NODE_ENV === 'development' ? errorDetails : null;

  return error('INTERNAL_ERROR', 'Error interno del servidor', 500, details);
}

/**
 * Crear respuesta de no autorizado
 */
export function unauthorized(message = 'No autorizado') {
  return error('UNAUTHORIZED', message, 401);
}

/**
 * Crear respuesta de prohibido
 */
export function forbidden(message = 'Acceso prohibido') {
  return error('FORBIDDEN', message, 403);
}

/**
 * Crear respuesta de conflicto
 */
export function conflict(errorCode, message = null) {
  return error(errorCode, message, 409);
}

/**
 * Wrapper para manejar errores en handlers
 */
export function withErrorHandling(handler) {
  return async (event, context) => {
    try {
      return await handler(event, context);
    } catch (err) {
      console.error('Error no manejado:', err);
      return internalError(err.message);
    }
  };
}

/**
 * Parsear body de la petición
 */
export function parseBody(event) {
  try {
    if (!event.body) {
      return {};
    }
    return typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (err) {
    throw new Error('Body inválido');
  }
}

/**
 * Obtener parámetros de la URL
 */
export function getPathParameters(event) {
  return event.pathParameters || {};
}

/**
 * Obtener query parameters
 */
export function getQueryParameters(event) {
  return event.queryStringParameters || {};
}

/**
 * Obtener headers
 */
export function getHeaders(event) {
  return event.headers || {};
}

/**
 * Extraer userId del header de autorización
 */
export function getUserIdFromEvent(event) {
  const headers = getHeaders(event);
  return headers['x-user-id'] || headers['X-User-Id'] || null;
}

/**
 * Validar que el usuario esté autenticado
 */
export function requireAuth(event) {
  const userId = getUserIdFromEvent(event);
  if (!userId) {
    throw new Error('UNAUTHORIZED');
  }
  return userId;
}
