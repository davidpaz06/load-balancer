import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProxyController } from './proxy/proxy.controller';

@Module({
  imports: [],
  controllers: [ProxyController],
  providers: [AppService],
})
export class AppModule {}
