// AWS Lambda
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';

// AWS SDK
import {
  DynamoDB,
  S3,
} from 'aws-sdk';

// AWS SDK - DynamoDB
const dynamodb = new DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
});

// AWS SDK - S3
const s3 = new S3({
  apiVersion: '2006-03-01',
});

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    for (let [{ path, httpMethod }, route] of routes) {
      if (httpMethod === event.httpMethod) {
        let match: RegExpExecArray | null;
        if (match = path.exec(event.path)) {
          return route(match.groups ?? {});
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
    async () => {
      const { Items: tunes } = await dynamodb.query({
        TableName: process.env.APP_TABLE_NAME!,
        IndexName: 'LSI-PublishedAt',
        ScanIndexForward: false,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': 'tunes',
        },
      }).promise();

      return response({
        tunes,
      });
    },
  ],
  [
    {
      path: /^\/tunes\/(?<id>[\w-]{11})$/,
      httpMethod: 'GET',
    },
    async ({ id }: Record<string, string>) => {
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

      tune.url = await s3.getSignedUrlPromise('getObject', {
        Bucket: process.env.APP_STORAGE,
        Key: `tunes/${id}.mid`,
      });

      return response(tune);
    },
  ],
]);

const response = (body: any, statusCode = 200): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
};
