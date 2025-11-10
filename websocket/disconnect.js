import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

export const handler = async (event) => {
  console.log("❌ Cliente desconectado:", event.requestContext.connectionId);

  try {
    const params = {
      TableName: process.env.CONNECTIONS_TABLE,
      Key: {
        connectionId: { S: event.requestContext.connectionId },
      },
    };

    await client.send(new DeleteItemCommand(params));

    return { statusCode: 200, body: "Desconectado correctamente" };
  } catch (error) {
    console.error("❌ Error al desconectar:", error);
    return { statusCode: 500, body: "Error al desconectar" };
  }
};
