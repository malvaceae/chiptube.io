// Express
import express from 'express';

// Express - CORS
import cors from 'cors';

// Serverless Express
import serverlessExpress from '@vendia/serverless-express';

// HTTP Errors
import createError from 'http-errors';

// Api Middleware
import { errorHandler } from '@/api/middleware';

// Api Router
import router from '@/api/router';

// Express
const app = express();

// Express - JSON
app.use(express.json());

// Express - CORS
app.use(cors());

// Api Router
app.use(router);

// 404 Error
app.use((req, res, next) => {
  next(createError(404));
});

// Error Handler
app.use(errorHandler);

// Handler
export const handler = serverlessExpress({
  app,
});
