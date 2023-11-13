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
  BatchWriteCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';

// AWS SDK - S3
import {
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

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
  const validate = ajv.compile<{ title: string, description: string, midiKey: string, thumbnailKey?: string }>({
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
      midiKey: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        pattern: '\\S',
      },
      thumbnailKey: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        pattern: '\\S',
      },
    },
    required: [
      'title',
      'description',
      'midiKey',
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

  // Get a title, a description, a midi key and a thumbnail key.
  const { title, description, midiKey, thumbnailKey } = req.body;

  // Get a midi file.
  const midiFile = await (async () => {
    try {
      const { Body: midiFile } = await s3.send(new GetObjectCommand({
        Bucket: process.env.APP_STORAGE_BUCKET_NAME,
        Key: `protected/${identityId}/${midiKey}`,
        Range: 'bytes=0-3',
      }));

      return midiFile?.transformToByteArray?.();
    } catch {
      //
    }
  })();

  // Validate a midi file.
  if (!midiFile || !(midiFile[0] === 0x4D && midiFile[1] === 0x54 && midiFile[2] === 0x68 && midiFile[3] === 0x64)) {
    throw createError(422, {
      errors: {
        midiKey: [
          'does NOT indicate a valid MIDI file',
        ],
      },
    });
  }

  // Get a thumbnail file size.
  const thumbnailFileSize = await (async () => {
    if (thumbnailKey) {
      return await s3.send(new HeadObjectCommand({
        Bucket: process.env.APP_STORAGE_BUCKET_NAME,
        Key: `protected/${identityId}/${thumbnailKey}`,
      })).then(({ ContentLength }) => ContentLength);
    }
  })();

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

  while (true) {
    try {
      const id = [...randomFillSync(new Uint32Array(11))].map((i) => i % 64).map((i) => {
        return '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'[i];
      }).join('');

      // Get the current time in milliseconds.
      const publishedAt = Date.now();

      await dynamodb.send(new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: process.env.APP_TABLE_NAME,
              Item: {
                pk: 'tunes',
                sk: `tuneId#${id}`,
                id,
                userId,
                identityId,
                lastViewedIdentityId: identityId,
                title,
                description,
                midiKey,
                thumbnailKey,
                publishedAt,
                views: 0,
                likes: 0,
                favorites: 0,
                comments: 0,
              },
              ConditionExpression: [
                'attribute_not_exists(pk)',
                'attribute_not_exists(sk)',
              ].join(' AND '),
            },
          },
          {
            Put: {
              TableName: process.env.APP_TABLE_NAME,
              Item: {
                pk: `userId#${userId}#tunes`,
                sk: `tuneId#${id}`,
                id,
                publishedAt,
              },
              ConditionExpression: [
                'attribute_not_exists(pk)',
                'attribute_not_exists(sk)',
              ].join(' AND '),
            },
          },
        ],
      }));

      // Get keywords by tokenizing title and description.
      const keywords = getWords(await tokenize([title, description].join())).map(normalize);

      // Get number of occurrences by keywords.
      const occurrences = Object.entries(keywords.reduce((occurrences, keyword) => {
        return { ...occurrences, [keyword]: (occurrences[keyword] ?? 0) + 1 };
      }, {} as Record<string, number>));

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

      return res.send({
        id,
      });
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
