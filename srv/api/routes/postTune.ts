// Node.js Core Modules
import { randomFillSync } from 'crypto';

// AWS Lambda
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';

// AWS SDK - DynamoDB - Document Client
import {
  BatchWriteCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';

// AWS SDK - S3
import { GetObjectCommand } from '@aws-sdk/client-s3';

// Api Commons
import {
  ajv,
  dynamodb,
  getUserId,
  getWords,
  normalize,
  response,
  s3,
  tokenize,
} from '@/api/commons';

export default async ({ body, requestContext: { identity: { cognitoAuthenticationProvider, cognitoIdentityId: identityId } } }: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
  const validate = ajv.compile({
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
    },
    required: [
      'title',
      'description',
      'midiKey',
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

  // Get a title, a description and a midi key.
  const { title, description, midiKey } = params;

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
    return response({
      message: 'Unprocessable entity',
      errors: {
        midiKey: [
          'does NOT indicate a valid MIDI file',
        ],
      },
    }, 422);
  }

  while (true) {
    try {
      const id = [...randomFillSync(new Uint32Array(11))].map((i) => i % 64).map((i) => {
        return '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'[i];
      }).join('');

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
                publishedAt: Date.now(),
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
                pk: `userId#${userId}`,
                sk: `tuneId#${id}`,
              },
              ConditionExpression: [
                'attribute_not_exists(pk)',
                'attribute_not_exists(sk)',
              ].join(' AND '),
            },
          },
        ],
      }));

      // Tokenize title and description.
      const keywords = getWords(await tokenize([title, description].join())).map(normalize);

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

      return response({ id });
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
