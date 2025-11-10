import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const db = new DynamoDBClient();

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { nombre, email } = body;

    if (!nombre || !email) {
      return { statusCode: 400, body: "Faltan campos requeridos" };
    }

    const userId = uuidv4();
    const params = {
      TableName: process.env.USERS_TABLE,
      Item: {
        userId: { S: userId },
        nombre: { S: nombre },
        email: { S: email },
        creadoEn: { S: new Date().toISOString() },
      },
    };

    await db.send(new PutItemCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Usuario creado", userId }),
    };
  } catch (err) {
    console.error("Error creando usuario:", err);
    return { statusCode: 500, body: "Error interno" };
  }
};
