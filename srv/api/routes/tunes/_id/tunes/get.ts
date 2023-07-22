// Express
import {
  Request,
  Response,
} from 'express';

// HTTP Errors
import createError from 'http-errors';

// AWS SDK - DynamoDB - Document Client
import {
  BatchGetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

// Api Services
import { dynamodb } from '@/api/services';

// Handler
export default async (req: Request, res: Response): Promise<Response> => {
  // Get the tune id.
  const { id } = req.params;

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
      return {};
    }

    // Get tune ids by keyword.
    const tuneIdsByKeyword = await Promise.all(keywords.map(({ keyword }) => {
      return dynamodb.send(new QueryCommand({
        TableName: process.env.APP_TABLE_NAME,
        FilterExpression: 'tuneId <> :tuneId',
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `tuneKeyword#${keyword}`,
          ':tuneId': id,
        },
      }));
    }));

    // Get tune ids.
    const tuneIds = tuneIdsByKeyword.flatMap(({ Items }) => Items ?? []);

    // Get tune ids sorted by relevance.
    const sortedTuneIds = [...new Set(tuneIds.map(({ tuneId }) => tuneId))].sort((a, b) => {
      return (
        tuneIds.filter(({ tuneId }) => tuneId === b).reduce((sum, { occurrences }) => sum + occurrences, 0) -
        tuneIds.filter(({ tuneId }) => tuneId === a).reduce((sum, { occurrences }) => sum + occurrences, 0)
      );
    });

    // Skip to after the exclusive start key.
    if (typeof exclusiveStartKey === 'string' && exclusiveStartKey.length > 0) {
      sortedTuneIds.splice(0, sortedTuneIds.indexOf(exclusiveStartKey) + 1);
    }

    if (sortedTuneIds.length === 0) {
      return {};
    }

    // Set maximum number of tunes to evaluate.
    sortedTuneIds.splice(24);

    // Get raw responses.
    const { Responses: responses } = await dynamodb.send(new BatchGetCommand({
      RequestItems: {
        [process.env.APP_TABLE_NAME]: {
          Keys: sortedTuneIds.map((tuneId) => ({
            pk: 'tunes',
            sk: `tuneId#${tuneId}`,
          })),
        },
      },
    }));

    // Get tunes.
    const tunes = responses?.[process.env.APP_TABLE_NAME]?.sort?.((a, b) => {
      return sortedTuneIds.indexOf(a.id) - sortedTuneIds.indexOf(b.id);
    });

    // Get the last evaluated key.
    const lastEvaluatedKey = (() => {
      if (tunes?.length === 24) {
        return tunes?.[23]?.id;
      }
    })();

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
