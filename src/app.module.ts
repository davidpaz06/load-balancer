import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProxyController } from './proxy/proxy.controller';
import { Server1Module } from './server1/server1.module';
import { Server2Module } from './server2/server2.module';
import { Server3Module } from './server3/server3.module';

@Module({
  imports: [Server1Module, Server2Module, Server3Module],
  controllers: [AppController, ProxyController],
  providers: [AppService],
})
export class AppModule {}
