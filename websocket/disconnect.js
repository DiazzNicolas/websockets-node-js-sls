import AWS from 'aws-sdk';
const dynamo = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
  const { connectionId } = event.requestContext;

  console.log('🔴 Cliente desconectado:', connectionId);

  await dynamo.delete({
    TableName: process.env.CONNECTIONS_TABLE,
    Key: { connectionId },
  }).promise();

  return { statusCode: 200, body: 'Desconectado correctamente' };
};
