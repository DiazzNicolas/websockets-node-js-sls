import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

export const handler = async (event) => {
  console.log("🔌 Nuevo cliente conectado:", event.requestContext.connectionId);

  try {
    const params = {
      TableName: process.env.CONNECTIONS_TABLE,
      Item: {
        connectionId: { S: event.requestContext.connectionId },
      },
    };

    await client.send(new PutItemCommand(params));

    return { statusCode: 200, body: "Conectado correctamente" };
  } catch (error) {
    console.error("❌ Error al conectar:", error);
    return { statusCode: 500, body: "Error al conectar" };
  }
};
