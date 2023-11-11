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
  BatchGetCommand,
  QueryCommand,
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

  const exclusiveStartKey = (({ after }) => {
    if (typeof after === 'string') {
      try {
        return JSON.parse(Buffer.from(after, 'base64').toString());
      } catch {
        //
      }
    }
  })(req.query);

  const { tunes, lastEvaluatedKey } = await (async () => {
    // Get liked tunes and the last evaluated key.
    const { Items: likedTunes, LastEvaluatedKey: lastEvaluatedKey } = await dynamodb.send(new QueryCommand({
      TableName: process.env.APP_TABLE_NAME,
      IndexName: 'LSI-PublishedAt',
      Limit: 24,
      ScanIndexForward: false,
      ExclusiveStartKey: exclusiveStartKey,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': `userId#${userId}#likes`,
      },
    }));

    if (!likedTunes?.length) {
      return {};
    }

    // Get tune ids.
    const tuneIds = likedTunes.map(({ sk }) => sk.split('#')[1]);

    // Get raw responses.
    const { Responses: responses } = await dynamodb.send(new BatchGetCommand({
      RequestItems: {
        [process.env.APP_TABLE_NAME]: {
          Keys: tuneIds.map((tuneId) => ({
            pk: 'tunes',
            sk: `tuneId#${tuneId}`,
          })),
        },
      },
    }));

    // Get tunes.
    const tunes = responses?.[process.env.APP_TABLE_NAME]?.sort?.((a, b) => {
      return tuneIds.indexOf(a.id) - tuneIds.indexOf(b.id);
    });

    return {
      tunes,
      lastEvaluatedKey,
    };
  })();

  if (!tunes?.length) {
    return res.send({
      tunes: [],
    });
  }

  const after = ((lastEvaluatedKey) => {
    if (lastEvaluatedKey) {
      try {
        return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64');
      } catch {
        //
      }
    }
  })(lastEvaluatedKey);

  // Get unique user ids.
  const userIds = [...new Set(tunes.map(({ userId }) => userId))];

  // Get raw responses.
  const { Responses: responses } = await dynamodb.send(new BatchGetCommand({
    RequestItems: {
      [process.env.APP_TABLE_NAME]: {
        Keys: userIds.map((userId) => ({
          pk: `userId#${userId}`,
          sk: `userId#${userId}`,
        })),
        AttributesToGet: [
          'id',
          'nickname',
          'picture',
        ],
      },
    },
  }));

  // Get users.
  const users = responses?.[process.env.APP_TABLE_NAME];

  if (users === undefined) {
    throw createError(404);
  }

  // Get users by id.
  const usersById = Object.fromEntries(users.map((user) => {
    return [user.id, user];
  }));

  // Add user to tune.
  tunes.forEach((tune) => Object.assign(tune, {
    user: usersById[tune.userId],
  }));

  return res.send({
    tunes,
    after,
  });
};
