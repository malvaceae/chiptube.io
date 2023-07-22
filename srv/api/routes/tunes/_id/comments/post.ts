// Node.js Core Modules
import { randomFillSync } from 'crypto';

// Express
import {
  Request,
  Response,
} from 'express';

// Serverless Express
import { getCurrentInvoke } from '@vendia/serverless-express';

// HTTP Errors
import createError from 'http-errors';

// AWS SDK - DynamoDB
import { TransactionCanceledException } from '@aws-sdk/client-dynamodb';

// AWS SDK - DynamoDB - Document Client
import {
  GetCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';

// Api Services
import {
  ajv,
  dynamodb,
} from '@/api/services';

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
  const { id: tuneId } = req.params;

  // Compile the parameter schema.
  const validate = ajv.compile({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        minLength: 1,
        maxLength: 1023,
        pattern: '\\S',
      },
    },
    required: [
      'text',
    ],
  });

  // Validate request parameters.
  if (!validate(req.body)) {
    throw createError(422, {
      errors: validate.errors?.filter?.(({ message }) => message)?.reduce?.((errors, { instancePath, message }) => {
        return { ...errors, [instancePath.slice(1)]: [...(errors[instancePath.slice(1)] ?? []), message ?? ''] };
      }, {} as Record<string, string[]>),
    });
  }

  // Get a text.
  const { text } = req.body;

  while (true) {
    try {
      const id = [...randomFillSync(new Uint32Array(22))].map((i) => i % 64).map((i) => {
        return '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'[i];
      }).join('');

      await dynamodb.send(new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: process.env.APP_TABLE_NAME,
              Item: {
                pk: `tuneId#${tuneId}#comments`,
                sk: `commentId#${id}`,
                id,
                userId,
                text,
                publishedAt: Date.now(),
                likes: 0,
              },
              ConditionExpression: [
                'attribute_not_exists(pk)',
                'attribute_not_exists(sk)',
              ].join(' AND '),
            },
          },
          {
            Update: {
              TableName: process.env.APP_TABLE_NAME,
              Key: {
                pk: 'tunes',
                sk: `tuneId#${tuneId}`,
              },
              UpdateExpression: 'ADD comments :additionalValue',
              ConditionExpression: [
                'attribute_exists(pk)',
                'attribute_exists(sk)',
              ].join(' AND '),
              ExpressionAttributeValues: {
                ':additionalValue': 1,
              },
            },
          },
        ],
      }));

      const { Item: comment } = await dynamodb.send(new GetCommand({
        TableName: process.env.APP_TABLE_NAME,
        Key: {
          pk: `tuneId#${tuneId}#comments`,
          sk: `commentId#${id}`,
        },
      }));

      if (comment === undefined) {
        throw createError(404);
      }

      const { Item: user } = await dynamodb.send(new GetCommand({
        TableName: process.env.APP_TABLE_NAME,
        Key: {
          pk: `userId#${comment.userId}`,
          sk: `userId#${comment.userId}`,
        },
        AttributesToGet: [
          'id',
          'nickname',
          'picture',
        ],
      }));

      if (user === undefined) {
        throw createError(404);
      }

      Object.assign(comment, {
        user,
      });

      return res.send(comment);
    } catch (e) {
      if (e instanceof TransactionCanceledException) {
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      } else {
        throw e;
      }
    }
  }
};
