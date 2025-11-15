// ============================
// IMPORTS (ESM)
// ============================
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';

// ============================
// CONFIGURACIÓN DEL CLIENTE
// ============================

// Cliente DynamoDB base
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Document Client para trabajar con JSON nativo
const dynamoDB = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Elimina valores undefined
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false, // Convierte números a tipos nativos JS
  },
});

// ============================
// VALIDACIÓN
// ============================
function validateTableName(tableName) {
  if (!tableName || typeof tableName !== 'string') {
    throw new Error(`TableName inválido: se esperaba un string, se recibió ${typeof tableName} - Valor: ${JSON.stringify(tableName)}`);
  }
}

// ============================
// OPERACIONES BÁSICAS
// ============================

export async function getItem(tableName, key) {
  try {
    validateTableName(tableName);
    
    const command = new GetCommand({ TableName: tableName, Key: key });
    const response = await dynamoDB.send(command);
    return response.Item || null;
  } catch (error) {
    console.error('Error en getItem:', error);
    console.error('TableName recibido:', tableName, 'Tipo:', typeof tableName);
    throw error;
  }
}

export async function putItem(tableName, item) {
  try {
    validateTableName(tableName);
    
    const command = new PutCommand({ TableName: tableName, Item: item });
    await dynamoDB.send(command);
    return item;
  } catch (error) {
    console.error('Error en putItem:', error);
    console.error('TableName recibido:', tableName, 'Tipo:', typeof tableName);
    throw error;
  }
}

export async function updateItem(tableName, key, updates, conditions = {}) {
  try {
    validateTableName(tableName);
    
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach((field, index) => {
      const placeholder = `#field${index}`;
      const valuePlaceholder = `:value${index}`;
      updateExpressions.push(`${placeholder} = ${valuePlaceholder}`);
      expressionAttributeNames[placeholder] = field;
      expressionAttributeValues[valuePlaceholder] = updates[field];
    });

    const params = {
      TableName: tableName,
      Key: key,
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    if (conditions.expression) {
      params.ConditionExpression = conditions.expression;
      if (conditions.attributeNames) {
        Object.assign(params.ExpressionAttributeNames, conditions.attributeNames);
      }
      if (conditions.attributeValues) {
        Object.assign(params.ExpressionAttributeValues, conditions.attributeValues);
      }
    }

    const command = new UpdateCommand(params);
    const response = await dynamoDB.send(command);
    return response.Attributes;
  } catch (error) {
    console.error('Error en updateItem:', error);
    console.error('TableName recibido:', tableName, 'Tipo:', typeof tableName);
    throw error;
  }
}

export async function deleteItem(tableName, key) {
  try {
    validateTableName(tableName);
    
    const command = new DeleteCommand({ TableName: tableName, Key: key });
    await dynamoDB.send(command);
    return true;
  } catch (error) {
    console.error('Error en deleteItem:', error);
    console.error('TableName recibido:', tableName, 'Tipo:', typeof tableName);
    throw error;
  }
}

export async function query(tableName, keyCondition, options = {}) {
  try {
    validateTableName(tableName);
    
    const params = {
      TableName: tableName,
      KeyConditionExpression: keyCondition.expression,
      ExpressionAttributeValues: keyCondition.values,
    };

    if (keyCondition.names) {
      params.ExpressionAttributeNames = keyCondition.names;
    }
    if (options.indexName) params.IndexName = options.indexName;
    if (options.filterExpression) {
      params.FilterExpression = options.filterExpression;
      if (options.filterValues) {
        Object.assign(params.ExpressionAttributeValues, options.filterValues);
      }
    }
    if (options.limit) params.Limit = options.limit;
    if (options.scanIndexForward !== undefined) {
      params.ScanIndexForward = options.scanIndexForward;
    }

    const command = new QueryCommand(params);
    const response = await dynamoDB.send(command);
    return response.Items || [];
  } catch (error) {
    console.error('Error en query:', error);
    console.error('TableName recibido:', tableName, 'Tipo:', typeof tableName);
    throw error;
  }
}

// ============================
// NUEVA FUNCIÓN: queryItems
// Compatible con el formato usado en gameEvent.js
// ============================
export async function queryItems(tableName, params) {
  try {
    validateTableName(tableName);
    
    const command = new QueryCommand({
      TableName: tableName,
      ...params
    });
    
    const response = await dynamoDB.send(command);
    return {
      items: response.Items || [],
      count: response.Count || 0,
      lastEvaluatedKey: response.LastEvaluatedKey
    };
  } catch (error) {
    console.error('Error en queryItems:', error);
    console.error('TableName recibido:', tableName, 'Tipo:', typeof tableName);
    throw error;
  }
}

export async function scan(tableName, options = {}) {
  try {
    validateTableName(tableName);
    
    const params = { TableName: tableName };

    if (options.filterExpression) {
      params.FilterExpression = options.filterExpression;
      params.ExpressionAttributeValues = options.filterValues || {};
      if (options.filterNames) {
        params.ExpressionAttributeNames = options.filterNames;
      }
    }
    if (options.limit) params.Limit = options.limit;

    const command = new ScanCommand(params);
    const response = await dynamoDB.send(command);
    return response.Items || [];
  } catch (error) {
    console.error('Error en scan:', error);
    console.error('TableName recibido:', tableName, 'Tipo:', typeof tableName);
    throw error;
  }
}

export async function batchGet(tableName, keys) {
  try {
    validateTableName(tableName);
    
    if (keys.length === 0) return [];

    const chunks = chunkArray(keys, 100);
    const allItems = [];

    for (const chunk of chunks) {
      const command = new BatchGetCommand({
        RequestItems: { [tableName]: { Keys: chunk } },
      });
      const response = await dynamoDB.send(command);
      const items = response.Responses?.[tableName] || [];
      allItems.push(...items);
    }

    return allItems;
  } catch (error) {
    console.error('Error en batchGet:', error);
    console.error('TableName recibido:', tableName, 'Tipo:', typeof tableName);
    throw error;
  }
}

export async function batchWrite(tableName, items, operation = 'put') {
  try {
    validateTableName(tableName);
    
    if (items.length === 0) return true;

    const chunks = chunkArray(items, 25);

    for (const chunk of chunks) {
      const requests = chunk.map(item =>
        operation === 'put'
          ? { PutRequest: { Item: item } }
          : { DeleteRequest: { Key: item } }
      );

      const command = new BatchWriteCommand({
        RequestItems: { [tableName]: requests },
      });
      await dynamoDB.send(command);
    }

    return true;
  } catch (error) {
    console.error('Error en batchWrite:', error);
    console.error('TableName recibido:', tableName, 'Tipo:', typeof tableName);
    throw error;
  }
}

// ============================
// UTILIDADES
// ============================

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function getCurrentTimestamp() {
  return new Date().toISOString();
}

export function generateTTL(hoursFromNow) {
  const now = Math.floor(Date.now() / 1000);
  return now + hoursFromNow * 3600;
}

// ============================
// EXPORTS
// ============================

export { dynamoDB };