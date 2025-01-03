import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  
  @Injectable()
  export class PaginationInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const { page = 1, limit = 2 } = request.query;
  
      request.pagination = {
        page: Number(page),
        limit: Number(limit),
      };
  
      return next.handle();
    }
  }
  