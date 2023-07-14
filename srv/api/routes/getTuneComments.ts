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

  const { comments, lastEvaluatedKey } = await (async () => {
    // Get comments and the last evaluated key.
    const { Items: comments, LastEvaluatedKey: lastEvaluatedKey } = await dynamodb.query({
      TableName: process.env.APP_TABLE_NAME!,
      IndexName: 'LSI-PublishedAt',
      Limit: 24,
      ScanIndexForward: false,
      ExclusiveStartKey: exclusiveStartKey,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': `tuneId#${id}#comments`,
      },
    }).promise();

    return {
      comments,
      lastEvaluatedKey,
    };
  })();

  if (!comments?.length) {
    return response({
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

  // Add user to comment.
  comments.forEach((comment) => Object.assign(comment, {
    user: usersById[comment.userId],
  }));

  return response({
    comments,
    after,
  });
};
