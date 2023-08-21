import { Controller, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
import { SquareService } from './square.service';

@UseGuards(ApiKeyAuthGuard)
@ApiTags('Square')
@ApiSecurity('Api-Key')
@Controller({
  path: 'square',
  version: '2',
})
export class SquareController {
  constructor(private readonly service: SquareService) {}
}
