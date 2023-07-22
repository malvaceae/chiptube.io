// AWS Lambda
import {
  PostAuthenticationTriggerEvent,
  PostAuthenticationTriggerHandler,
  PostConfirmationTriggerEvent,
  PostConfirmationTriggerHandler,
} from 'aws-lambda';

// AWS SDK - Cognito
import {
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

// AWS SDK - DynamoDB
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// AWS SDK - DynamoDB - Document Client
import {
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

// AWS SDK - Cognito - Client
const cognito = new CognitoIdentityProviderClient({
  apiVersion: '2016-04-18',
});

// AWS SDK - DynamoDB - Client
const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({
  apiVersion: '2012-08-10',
}));

export const handler: PostAuthenticationTriggerHandler | PostConfirmationTriggerHandler = async (event: PostAuthenticationTriggerEvent | PostConfirmationTriggerEvent): Promise<any> => {
  const { userPoolId, userName, request: { userAttributes: { sub: id, name, nickname, email, picture } } } = event;

  await dynamodb.send(new PutCommand({
    TableName: process.env.APP_TABLE_NAME,
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
  }));

  if (!nickname) {
    await cognito.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: userName,
      UserAttributes: [
        {
          Name: 'nickname',
          Value: name,
        },
      ],
    }));
  }

  return event;
};
