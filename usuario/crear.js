const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { nombre } = body;

    if (!nombre) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Falta el nombre del usuario' }),
      };
    }

    const userId = uuidv4();
    const newUser = { userId, nombre, createdAt: new Date().toISOString() };

    await dynamo
      .put({
        TableName: process.env.USERS_TABLE,
        Item: newUser,
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Usuario creado correctamente', user: newUser }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al crear usuario' }),
    };
  }
};
