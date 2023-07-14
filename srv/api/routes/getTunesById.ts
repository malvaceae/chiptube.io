// AWS Lambda
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';

// Api Commons
import {
  dynamodb,
  response,
} from '@/api/commons';

export default async ({ pathParameters, queryStringParameters }: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Get the tune id.
  const { id } = pathParameters ?? {};

  if (!id) {
    return response({
      message: 'Not found',
    }, 404);
  }

  const exclusiveStartKey = (({ after }) => {
    if (after) {
      try {
        return JSON.parse(Buffer.from(after, 'base64').toString());
      } catch {
        //
      }
    }
  })(queryStringParameters ?? {});

  const { tunes, lastEvaluatedKey } = await (async () => {
    // Get keywords.
    const { Items: keywords } = await dynamodb.query({
      TableName: process.env.APP_TABLE_NAME!,
      IndexName: 'GSI-AdjacencyList',
      KeyConditionExpression: [
        'sk = :sk',
        'begins_with(pk, :pk)',
      ].join(' AND '),
      ExpressionAttributeValues: {
        ':sk': `tuneId#${id}`,
        ':pk': 'tuneKeyword#',
      },
    }).promise();

    if (keywords === undefined) {
      return {};
    }

    // Get tune ids by keyword.
    const tuneIdsByKeyword = await Promise.all(keywords.map(({ keyword }) => {
      return dynamodb.query({
        TableName: process.env.APP_TABLE_NAME!,
        FilterExpression: 'tuneId <> :tuneId',
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `tuneKeyword#${keyword}`,
          ':tuneId': id,
        },
      }).promise();
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
    const { Responses: responses } = await dynamodb.batchGet({
      RequestItems: {
        [process.env.APP_TABLE_NAME!]: {
          Keys: sortedTuneIds.map((tuneId) => ({
            pk: 'tunes',
            sk: `tuneId#${tuneId}`,
          })),
        },
      },
    }).promise();

    // Get tunes.
    const tunes = responses?.[process.env.APP_TABLE_NAME!]?.sort?.((a, b) => {
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
    return response({
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
  const { Responses: responses } = await dynamodb.batchGet({
    RequestItems: {
      [process.env.APP_TABLE_NAME!]: {
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
  }).promise();

  // Get users.
  const users = responses?.[process.env.APP_TABLE_NAME!];

  if (users === undefined) {
    return response({
      message: 'Not found',
    }, 404);
  }

  // Get users by id.
  const usersById = Object.fromEntries(users.map((user) => {
    return [user.id, user];
  }));

  // Add user to tune.
  tunes.forEach((tune) => Object.assign(tune, {
    user: usersById[tune.userId],
  }));

  return response({
    tunes,
    after,
  });
};
