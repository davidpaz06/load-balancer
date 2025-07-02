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
  // 'http://localhost:4003',
];

const calculateScore = (metrics: any): number => {
  console.log('Calculating score with metrics... \n');
  const latencyScore = 1 - Math.min(parseMetric(metrics.latency) / 1000, 1);
  console.log('latencyScore: ', latencyScore);
  const jitterScore = 1 - Math.min(parseMetric(metrics.jitter) / 500, 1);
  console.log('jitterScore: ', jitterScore);
  const availabilityScore = Math.min(parseMetric(metrics.uptime) / 3600, 1);
  console.log('availabilityScore: ', availabilityScore);
  const resourceScore =
    1 -
    Math.min(metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal, 1);
  console.log('resourceScore: ', resourceScore);
  const errorRateScore = 1 - Math.min(metrics.errorRate, 1);
  console.log('errorRateScore: ', errorRateScore);
  const concurrencyScore = Math.min(metrics.safeConcurrency / 100, 1);
  console.log('concurrencyScore: ', concurrencyScore);
  const priorityScore = metrics.priority === 'critical' ? 1 : 0.5;
  console.log('priorityScore: ', priorityScore);

  const total =
    0.3 * ((latencyScore + jitterScore + availabilityScore) / 3) +
    0.25 * resourceScore +
    0.2 * errorRateScore +
    0.15 * concurrencyScore +
    0.1 * priorityScore;

  console.log('Total score:', total);

  return total;
};

const parseMetric = (value: any) => {
  if (typeof value === 'string' && value.endsWith('ms')) {
    return parseFloat(value.replace('ms', ''));
  }
  return value;
};

@UseInterceptors(LoggerInterceptor)
@Controller('proxy')
export class ProxyController {
  constructor(private readonly appService: AppService) {}
  @All('*path')
  async handleRequestScore(@Req() req: Request, @Res() res: Response) {
    const scores = await Promise.all(
      servers.map(async (server) => {
        try {
          const metricsRes = await fetch(
            `${server}/api${req.url.replace(/^\/proxy/, '')}`,
          );
          const { metrics } = await metricsRes.json();
          console.log('server and metrics: ', {
            server,
            metrics,
          });
          return { server, score: calculateScore(metrics) };
        } catch {
          return { server, score: 0 };
        }
      }),
    );

    const best = scores.reduce((a, b) => (a.score > b.score ? a : b));

    const url = `${best.server}/api${req.url.replace(/^\/proxy/, '')}`;
    const backendRes = await fetch(url, { method: req.method });
    const data = await backendRes.json();
    console.log('backendRes: ', data);

    const score = data.metrics ? calculateScore(data.metrics) : 0;

    res.status(backendRes.status).json({
      ...data,
      proxy: {
        backend: best.server,
        scorecore: `${Number(score.toFixed(2)) * 100}pts.`,
      },
    });
  }
}
