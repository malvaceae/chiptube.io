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
  GetCommand,
  UpdateCommand,
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
      pk: `userId#${userId}#likedTunes`,
      sk: `tuneId#${id}`,
    },
  }));

  Object.assign(tune, {
    isLiked: !!isLiked,
  });

  return res.send(tune);
};
