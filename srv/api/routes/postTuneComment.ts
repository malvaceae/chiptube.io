// Node.js Core Modules
import { randomFillSync } from 'crypto';

// AWS Lambda
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';

// Api Commons
import {
  ajv,
  dynamodb,
  getUserId,
  response,
} from '@/api/commons';

export default async ({ body, pathParameters, requestContext: { identity: { cognitoAuthenticationProvider } } }: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (!cognitoAuthenticationProvider) {
    return response({
      message: 'Unauthorized',
    }, 401);
  }

  // Get the user id from cognito authentication provider.
  const userId = getUserId(cognitoAuthenticationProvider);

  // Get the tune id.
  const { id: tuneId } = pathParameters ?? {};

  if (!tuneId) {
    return response({
      message: 'Not found',
    }, 404);
  }

  // Parse the JSON of request body.
  const params = JSON.parse(body ?? '{}');

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
  if (!validate(params)) {
    return response({
      message: 'Unprocessable entity',
      errors: validate.errors?.filter?.(({ message }) => message)?.reduce?.((errors, { instancePath, message }) => {
        return { ...errors, [instancePath.slice(1)]: [...(errors[instancePath.slice(1)] ?? []), message ?? ''] };
      }, {} as Record<string, string[]>),
    }, 422);
  }

  // Get a text.
  const { text } = params;

  while (true) {
    try {
      const id = [...randomFillSync(new Uint32Array(22))].map((i) => i % 64).map((i) => {
        return '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'[i];
      }).join('');

      await dynamodb.transactWrite({
        TransactItems: [
          {
            Put: {
              TableName: process.env.APP_TABLE_NAME!,
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
              TableName: process.env.APP_TABLE_NAME!,
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
      }).promise();

      const { Item: comment } = await dynamodb.get({
        TableName: process.env.APP_TABLE_NAME!,
        Key: {
          pk: `tuneId#${tuneId}#comments`,
          sk: `commentId#${id}`,
        },
      }).promise();

      if (comment === undefined) {
        return response({
          message: 'Not found',
        }, 404);
      }

      const { Item: user } = await dynamodb.get({
        TableName: process.env.APP_TABLE_NAME!,
        Key: {
          pk: `userId#${comment.userId}`,
          sk: `userId#${comment.userId}`,
        },
        AttributesToGet: [
          'id',
          'nickname',
          'picture',
        ],
      }).promise();

      if (user === undefined) {
        return response({
          message: 'Not found',
        }, 404);
      }

      Object.assign(comment, {
        user,
      });

      return response(comment);
    } catch (e: any) {
      if (e.code === 'TransactionCanceledException') {
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      } else {
        throw e;
      }
    }
  }
};
