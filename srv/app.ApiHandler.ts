// Node.js Core Modules
import { randomFillSync } from 'crypto';

// AWS Lambda
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';

// AWS SDK
import { DynamoDB } from 'aws-sdk';

// AWS SDK - DynamoDB
const dynamodb = new DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
});

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    for (let [{ path, httpMethod }, route] of routes) {
      if (httpMethod === event.httpMethod) {
        let match: RegExpExecArray | null;
        if (match = path.exec(event.path)) {
          // Parse the JSON of request body.
          const params = parse(event.body);

          // Merge query string parameters.
          Object.entries(event.multiValueQueryStringParameters ?? {}).forEach(([name, values]) => {
            params[name] = values && values.length ? values.length === 1 ? values[0] : values : '';
          });

          // Invoke the route.
          return await route(event, params, match.groups ?? {});
        }
      }
    }

    return response({
      message: 'Not found',
    }, 404);
  } catch (e) {
    console.error(e);
    return response({
      message: 'Internal server error',
    }, 500);
  }
};

// List of Api Routes
const routes = new Map([
  [
    {
      path: /^\/tunes$/,
      httpMethod: 'GET',
    },
    async (event: APIGatewayProxyEvent, params: Record<string, any>) => {
      const ExclusiveStartKey = (({ after }) => {
        try {
          return JSON.parse(Buffer.from(after, 'base64').toString());
        } catch {
          //
        }
      })(params);

      const { Items: tunes, LastEvaluatedKey } = await dynamodb.query({
        TableName: process.env.APP_TABLE_NAME!,
        IndexName: 'LSI-PublishedAt',
        Limit: 24,
        ScanIndexForward: false,
        ExclusiveStartKey,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': 'tunes',
        },
      }).promise();

      const after = ((key) => {
        try {
          return Buffer.from(JSON.stringify(key)).toString('base64');
        } catch {
          //
        }
      })(LastEvaluatedKey);

      // Get unique user ids.
      const userIds = [...new Set(tunes?.map(({ userId }) => userId))];

      // Get users.
      const { Responses } = await dynamodb.batchGet({
        RequestItems: {
          [process.env.APP_TABLE_NAME!]: {
            Keys: userIds.map((userId) => ({
              pk: 'users',
              sk: `userId#${userId}`,
            })),
            AttributesToGet: [
              'id',
              'name',
              'picture',
            ],
          },
        },
      }).promise();

      // Get users by id.
      const users = Responses?.[process.env.APP_TABLE_NAME!]?.reduce?.((users, user) => {
        return { ...users, [user.id]: user };
      }, {});

      // Add user to tune.
      tunes?.forEach?.((tune) => (tune.user = users?.[tune.userId]));

      return response({
        tunes,
        after,
      });
    },
  ],
  [
    {
      path: /^\/tunes$/,
      httpMethod: 'POST',
    },
    async ({ requestContext: { identity: { cognitoAuthenticationProvider, cognitoIdentityId: identityId } } }: APIGatewayProxyEvent, { title, description, midiKey }: Record<string, any>) => {
      if (!cognitoAuthenticationProvider) {
        return response({
          message: 'Unauthorized',
        }, 401);
      }

      // Get user id from cognito authentication provider.
      const userId = cognitoAuthenticationProvider.split(':').slice(-1)[0];

      if (!title || !description || !midiKey) {
        return response({
          message: 'Unprocessable entity',
        }, 422);
      }

      while (true) {
        try {
          const id = [...randomFillSync(new Uint32Array(11))].map((i) => i % 64).map((i) => {
            return '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'[i];
          }).join('');

          await dynamodb.put({
            TableName: process.env.APP_TABLE_NAME!,
            Item: {
              pk: 'tunes',
              sk: `tuneId#${id}`,
              id,
              userId,
              identityId,
              title,
              description,
              midiKey,
              publishedAt: Date.now(),
              views: 0,
              likes: 0,
              favorites: 0,
              comments: 0,
            },
            ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
          }).promise();

          return response({ id });
        } catch (e: any) {
          if (e.code === 'ConditionalCheckFailedException') {
            continue;
          } else {
            throw e;
          }
        }
      }
    },
  ],
  [
    {
      path: /^\/tunes\/(?<id>[\w-]{11})$/,
      httpMethod: 'GET',
    },
    async (event: APIGatewayProxyEvent, params: Record<string, any>, { id }: Record<string, string>) => {
      const { Item: tune } = await dynamodb.get({
        TableName: process.env.APP_TABLE_NAME!,
        Key: {
          pk: 'tunes',
          sk: `tuneId#${id}`,
        },
      }).promise();

      if (tune === undefined) {
        return response({
          message: 'Not found',
        }, 404);
      }

      const { Item: user } = await dynamodb.get({
        TableName: process.env.APP_TABLE_NAME!,
        Key: {
          pk: 'users',
          sk: `userId#${tune.userId}`,
        },
        AttributesToGet: [
          'id',
          'name',
          'picture',
        ],
      }).promise();

      if (user === undefined) {
        return response({
          message: 'Not found',
        }, 404);
      }

      return response(Object.assign(tune, {
        user,
      }));
    },
  ],
]);

const parse = (body: string | null): Record<string, any> => {
  if (body === null) {
    return {};
  }

  const params = (() => {
    try {
      return JSON.parse(body);
    } catch {
      //
    }
  })();

  if (params instanceof Object) {
    return params;
  } else {
    return {};
  }
};

const response = (body: any, statusCode = 200): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
};
