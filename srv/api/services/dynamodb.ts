// AWS SDK - DynamoDB
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// AWS SDK - DynamoDB - Document Client
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// AWS SDK - DynamoDB - Client
const client = new DynamoDBClient({
  apiVersion: '2012-08-10',
});

// AWS SDK - DynamoDB - Document Client
export default DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
