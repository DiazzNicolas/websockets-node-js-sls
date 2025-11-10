const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  await dynamo
    .delete({
      TableName: process.env.CONNECTIONS_TABLE,
      Key: { connectionId },
    })
    .promise();

  console.log("Desconectado:", connectionId);
  return { statusCode: 200, body: "Desconectado" };
};
