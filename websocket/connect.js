import AWS from 'aws-sdk';
const dynamo = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
  const { connectionId } = event.requestContext;

  console.log('🟢 Nueva conexión:', connectionId);

  await dynamo.put({
    TableName: process.env.CONNECTIONS_TABLE,
    Item: { connectionId },
  }).promise();

  return { statusCode: 200, body: 'Conectado correctamente' };
};
