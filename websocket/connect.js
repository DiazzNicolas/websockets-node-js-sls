exports.handler = async (event) => {
  console.log('Nuevo cliente conectado:', event.requestContext.connectionId);
  return { statusCode: 200, body: 'Conectado correctamente' };
};
