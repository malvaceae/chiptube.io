// AWS Lambda
import {
  PostAuthenticationTriggerEvent,
  PostAuthenticationTriggerHandler,
  PostConfirmationTriggerEvent,
  PostConfirmationTriggerHandler,
} from 'aws-lambda';

// AWS SDK
import { DynamoDB } from 'aws-sdk';

// AWS SDK - DynamoDB
const dynamodb = new DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
});

export const handler: PostAuthenticationTriggerHandler | PostConfirmationTriggerHandler = async (event: PostAuthenticationTriggerEvent | PostConfirmationTriggerEvent): Promise<any> => {
  const { sub: id, name, email, picture } = event.request.userAttributes;

  await dynamodb.put({
    TableName: process.env.APP_TABLE_NAME!,
    Item: {
      pk: 'users',
      sk: `userId#${id}`,
      id,
      name,
      email,
      picture,
    },
  }).promise();

  return event;
};
