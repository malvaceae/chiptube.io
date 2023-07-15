// AWS Lambda
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';

// Api Commons
import { response } from '@/api/commons';

// Api Routes
import {
  getTunes,
  postTune,
  getTuneById,
  putTuneById,
  getTuneComments,
  postTuneComment,
  getTunesById,
  putUserByMe,
  postFeedback,
} from '@/api/routes';

// List of Api Routes
const routes = new Map<{ resource: string, httpMethod: string }, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>>([
  [{ resource: '/tunes', httpMethod: 'GET' }, getTunes],
  [{ resource: '/tunes', httpMethod: 'POST' }, postTune],
  [{ resource: '/tunes/{id}', httpMethod: 'GET' }, getTuneById],
  [{ resource: '/tunes/{id}', httpMethod: 'PUT' }, putTuneById],
  [{ resource: '/tunes/{id}/comments', httpMethod: 'GET' }, getTuneComments],
  [{ resource: '/tunes/{id}/comments', httpMethod: 'POST' }, postTuneComment],
  [{ resource: '/tunes/{id}/tunes', httpMethod: 'GET' }, getTunesById],
  [{ resource: '/users/me', httpMethod: 'PUT' }, putUserByMe],
  [{ resource: '/feedback', httpMethod: 'POST' }, postFeedback],
]);

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    for (const [{ resource, httpMethod }, route] of routes) {
      if (httpMethod === event.httpMethod) {
        if (resource === event.resource) {
          return await route(event);
        }
      }
    }

    return response({
      message: 'Not found',
    }, 404);
  } catch (e) {
    console.error(e);
    return response({
      message: 'Internal server error',
    }, 500);
  }
};
