// AWS Lambda
import {
  PostAuthenticationTriggerEvent,
  PostAuthenticationTriggerHandler,
  PostConfirmationTriggerEvent,
  PostConfirmationTriggerHandler,
} from 'aws-lambda';

// AWS SDK
import {
  CognitoIdentityServiceProvider,
  DynamoDB,
} from 'aws-sdk';

// AWS SDK - Cognito
const cognito = new CognitoIdentityServiceProvider({
  apiVersion: '2016-04-18',
});

// AWS SDK - DynamoDB
const dynamodb = new DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
});

export const handler: PostAuthenticationTriggerHandler | PostConfirmationTriggerHandler = async (event: PostAuthenticationTriggerEvent | PostConfirmationTriggerEvent): Promise<any> => {
  const { userPoolId, userName, request: { userAttributes: { sub: id, name, nickname, email, picture } } } = event;

  await dynamodb.put({
    TableName: process.env.APP_TABLE_NAME!,
    Item: {
      pk: `userId#${id}`,
      sk: `userId#${id}`,
      id,
      userName,
      name,
      nickname: nickname ?? name,
      email,
      picture,
    },
  }).promise();

  if (!nickname) {
    await cognito.adminUpdateUserAttributes({
      UserPoolId: userPoolId,
      Username: userName,
      UserAttributes: [
        {
          Name: 'nickname',
          Value: name,
        },
      ],
    }).promise();
  }

  return event;
};
