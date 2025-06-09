import { Controller } from '@nestjs/common';
import { Server1Service } from './server1.service';

@Controller('server1')
export class Server1Controller {
  constructor(private readonly server1Service: Server1Service) {}
}
