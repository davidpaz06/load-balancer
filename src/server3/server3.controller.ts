import { Controller } from '@nestjs/common';
import { Server3Service } from './server3.service';

@Controller('server3')
export class Server3Controller {
  constructor(private readonly server3Service: Server3Service) {}
}
