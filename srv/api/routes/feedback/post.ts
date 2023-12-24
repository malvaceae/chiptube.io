// Express
import {
  Request,
  Response,
} from 'express';

// Serverless Express
import { getCurrentInvoke } from '@vendia/serverless-express';

// HTTP Errors
import createError from 'http-errors';

// AWS SDK - DynamoDB - Document Client
import { GetCommand } from '@aws-sdk/lib-dynamodb';

// AWS SDK - SNS
import { PublishCommand } from '@aws-sdk/client-sns';

// Api Services
import {
  ajv,
  dynamodb,
  sns,
} from '@/api/services';

// Api Utilities
import { getUserId } from '@/api/utils';

// Handler
export default async (req: Request, res: Response): Promise<Response> => {
  const {
    event: {
      requestContext: {
        identity: {
          cognitoAuthenticationProvider,
          cognitoIdentityId: identityId,
          sourceIp,
          userAgent,
        },
      },
    },
  } = getCurrentInvoke();

  // Compile the parameter schema.
  const validate = ajv.compile({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        minLength: 1,
        maxLength: 4095,
        pattern: '\\S',
      },
    },
    required: [
      'text',
    ],
  });

  // Validate request parameters.
  if (!validate(req.body)) {
    throw createError(422, {
      message: validate.errors?.map?.(({ instancePath, message }) => {
        return `The ${instancePath.slice(1)} ${message}.`;
      })?.join?.('\n'),
    });
  }

  // Build the message.
  const messages = [
    req.body.text,
    '',
    '--',
    'IP Address',
    sourceIp,
    '',
    'User Agent',
    userAgent,
    '',
    'Identity ID',
    identityId,
  ];

  if (cognitoAuthenticationProvider) {
    // Get the user id from cognito authentication provider.
    const userId = getUserId(cognitoAuthenticationProvider);

    // Get the user.
    const { Item: user } = await dynamodb.send(new GetCommand({
      TableName: process.env.APP_TABLE_NAME,
      Key: {
        pk: `userId#${userId}`,
        sk: `userId#${userId}`,
      },
    }));

    // Add the user to messages.
    if (user) {
      messages.push(...[
        '',
        'User ID',
        user.id,
        '',
        'User Name',
        user.name,
        '',
        'User Nickname',
        user.nickname,
        '',
        'User Email',
        user.email,
      ]);
    }
  }

  // Send the feedback.
  await sns.send(new PublishCommand({
    TopicArn: process.env.FEEDBACK_TOPIC_ARN,
    Message: messages.join('\n'),
    Subject: 'ChipTube Feedback',
  }));

  return res.send({
    message: 'OK',
  });
};
