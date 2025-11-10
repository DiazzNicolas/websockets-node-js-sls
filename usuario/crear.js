import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
const dynamo = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
  console.log('🧍 Creando usuario:', event.body);

  const { nombre } = JSON.parse(event.body || '{}');
  if (!nombre) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta el nombre de usuario' }) };
  }

  const user = {
    userId: uuidv4(),
    nombre,
    fechaRegistro: new Date().toISOString(),
  };

  await dynamo.put({
    TableName: process.env.USERS_TABLE,
    Item: user,
  }).promise();

  console.log('✅ Usuario creado:', user);

  return {
    statusCode: 200,
    body: JSON.stringify({ mensaje: 'Usuario creado correctamente', user }),
  };
};
