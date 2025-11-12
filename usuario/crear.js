// usuario/crear.js
// POST /usuario/crear
// Crea un nuevo usuario en el sistema

import { putItem } from '../utils/db.js';
import { TABLES, ERRORS } from '../utils/constants.js';
import { success, error } from '../utils/response.js';
import { isEmpty } from '../utils/validators.js';
import { generateId } from '../utils/helpers.js';

// Avatar por defecto
const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

/**
 * Handler para crear un nuevo usuario
 * 
 * Body esperado:
 * {
 *   "nombre": "Juan"
 * }
 * 
 * NOTA: El nombre puede ser repetido entre usuarios.
 * El userId es único y se genera automáticamente.
 */
export const handler = async (event) => {
  console.log('📝 Creando nuevo usuario...');

  try {
    // Parsear body
    const body = JSON.parse(event.body || '{}');
    const { nombre } = body;

    // Validar que el nombre existe
    if (isEmpty(nombre)) {
      return error('El campo "nombre" es obligatorio', 400);
    }

    // Validar longitud del nombre
    const nombreTrimmed = nombre.trim();
    if (nombreTrimmed.length < 2) {
      return error('El nombre debe tener al menos 2 caracteres', 400);
    }

    if (nombreTrimmed.length > 30) {
      return error('El nombre no puede tener más de 30 caracteres', 400);
    }

    // Generar userId único
    const userId = generateId('user');
    const timestamp = new Date().toISOString();

    // Construir objeto usuario (minimalista)
    const usuario = {
      userId,
      nombre: nombreTrimmed,
      avatarUrl: DEFAULT_AVATAR, // Todos empiezan con el mismo avatar
      createdAt: timestamp,
      updatedAt: timestamp
    };

    // Guardar en DynamoDB
    await putItem(TABLES.USERS, usuario);

    console.log('✅ Usuario creado:', userId, '- Nombre:', nombreTrimmed);

    return success({
      message: 'Usuario creado exitosamente',
      usuario
    }, 201);

  } catch (err) {
    console.error('❌ Error al crear usuario:', err);
    return error(ERRORS.INTERNAL_SERVER_ERROR, 500);
  }
};