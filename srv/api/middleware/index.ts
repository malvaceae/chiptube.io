// Express
import {
  NextFunction,
  Request,
  Response,
} from 'express';

// HTTP Errors
import createError, {
  isHttpError,
} from 'http-errors';

// Error Handler
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const { errors, expose, message, statusCode } = isHttpError(err) ? err : createError(err);

  if (expose) {
    return res.status(statusCode).send({
      message,
      errors,
    });
  } else {
    console.error(message);
    return res.status(statusCode).send({
      message: 'Internal Server Error',
    });
  }
};
