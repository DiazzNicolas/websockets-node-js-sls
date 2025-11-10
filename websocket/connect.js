export const handler = async (event) => {
  console.log("Cliente conectado:", event.requestContext.connectionId);
  return { statusCode: 200, body: "Conectado exitosamente" };
};
