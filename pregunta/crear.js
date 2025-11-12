import { putItem, getCurrentTimestamp } from '../utils/db.js';
import { TABLES } from '../utils/constants.js';
import { success, error } from '../utils/response.js';
import { generateId } from '../utils/helpers.js';

/**
 * POST /pregunta/crear
 * Crea una nueva pregunta en la base de datos
 * 
 * Body:
 * {
 *   texto: "¿Cuál es tu color favorito?",
 *   topic: "cultura-general",
 *   categoria: "preferencias",
 *   opciones: ["Rojo", "Azul", "Verde", "Amarillo"]
 * }
 */
export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { texto, topic, categoria, opciones } = body;

    // Validaciones
    if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
      return error('El campo "texto" es obligatorio y debe ser una cadena no vacía', 400);
    }

    if (!topic || typeof topic !== 'string') {
      return error('El campo "topic" es obligatorio', 400);
    }

    const categoriasValidas = ['preferencias', 'hipoteticas', 'personales'];
    if (!categoria || !categoriasValidas.includes(categoria)) {
      return error(`El campo "categoria" debe ser uno de: ${categoriasValidas.join(', ')}`, 400);
    }

    if (!Array.isArray(opciones) || opciones.length !== 4) {
      return error('El campo "opciones" debe ser un array de exactamente 4 elementos', 400);
    }

    // Validar que todas las opciones sean strings no vacíos
    const opcionesValidas = opciones.every(op => 
      typeof op === 'string' && op.trim().length > 0
    );
    
    if (!opcionesValidas) {
      return error('Todas las opciones deben ser cadenas de texto no vacías', 400);
    }

    // Generar ID único para la pregunta
    const questionId = generateId('q');
    const timestamp = new Date().toISOString();

    // Crear objeto pregunta
    const pregunta = {
      questionId,
      texto: texto.trim(),
      topic: topic.toLowerCase().trim(),
      categoria,
      opciones: opciones.map(op => op.trim()),
      activa: true,
      vecesUsada: 0,
      createdAt: timestamp
    };

    // Guardar en DynamoDB
    await putItem(TABLES.QUESTIONS, pregunta);

    return success({
      message: 'Pregunta creada exitosamente',
      pregunta
    });

  } catch (err) {
    console.error('Error al crear pregunta:', err);
    return error('Error interno al crear la pregunta', 500);
  }
};