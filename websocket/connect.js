const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  await dynamo
    .put({
      TableName: process.env.CONNECTIONS_TABLE,
      Item: { connectionId },
    })
    .promise();

  console.log("Conectado:", connectionId);
  return { statusCode: 200, body: "Conectado" };
};
