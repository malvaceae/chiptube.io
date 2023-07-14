// AWS Lambda
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';

// Api Commons
import {
  ajv,
  cognito,
  dynamodb,
  getUserId,
  getUserPoolId,
  response,
} from '@/api/commons';

export default async ({ body, requestContext: { identity: { cognitoAuthenticationProvider } } }: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (!cognitoAuthenticationProvider) {
    return response({
      message: 'Unauthorized',
    }, 401);
  }

  // Get the user id from cognito authentication provider.
  const userId = getUserId(cognitoAuthenticationProvider);

  // Get the user pool id from cognito authentication provider.
  const userPoolId = getUserPoolId(cognitoAuthenticationProvider);

  // Parse the JSON of request body.
  const params = JSON.parse(body ?? '{}');

  // Compile the parameter schema.
  const validate = ajv.compile<{ nickname?: string }>({
    type: 'object',
    properties: {
      nickname: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        pattern: '\\S',
      },
    },
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

  if (params.nickname) {
    const { Attributes: user } = await dynamodb.update({
      TableName: process.env.APP_TABLE_NAME!,
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
        ':nickname': params.nickname,
      },
    }).promise();

    if (!user) {
      throw Error('The user not found.');
    }

    await cognito.adminUpdateUserAttributes({
      UserPoolId: userPoolId,
      Username: user.userName,
      UserAttributes: [
        {
          Name: 'nickname',
          Value: params.nickname,
        },
      ],
    }).promise();
  }

  return response({
    message: 'OK',
  });
};
