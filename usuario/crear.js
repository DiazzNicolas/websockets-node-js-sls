const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { nombre } = body;

  if (!nombre) {
    return { statusCode: 400, body: "El nombre es obligatorio" };
  }

  const userId = uuidv4();
  const item = {
    userId,
    nombre,
    createdAt: new Date().toISOString(),
  };

  try {
    await dynamo
      .put({
        TableName: process.env.USERS_TABLE,
        Item: item,
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Usuario creado", userId }),
    };
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return { statusCode: 500, body: "Error al crear usuario" };
  }
};
