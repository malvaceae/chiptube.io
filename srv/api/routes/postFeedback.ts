// AWS Lambda
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';

// Api Commons
import {
  ajv,
  dynamodb,
  getUserId,
  response,
  sns,
} from '@/api/commons';

export default async ({ body, requestContext: { identity: { cognitoAuthenticationProvider, cognitoIdentityId: identityId, sourceIp, userAgent } } }: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Parse the JSON of request body.
  const params = JSON.parse(body ?? '{}');

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
  if (!validate(params)) {
    return response({
      message: 'Unprocessable entity',
      errors: validate.errors?.filter?.(({ message }) => message)?.reduce?.((errors, { instancePath, message }) => {
        return { ...errors, [instancePath.slice(1)]: [...(errors[instancePath.slice(1)] ?? []), message ?? ''] };
      }, {} as Record<string, string[]>),
    }, 422);
  }

  // Build the message.
  const messages = [
    params.text,
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
    const { Item: user } = await dynamodb.get({
      TableName: process.env.APP_TABLE_NAME!,
      Key: {
        pk: `userId#${userId}`,
        sk: `userId#${userId}`,
      },
    }).promise();

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
  await sns.publish({
    TopicArn: process.env.FEEDBACK_TOPIC_ARN,
    Message: messages.join('\n'),
    Subject: 'ChipTube Feedback',
  }).promise();

  return response({
    message: 'OK',
  });
};
