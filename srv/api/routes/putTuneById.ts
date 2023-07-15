// AWS Lambda
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';

// AWS SDK - DynamoDB - Document Client
import {
  BatchWriteCommand,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

// Api Commons
import {
  ajv,
  dynamodb,
  getUserId,
  getWords,
  normalize,
  response,
  tokenize,
} from '@/api/commons';

export default async ({ body, pathParameters, requestContext: { identity: { cognitoAuthenticationProvider } } }: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (!cognitoAuthenticationProvider) {
    return response({
      message: 'Unauthorized',
    }, 401);
  }

  // Get the user id from cognito authentication provider.
  const userId = getUserId(cognitoAuthenticationProvider);

  // Parse the JSON of request body.
  const params = JSON.parse(body ?? '{}');

  // Compile the parameter schema.
  const validate = ajv.compile<{ title?: string, description?: string, isLiked?: boolean }>({
    type: 'object',
    properties: {
      title: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        pattern: '\\S',
      },
      description: {
        type: 'string',
        minLength: 1,
        maxLength: 1023,
        pattern: '\\S',
      },
      isLiked: {
        type: 'boolean',
      },
    },
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

  // Get the tune id.
  const { id } = pathParameters ?? {};

  if (!id) {
    return response({
      message: 'Not found',
    }, 404);
  }

  if (params.title || params.description) {
    const { Item: tune } = await dynamodb.send(new GetCommand({
      TableName: process.env.APP_TABLE_NAME,
      Key: {
        pk: 'tunes',
        sk: `tuneId#${id}`,
      },
    }));

    if (tune === undefined) {
      return response({
        message: 'Not found',
      }, 404);
    }

    if (tune.userId !== userId) {
      return response({
        message: 'Forbidden',
      }, 403);
    }

    if (params.title) {
      try {
        await dynamodb.send(new UpdateCommand({
          TableName: process.env.APP_TABLE_NAME,
          Key: {
            pk: 'tunes',
            sk: `tuneId#${id}`,
          },
          UpdateExpression: `SET ${[
            'title = :title',
          ].join(', ')}`,
          ConditionExpression: [
            'attribute_exists(pk)',
            'attribute_exists(sk)',
          ].join(' AND '),
          ExpressionAttributeValues: {
            ':title': params.title,
          },
        }));
      } catch {
        //
      }
    }

    if (params.description) {
      try {
        await dynamodb.send(new UpdateCommand({
          TableName: process.env.APP_TABLE_NAME,
          Key: {
            pk: 'tunes',
            sk: `tuneId#${id}`,
          },
          UpdateExpression: `SET ${[
            'description = :description',
          ].join(', ')}`,
          ConditionExpression: [
            'attribute_exists(pk)',
            'attribute_exists(sk)',
          ].join(' AND '),
          ExpressionAttributeValues: {
            ':description': params.description,
          },
        }));
      } catch {
        //
      }
    }

    try {
      // Get keywords.
      const { Items: keywords } = await dynamodb.send(new QueryCommand({
        TableName: process.env.APP_TABLE_NAME,
        IndexName: 'GSI-AdjacencyList',
        KeyConditionExpression: [
          'sk = :sk',
          'begins_with(pk, :pk)',
        ].join(' AND '),
        ExpressionAttributeValues: {
          ':sk': `tuneId#${id}`,
          ':pk': 'tuneKeyword#',
        },
      }));

      if (keywords === undefined) {
        return response({
          message: 'Not found',
        }, 404);
      }

      // Delete keywords.
      await Promise.all([...Array(Math.ceil(keywords.length / 25)).keys()].map((i) => keywords.slice(i * 25, (i + 1) * 25)).map((keywords) => {
        return dynamodb.send(new BatchWriteCommand({
          RequestItems: {
            [process.env.APP_TABLE_NAME!]: keywords.map(({ keyword }) => ({
              DeleteRequest: {
                Key: {
                  pk: `tuneKeyword#${keyword}`,
                  sk: `tuneId#${id}`,
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
      // Tokenize title and description.
      const keywords = getWords(await tokenize([params.title, params.description].join())).map(normalize);

      // Get number of occurrences by keyword.
      const occurrences = [...keywords.reduce((keywords, keyword) => {
        return keywords.set(keyword, keywords.get(keyword)! + 1 || 1);
      }, new Map<string, number>)];

      // Add keywords.
      await Promise.all([...Array(Math.ceil(occurrences.length / 25)).keys()].map((i) => occurrences.slice(i * 25, (i + 1) * 25)).map((occurrences) => {
        return dynamodb.send(new BatchWriteCommand({
          RequestItems: {
            [process.env.APP_TABLE_NAME!]: occurrences.map(([keyword, occurrences]) => ({
              PutRequest: {
                Item: {
                  pk: `tuneKeyword#${keyword}`,
                  sk: `tuneId#${id}`,
                  tuneId: id,
                  keyword,
                  occurrences,
                },
              },
            })),
          },
        }));
      }));
    } catch {
      //
    }
  }

  if (typeof params.isLiked === 'boolean') {
    try {
      if (params.isLiked) {
        await dynamodb.send(new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: process.env.APP_TABLE_NAME,
                Item: {
                  pk: `userId#${userId}`,
                  sk: `tuneLikeId#${id}`,
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
                  sk: `tuneId#${id}`,
                },
                UpdateExpression: 'ADD likes :additionalValue',
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
      } else {
        await dynamodb.send(new TransactWriteCommand({
          TransactItems: [
            {
              Delete: {
                TableName: process.env.APP_TABLE_NAME,
                Key: {
                  pk: `userId#${userId}`,
                  sk: `tuneLikeId#${id}`,
                },
                ConditionExpression: [
                  'attribute_exists(pk)',
                  'attribute_exists(sk)',
                ].join(' AND '),
              },
            },
            {
              Update: {
                TableName: process.env.APP_TABLE_NAME,
                Key: {
                  pk: 'tunes',
                  sk: `tuneId#${id}`,
                },
                UpdateExpression: 'ADD likes :additionalValue',
                ConditionExpression: [
                  'attribute_exists(pk)',
                  'attribute_exists(sk)',
                ].join(' AND '),
                ExpressionAttributeValues: {
                  ':additionalValue': -1,
                },
              },
            },
          ],
        }));
      }
    } catch {
      //
    }
  }

  const { Item: tune } = await dynamodb.send(new GetCommand({
    TableName: process.env.APP_TABLE_NAME,
    Key: {
      pk: 'tunes',
      sk: `tuneId#${id}`,
    },
  }));

  if (tune === undefined) {
    return response({
      message: 'Not found',
    }, 404);
  }

  const { Item: user } = await dynamodb.send(new GetCommand({
    TableName: process.env.APP_TABLE_NAME,
    Key: {
      pk: `userId#${tune.userId}`,
      sk: `userId#${tune.userId}`,
    },
    AttributesToGet: [
      'id',
      'nickname',
      'picture',
    ],
  }));

  if (user === undefined) {
    return response({
      message: 'Not found',
    }, 404);
  }

  Object.assign(tune, {
    user,
  });

  const { Item: isLiked } = await dynamodb.send(new GetCommand({
    TableName: process.env.APP_TABLE_NAME,
    Key: {
      pk: `userId#${userId}`,
      sk: `tuneLikeId#${id}`,
    },
  }));

  Object.assign(tune, {
    isLiked: !!isLiked,
  });

  return response(tune);
};
