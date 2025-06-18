import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppService } from '../app.service';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly appService: AppService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();

    this.appService.incrementTotalRequests();
    this.appService.incrementConcurrentRequests();

    return next.handle().pipe(
      catchError((error) => {
        this.appService.incrementTotalErrors();
        this.appService.recordError(error);

        return throwError(() => error);
      }),
      map((data: any) => {
        const duration = Date.now() - start;
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        this.appService.decrementConcurrentRequests();

        const computedMetrics = this.appService.computeMetrics(
          data,
          request,
          response,
          duration,
        );
        // console.log('\nLOGGER \nRequest Metrics:', computedMetrics);
        return computedMetrics;
      }),
    );
  }
}
