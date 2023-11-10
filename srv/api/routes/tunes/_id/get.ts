// Express
import {
  Request,
  Response,
} from 'express';

// Serverless Express
import { getCurrentInvoke } from '@vendia/serverless-express';

// HTTP Errors
import createError from 'http-errors';

// AWS SDK - Cognito
import { AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

// AWS SDK - DynamoDB - Document Client
import {
  BatchWriteCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

// Api Services
import {
  cognito,
  dynamodb,
} from '@/api/services';

// Api Utilities
import {
  getUserId,
  getUserPoolId,
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

  // Get the tune id.
  const { id } = req.params;

  try {
    await dynamodb.send(new UpdateCommand({
      TableName: process.env.APP_TABLE_NAME,
      Key: {
        pk: 'tunes',
        sk: `tuneId#${id}`,
      },
      UpdateExpression: `SET ${[
        'lastViewedIdentityId = :identityId',
        '#views = #views + :additionalValue',
      ].join(', ')}`,
      ConditionExpression: [
        'attribute_exists(pk)',
        'attribute_exists(sk)',
        'lastViewedIdentityId <> :identityId',
      ].join(' AND '),
      ExpressionAttributeNames: {
        '#views': 'views',
      },
      ExpressionAttributeValues: {
        ':identityId': identityId,
        ':additionalValue': 1,
      },
    }));
  } catch {
    //
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

  try {
    // Add tune published time to user tunes.
    await dynamodb.send(new UpdateCommand({
      TableName: process.env.APP_TABLE_NAME,
      Key: {
        pk: `userId#${tune.userId}`,
        sk: `tuneId#${id}`,
      },
      UpdateExpression: `SET ${[
        'publishedAt = :publishedAt',
      ].join(', ')}`,
      ConditionExpression: [
        'attribute_exists(pk)',
        'attribute_exists(sk)',
        'attribute_not_exists(publishedAt)',
      ].join(' AND '),
      ExpressionAttributeValues: {
        ':publishedAt': tune.publishedAt,
      },
    }));
  } catch {
    //
  }

  try {
    if (!cognitoAuthenticationProvider) {
      throw createError(404);
    }

    // Get the user pool id from cognito authentication provider.
    const userPoolId = getUserPoolId(cognitoAuthenticationProvider);

    // Get tune likes.
    const { Items: likes } = await dynamodb.send(new QueryCommand({
      TableName: process.env.APP_TABLE_NAME,
      IndexName: 'GSI-AdjacencyList',
      KeyConditionExpression: [
        'sk = :sk',
        'begins_with(pk, :pk)',
      ].join(' AND '),
      ExpressionAttributeValues: {
        ':sk': `tuneLikeId#${id}`,
        ':pk': 'userId#',
      },
    }));

    if (likes === undefined) {
      throw createError(404);
    }

    // Add tune published time to tune likes.
    await Promise.all([...Array(Math.ceil(likes.length / 25)).keys()].map((i) => likes.slice(i * 25, (i + 1) * 25)).map(async (likes) => {
      return await dynamodb.send(new BatchWriteCommand({
        RequestItems: {
          [process.env.APP_TABLE_NAME]: await Promise.all(likes.map(async ({ pk, sk }) => {
            const { Item: user } = await dynamodb.send(new GetCommand({
              TableName: process.env.APP_TABLE_NAME,
              Key: {
                pk,
                sk: pk,
              },
              AttributesToGet: [
                'userName',
              ],
            }));

            if (user === undefined) {
              return {};
            }

            const { UserAttributes } = await cognito.send(new AdminGetUserCommand({
              UserPoolId: userPoolId,
              Username: user.userName,
            }));

            const identities = UserAttributes?.filter?.(({ Name }) => Name === 'identities')?.map(({ Value }) => Value && JSON.parse(Value))?.pop?.();

            if (identities === undefined) {
              return {};
            }

            return {
              PutRequest: {
                Item: {
                  pk,
                  sk,
                  publishedAt: Math.max(identities[0].dateCreated, tune.publishedAt),
                },
              },
            };
          })),
        },
      }));
    }));
  } catch {
    //
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

  if (!cognitoAuthenticationProvider) {
    return res.send(tune);
  }

  // Get the user id from cognito authentication provider.
  const userId = getUserId(cognitoAuthenticationProvider);

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
