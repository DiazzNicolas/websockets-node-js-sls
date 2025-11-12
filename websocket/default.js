/**
 * WebSocket: $default
 * Maneja mensajes que no coinciden con ninguna ruta específica
 * 
 * Responde con un mensaje genérico
 */
export const handler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const body = JSON.parse(event.body || '{}');

    console.log('Mensaje default recibido:', { connectionId, body });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Mensaje recibido',
        connectionId,
        info: 'Usa la ruta "gameEvent" para eventos del juego'
      })
    };

  } catch (error) {
    console.error('Error en default handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al procesar mensaje' })
    };
  }
};