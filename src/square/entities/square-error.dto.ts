import { ApiProperty } from '@nestjs/swagger';

export class SquareError {
  @ApiProperty({
    nullable: true,
    description:
      'Indicates the specific error that occurred during a request to a Square API.',
  })
  category: string;
  @ApiProperty({ nullable: true })
  code: string;
  @ApiProperty({
    nullable: true,
    description:
      'A human-readable description of the error for debugging purposes.',
  })
  detail?: string;

  @ApiProperty({
    nullable: true,
    description:
      'The name of the field provided in the original request (if any) that the error pertains to.',
  })
  field?: string;
}
