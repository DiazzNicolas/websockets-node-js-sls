// usuario/actualizar.js
// PUT /usuario/{userId}
// Actualiza la información de un usuario

import { getItem, updateItem } from '../utils/db.js';
import { TABLES, ERRORS } from '../utils/constants.js';
import { success, error, notFound } from '../utils/response.js';
import { validateUser, isEmpty } from '../utils/validators.js';

/**
 * Handler para actualizar un usuario
 * 
 * Path params:
 *   userId: ID del usuario a actualizar
 * 
 * Body esperado (todos los campos son opcionales):
 * {
 *   "nombre": "Juan Pérez Actualizado",
 *   "email": "nuevo@example.com",
 *   "avatarUrl": "https://..."
 * }
 */
export const handler = async (event) => {
  console.log('✏️ Actualizando usuario...');

  try {
    // Obtener userId de los path parameters
    const { userId } = event.pathParameters || {};

    // Validar userId
    if (isEmpty(userId)) {
      return error('El parámetro "userId" es obligatorio', 400);
    }

    // Parsear body
    const body = JSON.parse(event.body || '{}');
    const { nombre, email, avatarUrl } = body;

    // Validar que al menos un campo se está actualizando
    if (!nombre && !email && !avatarUrl) {
      return error('Debe proporcionar al menos un campo para actualizar', 400);
    }

    // Verificar que el usuario existe
    const usuarioExistente = await getItem(TABLES.USERS, { userId });
    if (!usuarioExistente) {
      console.log('⚠️ Usuario no encontrado:', userId);
      return notFound(`Usuario con ID "${userId}" no encontrado`);
    }

    // Construir objeto con campos a actualizar
    const camposActualizar = {};

    if (nombre !== undefined) {
      if (isEmpty(nombre)) {
        return error('El nombre no puede estar vacío', 400);
      }
      camposActualizar.nombre = nombre.trim();
    }

    if (email !== undefined) {
      if (!isEmpty(email)) {
        // Validar formato de email
        const validationError = validateUser({ email });
        if (validationError) {
          return error(validationError, 400);
        }
        camposActualizar.email = email.toLowerCase().trim();
      } else {
        // Si el email viene vacío, lo removemos
        camposActualizar.email = null;
      }
    }

    if (avatarUrl !== undefined) {
      if (!isEmpty(avatarUrl)) {
        // Validar formato de URL
        const validationError = validateUser({ avatarUrl });
        if (validationError) {
          return error(validationError, 400);
        }
        camposActualizar.avatarUrl = avatarUrl.trim();
      } else {
        // Si el avatarUrl viene vacío, lo removemos
        camposActualizar.avatarUrl = null;
      }
    }

    // Agregar timestamp de actualización
    camposActualizar.updatedAt = new Date().toISOString();

    // Actualizar en DynamoDB
    const usuarioActualizado = await updateItem(
      TABLES.USERS,
      { userId },
      camposActualizar
    );

    console.log('✅ Usuario actualizado:', userId);

    return success({
      message: 'Usuario actualizado exitosamente',
      usuario: usuarioActualizado
    });

  } catch (err) {
    console.error('❌ Error al actualizar usuario:', err);
    return error(ERRORS.INTERNAL_SERVER_ERROR, 500);
  }
};