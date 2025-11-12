// usuario/obtener.js
// GET /usuario/{userId}
// Obtiene los datos de un usuario específico

import { getItem } from '../utils/db.js';
import { TABLES, ERRORS } from '../utils/constants.js';
import { success, error, notFound } from '../utils/response.js';
import { isEmpty } from '../utils/validators.js';

/**
 * Handler para obtener un usuario por su ID
 * 
 * Path params:
 *   userId: ID del usuario a buscar
 */
export const handler = async (event) => {
  console.log('🔍 Buscando usuario...');

  try {
    // Obtener userId de los path parameters
    const { userId } = event.pathParameters || {};

    // Validar que userId existe
    if (isEmpty(userId)) {
      return error('El parámetro "userId" es obligatorio', 400);
    }

    // Buscar usuario en DynamoDB
    const usuario = await getItem(TABLES.USERS, { userId });

    // Verificar si existe
    if (!usuario) {
      console.log('⚠️ Usuario no encontrado:', userId);
      return notFound(`Usuario con ID "${userId}" no encontrado`);
    }

    console.log('✅ Usuario encontrado:', userId);

    return success({ usuario });

  } catch (err) {
    console.error('❌ Error al obtener usuario:', err);
    return error(ERRORS.INTERNAL_SERVER_ERROR, 500);
  }
};