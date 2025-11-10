const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  try {
    await dynamo
      .put({
        TableName: process.env.USERS_TABLE,
        Item: { userId: connectionId, connectionId },
      })
      .promise();

    console.log("Nuevo cliente conectado:", connectionId);
    return { statusCode: 200, body: "Conectado correctamente" };
  } catch (err) {
    console.error("Error al conectar:", err);
    return { statusCode: 500, body: "Error al conectar" };
  }
};
