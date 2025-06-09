import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { formatBytes } from 'src/helpers/formatBytes';
import { calculateJitter } from 'src/helpers/calculateJitter';
import { calculateBandwidth } from 'src/helpers/calculateBandwidth';

import { Request, Response } from 'express';
import { catchError, map, Observable, throwError } from 'rxjs';
import * as os from 'os';

const LATENCY_HISTORY_SIZE = 20;
const RECENT_ERRORS_SIZE = 10;
const latencyHistory: number[] = [];
const recentErrors: string[] = [];
let concurrentRequests = 0;
let totalRequests = 0;
let totalErrors = 0;

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Record<string, unknown>> {
    const start = Date.now();

    totalRequests++;
    concurrentRequests++;

    return next.handle().pipe(
      catchError((error) => {
        totalErrors++;
        recentErrors.push(
          JSON.stringify({
            message: error.message,
            timestamp: new Date().toISOString(),
          }),
        );
        if (recentErrors.length > RECENT_ERRORS_SIZE) {
          recentErrors.shift();
        }
        return throwError(() => error);
      }),
      map((data: Record<string, unknown>) => {
        const duration = Date.now() - start;
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        concurrentRequests--;

        // Calculate jitter
        latencyHistory.push(duration);
        if (latencyHistory.length > LATENCY_HISTORY_SIZE) {
          latencyHistory.shift();
        }
        const jitterResult = calculateJitter(latencyHistory);

        // Calculate bandwidth (KB/s)
        const responseSizeBytes = Buffer.byteLength(
          JSON.stringify(data),
          'utf8',
        );
        const bandwidthResult = calculateBandwidth(responseSizeBytes, duration);

        const metrics = {
          // Response capability 30%
          latency: `${duration}ms`,
          jitter: jitterResult,
          uptime: process.uptime(),

          // Usage 20%
          memoryUsage: process.memoryUsage(),
          cpu: process.cpuUsage(),
          cpus: os.cpus().length,
          bandwidth: bandwidthResult,

          // Health 15%
          totalErrors,
          recentErrors,
          errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,

          hostname: os.hostname(),
          freememory: formatBytes(os.freemem()),
          totalmemory: formatBytes(os.totalmem()),

          concurrentRequests,
          totalRequests,
        };
        console.log('\nLOGGER \nRequest Metrics:', metrics);
        return {
          timestamp: new Date().toISOString(),
          url: request.url,
          method: request.method,
          statusCode: response.statusCode,
          data: data,
          metrics,
        };
      }),
    );
  }
}
