import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('v1/locations')
@ApiTags('locations')
export class LocationsController {}
