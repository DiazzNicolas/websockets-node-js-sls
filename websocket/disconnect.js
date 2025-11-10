const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  try {
    await dynamo
      .delete({
        TableName: process.env.USERS_TABLE,
        Key: { userId: connectionId },
      })
      .promise();

    console.log("Cliente desconectado:", connectionId);
    return { statusCode: 200, body: "Desconectado correctamente" };
  } catch (err) {
    console.error("Error al desconectar:", err);
    return { statusCode: 500, body: "Error al desconectar" };
  }
};
