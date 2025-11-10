import AWS from "aws-sdk";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const apigw = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_API, 
});
const db = new DynamoDBClient();

export const handler = async (event) => {
  const { connectionId } = event.requestContext;
  const body = JSON.parse(event.body || "{}");
  const { userId, mensaje } = body;

  if (!userId || !mensaje)
    return { statusCode: 400, body: "userId y mensaje son requeridos" };

  const messageId = uuidv4();

  // Guardar mensaje en DynamoDB
  await db.send(
    new PutItemCommand({
      TableName: process.env.MESSAGES_TABLE,
      Item: {
        messageId: { S: messageId },
        userId: { S: userId },
        mensaje: { S: mensaje },
        fecha: { S: new Date().toISOString() },
      },
    })
  );

  // Responder al cliente
  await apigw
    .postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify({ ok: true, echo: mensaje }),
    })
    .promise();

  return { statusCode: 200, body: "Mensaje procesado" };
};
