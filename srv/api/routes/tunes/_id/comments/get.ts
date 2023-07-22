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

  const { comments, lastEvaluatedKey } = await (async () => {
    // Get comments and the last evaluated key.
    const { Items: comments, LastEvaluatedKey: lastEvaluatedKey } = await dynamodb.send(new QueryCommand({
      TableName: process.env.APP_TABLE_NAME,
      IndexName: 'LSI-PublishedAt',
      Limit: 24,
      ScanIndexForward: false,
      ExclusiveStartKey: exclusiveStartKey,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': `tuneId#${id}#comments`,
      },
    }));

    return {
      comments,
      lastEvaluatedKey,
    };
  })();

  if (!comments?.length) {
    return res.send({
      comments: [],
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
  const userIds = [...new Set(comments.map(({ userId }) => userId))];

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

  // Add user to comment.
  comments.forEach((comment) => Object.assign(comment, {
    user: usersById[comment.userId],
  }));

  return res.send({
    comments,
    after,
  });
};
