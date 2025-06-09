import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { LoggerInterceptor } from './logger/logger.interceptor';

@UseInterceptors(LoggerInterceptor)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<Record<string, unknown>> {
    return this.appService.getHello();
  }

  @Get('multiple')
  async getMultipleResponses(): Promise<Record<string, unknown>[]> {
    return this.appService.getMultipleResponses();
  }

  @Get('pokemon')
  async fetchPokemon(): Promise<Record<string, unknown>> {
    return this.appService.fetchPokemon();
  }
}
