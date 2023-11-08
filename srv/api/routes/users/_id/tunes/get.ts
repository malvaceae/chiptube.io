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
    // Get tune ids.
    const { Items: tuneIds } = await dynamodb.send(new QueryCommand({
      TableName: process.env.APP_TABLE_NAME,
      KeyConditionExpression: [
        'pk = :pk',
        'begins_with(sk, :sk)',
      ].join(' AND '),
      ExpressionAttributeValues: {
        ':pk': `userId#${id}`,
        ':sk': 'tuneId#',
      },
    }));

    if (!tuneIds?.length) {
      return {};
    }

    // Skip to after the exclusive start key.
    if (typeof exclusiveStartKey === 'string' && exclusiveStartKey.length > 0) {
      tuneIds.splice(0, tuneIds.findIndex(({ sk }) => {
        return sk.split('#')[1] === exclusiveStartKey;
      }) + 1);
    }

    // Set maximum number of tunes to evaluate.
    tuneIds.splice(24);

    // Get raw responses.
    const { Responses: responses } = await dynamodb.send(new BatchGetCommand({
      RequestItems: {
        [process.env.APP_TABLE_NAME]: {
          Keys: tuneIds.map(({ sk }) => ({
            pk: 'tunes',
            sk,
          })),
        },
      },
    }));

    // Get tunes.
    const tunes = responses?.[process.env.APP_TABLE_NAME];

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
