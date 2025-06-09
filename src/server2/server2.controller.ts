import { Controller } from '@nestjs/common';
import { Server2Service } from './server2.service';

@Controller('server2')
export class Server2Controller {
  constructor(private readonly server2Service: Server2Service) {}
}
