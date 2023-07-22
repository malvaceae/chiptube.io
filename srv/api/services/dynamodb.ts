// AWS SDK - DynamoDB
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// AWS SDK - DynamoDB - Document Client
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// AWS SDK - DynamoDB - Client
export default DynamoDBDocumentClient.from(new DynamoDBClient({
  apiVersion: '2012-08-10',
}));
