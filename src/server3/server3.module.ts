import { Module } from '@nestjs/common';
import { Server3Service } from './server3.service';
import { Server3Controller } from './server3.controller';

@Module({
  controllers: [Server3Controller],
  providers: [Server3Service],
})
export class Server3Module {}
