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
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

// AWS SDK - S3
import { HeadObjectCommand } from '@aws-sdk/client-s3';

// Api Services
import {
  ajv,
  dynamodb,
  s3,
} from '@/api/services';

// Api Utilities
import {
  getUserId,
  getWords,
  normalize,
  tokenize,
} from '@/api/utils';

// Handler
export default async (req: Request, res: Response): Promise<Response> => {
  const {
    event: {
      requestContext: {
        identity: {
          cognitoAuthenticationProvider,
          cognitoIdentityId: identityId,
        },
      },
    },
  } = getCurrentInvoke();

  if (!cognitoAuthenticationProvider) {
    throw createError(401);
  }

  // Get the user id from cognito authentication provider.
  const userId = getUserId(cognitoAuthenticationProvider);

  // Compile the parameter schema.
  const validate = ajv.compile<{ title?: string, description?: string, thumbnailKey?: string, isLiked?: boolean }>({
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
      thumbnailKey: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        pattern: '\\S',
      },
      isLiked: {
        type: 'boolean',
      },
    },
  });

  // Validate request parameters.
  if (!validate(req.body)) {
    throw createError(422, {
      errors: validate.errors?.filter?.(({ message }) => message)?.reduce?.((errors, { instancePath, message }) => {
        return { ...errors, [instancePath.slice(1)]: [...(errors[instancePath.slice(1)] ?? []), message ?? ''] };
      }, {} as Record<string, string[]>),
    });
  }

  // Get a thumbnail file size.
  const thumbnailFileSize = await (async ({ thumbnailKey }) => {
    if (thumbnailKey) {
      return await s3.send(new HeadObjectCommand({
        Bucket: process.env.APP_STORAGE_BUCKET_NAME,
        Key: `protected/${identityId}/${thumbnailKey}`,
      })).then(({ ContentLength }) => ContentLength);
    }
  })(req.body);

  // Validate a thumbnail file.
  if (thumbnailFileSize && thumbnailFileSize > 1024 * 1024 * 2) {
    throw createError(422, {
      errors: {
        thumbnailKey: [
          'must NOT be greater than 2 megabytes',
        ],
      },
    });
  }

  // Get the tune id.
  const { id } = req.params;

  if (req.body.title || req.body.description) {
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

    if (req.body.title) {
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
            ':title': req.body.title,
          },
        }));
      } catch {
        //
      }
    }

    if (req.body.description) {
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
            ':description': req.body.description,
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
        throw createError(404);
      }

      // Delete keywords.
      await Promise.all([...Array(Math.ceil(keywords.length / 25)).keys()].map((i) => keywords.slice(i * 25, (i + 1) * 25)).map((keywords) => {
        return dynamodb.send(new BatchWriteCommand({
          RequestItems: {
            [process.env.APP_TABLE_NAME]: keywords.map(({ pk, sk }) => ({
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
      // Tokenize title and description.
      const keywords = getWords(await tokenize([req.body.title, req.body.description].join())).map(normalize);

      // Get number of occurrences by keyword.
      const occurrences = [...keywords.reduce((keywords, keyword) => {
        return keywords.set(keyword, keywords.get(keyword)! + 1 || 1);
      }, new Map<string, number>)];

      // Add keywords.
      await Promise.all([...Array(Math.ceil(occurrences.length / 25)).keys()].map((i) => occurrences.slice(i * 25, (i + 1) * 25)).map((occurrences) => {
        return dynamodb.send(new BatchWriteCommand({
          RequestItems: {
            [process.env.APP_TABLE_NAME]: occurrences.map(([keyword, occurrences]) => ({
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

  if (req.body.thumbnailKey) {
    try {
      await dynamodb.send(new UpdateCommand({
        TableName: process.env.APP_TABLE_NAME,
        Key: {
          pk: 'tunes',
          sk: `tuneId#${id}`,
        },
        UpdateExpression: `SET ${[
          'thumbnailKey = :thumbnailKey',
        ].join(', ')}`,
        ConditionExpression: [
          'attribute_exists(pk)',
          'attribute_exists(sk)',
        ].join(' AND '),
        ExpressionAttributeValues: {
          ':thumbnailKey': req.body.thumbnailKey,
        },
      }));
    } catch {
      //
    }
  }

  if (typeof req.body.isLiked === 'boolean') {
    try {
      if (req.body.isLiked) {
        await dynamodb.send(new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: process.env.APP_TABLE_NAME,
                Item: {
                  pk: `userId#${userId}`,
                  sk: `tuneLikeId#${id}`,
                  publishedAt: Date.now(),
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
    throw createError(404);
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
    throw createError(404);
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

  return res.send(tune);
};
