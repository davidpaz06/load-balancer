import { Controller, Get, Req, Res, UseInterceptors } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request, Response } from 'express';
import { LoggerInterceptor } from '../logger/logger.interceptor';

const servers = [
  'http://localhost:4001',
  'http://localhost:4002',
  'http://localhost:4003',
];

let currentIndex = 0;

@UseInterceptors(LoggerInterceptor)
@Controller('api')
export class ProxyController {
  @Get('*')
  async handleRequest(@Req() req: Request, @Res() res: Response) {
    const target = servers[currentIndex];
    currentIndex = (currentIndex + 1) % servers.length;
    await createProxyMiddleware({ target, changeOrigin: true })(req, res);
  }
}
