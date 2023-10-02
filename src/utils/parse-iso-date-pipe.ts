import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValid } from 'date-fns'; // using date-fns for date validation

@Injectable()
export class ParseISODatePipe implements PipeTransform {
  transform(value: string): Date | undefined {
    if (!value) return undefined;
    const parsedDate = new Date(value);
    if (!isValid(parsedDate)) {
      throw new BadRequestException(`Invalid date from value: ${value}`);
    }
    return parsedDate;
  }
}
