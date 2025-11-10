import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

export const handler = async (event) => {
  console.log("📩 Evento recibido:", event);

  try {
    const body = JSON.parse(event.body || "{}");
    const { username } = body;

    if (!username) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({ message: "Falta el username" }),
      };
    }

    const userId = Date.now().toString();

    const params = {
      TableName: process.env.USERS_TABLE,
      Item: {
        userId: { S: userId },
        username: { S: username },
      },
    };

    await client.send(new PutItemCommand(params));

    console.log("✅ Usuario creado correctamente:", username);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ userId, username }),
    };
  } catch (error) {
    console.error("❌ Error al crear usuario:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "Error interno del servidor" }),
    };
  }
};
