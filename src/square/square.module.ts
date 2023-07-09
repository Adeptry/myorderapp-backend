import { Module } from '@nestjs/common';
import { SquareService } from './square.service';

@Module({
  imports: [],
  exports: [SquareService],
  providers: [SquareService],
  controllers: [],
})
export class SquareModule {}
