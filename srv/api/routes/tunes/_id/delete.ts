// Express
import {
  Request,
  Response,
} from 'express';

// Serverless Express
import { getCurrentInvoke } from '@vendia/serverless-express';

// HTTP Errors
import createError from 'http-errors';

// AWS SDK - DynamoDB - Document Client
import {
  BatchWriteCommand,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';

// Api Services
import { dynamodb } from '@/api/services';

// Api Utilities
import { getUserId } from '@/api/utils';

// Handler
export default async (req: Request, res: Response): Promise<Response> => {
  const {
    event: {
      requestContext: {
        identity: {
          cognitoAuthenticationProvider,
        },
      },
    },
  } = getCurrentInvoke();

  if (!cognitoAuthenticationProvider) {
    throw createError(401);
  }

  // Get the user id from cognito authentication provider.
  const userId = getUserId(cognitoAuthenticationProvider);

  // Get the tune id.
  const { id } = req.params;

  const { Item: tune } = await dynamodb.send(new GetCommand({
    TableName: process.env.APP_TABLE_NAME,
    Key: {
      pk: 'tunes',
      sk: `tuneId#${id}`,
    },
  }));

  if (tune === undefined) {
    throw createError(404);
  }

  if (tune.userId !== userId) {
    throw createError(403);
  }

  try {
    // Delete the tune.
    await dynamodb.send(new TransactWriteCommand({
      TransactItems: [
        {
          Delete: {
            TableName: process.env.APP_TABLE_NAME,
            Key: {
              pk: 'tunes',
              sk: `tuneId#${id}`,
            },
            ConditionExpression: [
              'attribute_exists(pk)',
              'attribute_exists(sk)',
            ].join(' AND '),
          },
        },
        {
          Delete: {
            TableName: process.env.APP_TABLE_NAME,
            Key: {
              pk: `userId#${userId}#tunes`,
              sk: `tuneId#${id}`,
            },
            ConditionExpression: [
              'attribute_exists(pk)',
              'attribute_exists(sk)',
            ].join(' AND '),
          },
        },
      ],
    }));
  } catch {
    //
  }

  try {
    // Get tune items.
    const { Items: items } = await dynamodb.send(new QueryCommand({
      TableName: process.env.APP_TABLE_NAME,
      IndexName: 'GSI-AdjacencyList',
      KeyConditionExpression: [
        'sk = :sk',
      ].join(' AND '),
      ExpressionAttributeValues: {
        ':sk': `tuneId#${id}`,
      },
    }));

    if (items === undefined) {
      throw createError(404);
    }

    // Delete tune items.
    await Promise.all([...Array(Math.ceil(items.length / 25)).keys()].map((i) => items.slice(i * 25, (i + 1) * 25)).map((items) => {
      return dynamodb.send(new BatchWriteCommand({
        RequestItems: {
          [process.env.APP_TABLE_NAME]: items.map(({ pk, sk }) => ({
            DeleteRequest: {
              Key: {
                pk,
                sk,
              },
            },
          })),
        },
      }));
    }));
  } catch {
    //
  }

  try {
    // Get comments.
    const { Items: comments } = await dynamodb.send(new QueryCommand({
      TableName: process.env.APP_TABLE_NAME,
      KeyConditionExpression: [
        'pk = :pk',
        'begins_with(sk, :sk)',
      ].join(' AND '),
      ExpressionAttributeValues: {
        ':pk': `tuneId#${id}#comments`,
        ':sk': 'commentId#',
      },
    }));

    if (comments === undefined) {
      throw createError(404);
    }

    // Delete comments.
    await Promise.all([...Array(Math.ceil(comments.length / 25)).keys()].map((i) => comments.slice(i * 25, (i + 1) * 25)).map((comments) => {
      return dynamodb.send(new BatchWriteCommand({
        RequestItems: {
          [process.env.APP_TABLE_NAME]: comments.map(({ pk, sk }) => ({
            DeleteRequest: {
              Key: {
                pk,
                sk,
              },
            },
          })),
        },
      }));
    }));
  } catch {
    //
  }

  return res.send({
    message: 'OK',
  });
};
