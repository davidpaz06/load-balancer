import { Module } from '@nestjs/common';
import { Server2Service } from './server2.service';
import { Server2Controller } from './server2.controller';

@Module({
  controllers: [Server2Controller],
  providers: [Server2Service],
})
export class Server2Module {}
