import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class HttpError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new HttpError(404, `Not Found - ${req.originalUrl}`);
  next(error);
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error('Error:', {
    statusCode,
    message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.isOperational) {
    res.status(statusCode).json({
      error: message,
      statusCode,
    });
  } else {
    // Don't leak error details in production
    const isDev = process.env.NODE_ENV === 'development';
    res.status(statusCode).json({
      error: isDev ? message : 'Something went wrong',
      statusCode,
      ...(isDev && { stack: err.stack }),
    });
  }
};
