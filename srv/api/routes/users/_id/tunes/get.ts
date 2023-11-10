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
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

// Api Services
import { dynamodb } from '@/api/services';

// Handler
export default async (req: Request, res: Response): Promise<Response> => {
  // Get the user id.
  const { id } = req.params;

  // Get the user.
  const { Item: user } = await dynamodb.send(new GetCommand({
    TableName: process.env.APP_TABLE_NAME,
    Key: {
      pk: `userId#${id}`,
      sk: `userId#${id}`,
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
    // Get user items.
    const { Items: items } = await dynamodb.send(new QueryCommand({
      TableName: process.env.APP_TABLE_NAME,
      IndexName: 'LSI-PublishedAt',
      ScanIndexForward: false,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': `userId#${id}`,
      },
    }));

    // Get tune ids.
    const tuneIds = items?.filter?.(({ sk }) => sk.startsWith('tuneId#'))?.map?.(({ sk }) => sk.split('#')[1]) ?? [];

    // Skip to after the exclusive start key.
    if (typeof exclusiveStartKey === 'string' && exclusiveStartKey.length > 0) {
      tuneIds.splice(0, tuneIds.indexOf(exclusiveStartKey) + 1);
    }

    if (tuneIds.length === 0) {
      return {};
    }

    // Set maximum number of tunes to evaluate.
    tuneIds.splice(24);

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

  // Add user to tune.
  tunes.forEach((tune) => Object.assign(tune, { user }));

  return res.send({
    tunes,
    after,
  });
};
