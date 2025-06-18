import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { LoggerInterceptor } from './logger/logger.interceptor';

// @UseInterceptors(LoggerInterceptor)
@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}
}
