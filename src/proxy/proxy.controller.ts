import {
  All,
  Controller,
  Get,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request, Response } from 'express';
import { LoggerInterceptor } from '../logger/logger.interceptor';
import { AppService } from 'src/app.service';

const servers = [
  'http://localhost:4001',
  'http://localhost:4002',
  'http://localhost:4003',
];

const calculateScore = (metrics: any): number => {
  const latencyScore = 1 - Math.min(metrics.latency / 1000, 1);
  const jitterScore = 1 - Math.min(metrics.jitter / 500, 1);
  const availabilityScore = Math.min(metrics.uptime / 3600, 1);
  const resourceScore =
    1 -
    Math.min(metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal, 1);
  const errorRateScore = 1 - Math.min(metrics.errorRate, 1);
  const concurrencyScore = Math.min(metrics.safeConcurrency / 100, 1);
  const priorityScore = metrics.priority === 'critical' ? 1 : 0.5;

  return (
    0.3 * ((latencyScore + jitterScore + availabilityScore) / 3) +
    0.25 * resourceScore +
    0.2 * errorRateScore +
    0.15 * concurrencyScore +
    0.1 * priorityScore
  );
};

@UseInterceptors(LoggerInterceptor)
@Controller('api')
export class ProxyController {
  constructor(private readonly appService: AppService) {}
  @All('*path')
  async handleRequestScore(@Req() req: Request, @Res() res: Response) {
    console.log('handling score request');

    const scores = await Promise.all(
      servers.map(async (server) => {
        try {
          const metricsRes = await fetch(`${server}/api/metrics`);
          const { metrics } = await metricsRes.json();
          return { server, score: calculateScore(metrics) };
        } catch {
          return { server, score: 0 };
        }
      }),
    );

    const best = scores.reduce((a, b) => (a.score > b.score ? a : b));

    return createProxyMiddleware({ target: best.server, changeOrigin: true })(
      req,
      res,
    );
  }

  @Get()
  async getHello(): Promise<Record<string, unknown>> {
    return this.appService.getHello();
  }

  @Get('error')
  async getErrorResponse(): Promise<Record<string, unknown>> {
    return this.appService.getErrorResponse();
  }

  @Get('multiple')
  async getMultipleResponses(): Promise<Record<string, unknown>[]> {
    return this.appService.getMultipleResponses();
  }
}
