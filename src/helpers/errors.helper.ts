import { FastifyReply } from 'fastify';
import { AxiosError, HttpStatusCode } from 'axios';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const ERRORS = {
  cors: new AppError('Origin not allowed', HttpStatusCode.Forbidden),
  internalServerError: new AppError('Internal Server Error', HttpStatusCode.InternalServerError),
};

export function handleServerError(reply: FastifyReply, error: Error) {
  if (error instanceof ZodError) {
    return reply
      .status(HttpStatusCode.BadRequest)
      .send({ message: 'Validation error', issues: error.format() });
  } else if ('validation' in error) {
    return reply
      .status(HttpStatusCode.BadRequest)
      .send({ message: 'Validation error', issues: error.validation });
  } else if (error.name === 'SyntaxError') {
    return reply
      .status(HttpStatusCode.BadRequest)
      .send({ message: 'Syntax error', issues: error.message });
  } else if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ message: error.message });
  } else if (error instanceof AxiosError) {
    return reply.status(HttpStatusCode.InternalServerError).send({ message: error.message });
  }

  return reply
    .status(ERRORS.internalServerError.statusCode)
    .send(ERRORS.internalServerError.message);
}
