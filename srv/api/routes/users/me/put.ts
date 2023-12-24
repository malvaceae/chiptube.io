// Express
import {
  Request,
  Response,
} from 'express';

// Serverless Express
import { getCurrentInvoke } from '@vendia/serverless-express';

// HTTP Errors
import createError from 'http-errors';

// AWS SDK - Cognito
import { AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';

// AWS SDK - DynamoDB - Document Client
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Api Services
import {
  ajv,
  cognito,
  dynamodb,
} from '@/api/services';

// Api Utilities
import {
  getUserId,
  getUserPoolId,
} from '@/api/utils';

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

  // Get the user pool id from cognito authentication provider.
  const userPoolId = getUserPoolId(cognitoAuthenticationProvider);

  // Compile the parameter schema.
  const validate = ajv.compile<{ nickname?: string }>({
    type: 'object',
    properties: {
      nickname: {
        type: 'string',
        minLength: 1,
        maxLength: 31,
        pattern: '\\S',
      },
    },
  });

  // Validate request parameters.
  if (!validate(req.body)) {
    throw createError(422, {
      message: validate.errors?.map?.(({ instancePath, message }) => {
        return `The ${instancePath.slice(1)} ${message}.`;
      })?.join?.('\n'),
    });
  }

  if (req.body.nickname) {
    const { Attributes: user } = await dynamodb.send(new UpdateCommand({
      TableName: process.env.APP_TABLE_NAME,
      Key: {
        pk: `userId#${userId}`,
        sk: `userId#${userId}`,
      },
      ReturnValues: 'ALL_NEW',
      UpdateExpression: `SET ${[
        '#nickname = :nickname',
      ].join(', ')}`,
      ConditionExpression: [
        'attribute_exists(pk)',
        'attribute_exists(sk)',
      ].join(' AND '),
      ExpressionAttributeNames: {
        '#nickname': 'nickname',
      },
      ExpressionAttributeValues: {
        ':nickname': req.body.nickname,
      },
    }));

    if (!user) {
      throw Error('The user not found.');
    }

    await cognito.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: user.userName,
      UserAttributes: [
        {
          Name: 'nickname',
          Value: req.body.nickname,
        },
      ],
    }));
  }

  return res.send({
    message: 'OK',
  });
};
