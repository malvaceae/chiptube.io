// AWS Lambda
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';

// Api Commons
import {
  dynamodb,
  getUserId,
  response,
} from '@/api/commons';

export default async ({ pathParameters, requestContext: { identity: { cognitoAuthenticationProvider, cognitoIdentityId: identityId } } }: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Get the tune id.
  const { id } = pathParameters ?? {};

  if (!id) {
    return response({
      message: 'Not found',
    }, 404);
  }

  try {
    await dynamodb.update({
      TableName: process.env.APP_TABLE_NAME!,
      Key: {
        pk: 'tunes',
        sk: `tuneId#${id}`,
      },
      UpdateExpression: `SET ${[
        'lastViewedIdentityId = :identityId',
        '#views = #views + :additionalValue',
      ].join(', ')}`,
      ConditionExpression: [
        'attribute_exists(pk)',
        'attribute_exists(sk)',
        'lastViewedIdentityId <> :identityId',
      ].join(' AND '),
      ExpressionAttributeNames: {
        '#views': 'views',
      },
      ExpressionAttributeValues: {
        ':identityId': identityId,
        ':additionalValue': 1,
      },
    }).promise();
  } catch {
    //
  }

  const { Item: tune } = await dynamodb.get({
    TableName: process.env.APP_TABLE_NAME!,
    Key: {
      pk: 'tunes',
      sk: `tuneId#${id}`,
    },
  }).promise();

  if (tune === undefined) {
    return response({
      message: 'Not found',
    }, 404);
  }

  const { Item: user } = await dynamodb.get({
    TableName: process.env.APP_TABLE_NAME!,
    Key: {
      pk: `userId#${tune.userId}`,
      sk: `userId#${tune.userId}`,
    },
    AttributesToGet: [
      'id',
      'nickname',
      'picture',
    ],
  }).promise();

  if (user === undefined) {
    return response({
      message: 'Not found',
    }, 404);
  }

  Object.assign(tune, {
    user,
  });

  if (!cognitoAuthenticationProvider) {
    return response(tune);
  }

  // Get the user id from cognito authentication provider.
  const userId = getUserId(cognitoAuthenticationProvider);

  const { Item: isLiked } = await dynamodb.get({
    TableName: process.env.APP_TABLE_NAME!,
    Key: {
      pk: `userId#${userId}`,
      sk: `tuneLikeId#${id}`,
    },
  }).promise();

  Object.assign(tune, {
    isLiked: !!isLiked,
  });

  return response(tune);
};
