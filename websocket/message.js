const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { connectionId } = event.requestContext;
  const body = JSON.parse(event.body || "{}");
  const { mensaje, userId } = body;

  if (!mensaje || !userId) {
    return { statusCode: 400, body: "Faltan campos requeridos" };
  }

  const messageId = uuidv4();
  const item = {
    messageId,
    userId,
    mensaje,
    connectionId,
    createdAt: new Date().toISOString(),
  };

  try {
    // Guardar mensaje
    await dynamo
      .put({
        TableName: process.env.MESSAGES_TABLE,
        Item: item,
      })
      .promise();

    // Obtener todas las conexiones
    const conexiones = await dynamo
      .scan({ TableName: process.env.USERS_TABLE })
      .promise();

    const api = new AWS.ApiGatewayManagementApi({
      endpoint: event.requestContext.domainName + "/" + event.requestContext.stage,
    });

    // Enviar mensaje a todos los conectados
    const payload = JSON.stringify({ userId, mensaje });

    await Promise.all(
      conexiones.Items.map(async (conn) => {
        try {
          await api
            .postToConnection({
              ConnectionId: conn.connectionId,
              Data: payload,
            })
            .promise();
        } catch (err) {
          console.error("Error enviando mensaje a", conn.connectionId, err);
        }
      })
    );

    return { statusCode: 200, body: "Mensaje enviado" };
  } catch (error) {
    console.error("Error al procesar mensaje:", error);
    return { statusCode: 500, body: "Error al guardar o enviar mensaje" };
  }
};
