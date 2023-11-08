// Express
import {
  Request,
  Response,
} from 'express';

// HTTP Errors
import createError from 'http-errors';

// AWS SDK - DynamoDB - Document Client
import { GetCommand } from '@aws-sdk/lib-dynamodb';

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

  return res.send(user);
};
