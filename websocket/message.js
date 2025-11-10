const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const mensaje = body.mensaje || "";
  const nombre = body.nombre || "Anónimo";
  const connectionId = event.requestContext.connectionId;

  const api = new AWS.ApiGatewayManagementApi({
    endpoint: event.requestContext.domainName + "/" + event.requestContext.stage,
  });

  // Obtener todas las conexiones
  const conexiones = await dynamo
    .scan({ TableName: process.env.CONNECTIONS_TABLE })
    .promise();

  const payload = JSON.stringify({ nombre, mensaje });

  // Enviar a todos los conectados
  const envios = conexiones.Items.map(async (conn) => {
    try {
      await api
        .postToConnection({
          ConnectionId: conn.connectionId,
          Data: payload,
        })
        .promise();
    } catch (e) {
      console.log("Error enviando a", conn.connectionId);
    }
  });

  await Promise.all(envios);

  // Guardar mensaje
  await dynamo
    .put({
      TableName: process.env.MESSAGES_TABLE,
      Item: {
        messageId: Date.now().toString(),
        nombre,
        mensaje,
      },
    })
    .promise();

  return { statusCode: 200, body: "Mensaje enviado" };
};
