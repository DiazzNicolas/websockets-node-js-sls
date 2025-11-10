const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const data = JSON.parse(event.body || "{}");
  const { nombre } = data;

  if (!nombre) {
    return { statusCode: 400, body: "Nombre requerido" };
  }

  const userId = uuidv4();
  const nuevoUsuario = { userId, nombre, creado: Date.now() };

  await dynamo
    .put({
      TableName: process.env.USERS_TABLE,
      Item: nuevoUsuario,
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ mensaje: "Usuario creado", usuario: nuevoUsuario }),
  };
};
