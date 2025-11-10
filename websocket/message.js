import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamo = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
  console.log('💬 Evento recibido:', event);

  const { connectionId, domainName, stage } = event.requestContext;
  const body = JSON.parse(event.body || '{}');
  const { mensaje, usuario } = body;

  if (!mensaje || !usuario) {
    console.error('❌ Faltan datos en el mensaje');
    return { statusCode: 400, body: 'Faltan campos requeridos' };
  }

  const messageItem = {
    messageId: uuidv4(),
    usuario,
    mensaje,
    fecha: new Date().toISOString(),
  };

  await dynamo.put({
    TableName: process.env.MESSAGES_TABLE,
    Item: messageItem,
  }).promise();

  // Inicializar cliente de WebSocket
  const api = new AWS.ApiGatewayManagementApi({
    endpoint: `${domainName}/${stage}`,
  });

  const connections = await dynamo.scan({ TableName: process.env.CONNECTIONS_TABLE }).promise();

  console.log(`📡 Enviando mensaje a ${connections.Items.length} conexiones`);

  const sendPromises = connections.Items.map(async (conn) => {
    try {
      await api
        .postToConnection({
          ConnectionId: conn.connectionId,
          Data: JSON.stringify(messageItem),
        })
        .promise();
    } catch (err) {
      console.error('⚠️ Error enviando mensaje a conexión', conn.connectionId, err);
      if (err.statusCode === 410) {
        await dynamo.delete({
          TableName: process.env.CONNECTIONS_TABLE,
          Key: { connectionId: conn.connectionId },
        }).promise();
        console.log('🧹 Conexión eliminada:', conn.connectionId);
      }
    }
  });

  await Promise.all(sendPromises);

  return { statusCode: 200, body: 'Mensaje enviado correctamente' };
};
