import {
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaClientKnownRequestError } from 'src/generated/prisma/internal/prismaNamespace';

import { ErrorCode } from 'src/shared/enums';

export type DatabaseError = {
  error: ErrorCode;
  exception: new (message: string) => HttpException;
};

export type ErrorHandler<T extends string> = Record<T, DatabaseError>;

type PrismaErrorCode = 'P2002' | 'P2025' | 'P2003';

const handlers: ErrorHandler<PrismaErrorCode> = {
  P2002: {
    error: ErrorCode.DATABASE_UNIQUE_CONSTRAINT,
    exception: ConflictException,
  },
  P2025: {
    error: ErrorCode.DATABASE_RECORD_NOT_FOUND,
    exception: NotFoundException,
  },
  P2003: {
    error: ErrorCode.DATABASE_FOREIGN_KEY_CONSTRAINT,
    exception: ConflictException,
  },
};

@Catch(PrismaClientKnownRequestError)
export class PrismaFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError) {
    const error = handlers[exception.code as PrismaErrorCode] || {
      error: ErrorCode.DATABASE_ERROR,
      exception: InternalServerErrorException,
    };

    throw new error.exception(error.error);
  }
}
