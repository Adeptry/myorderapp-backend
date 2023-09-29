import { Logger } from '@nestjs/common';
import { addDays, setHours, setMinutes } from 'date-fns';
import { BusinessHoursPeriodEntity } from '../../entities/locations/business-hours-period.entity';

export class BusinessHoursUtils {
  private static readonly logger = new Logger(BusinessHoursUtils.name);

  static firstPickupDateWithin(params: {
    date: Date;
    businessHours: BusinessHoursPeriodEntity[];
  }): Date | undefined {
    const { date, businessHours } = params;

    this.logger.verbose(this.firstPickupDateWithin.name);

    const firstBusinessHours = this.firstBusinessHoursFromDate({
      businessHours,
      date,
    });

    let result: Date | undefined;

    if (
      firstBusinessHours != undefined &&
      this.dateIsWithinBusinessHours({
        businessHours: firstBusinessHours,
        date,
      })
    ) {
      result = date;
    } else {
      const nextDate = addDays(date, 1);
      const nextBusinessHours = this.firstBusinessHoursFromDate({
        date: nextDate,
        businessHours,
      });
      if (nextBusinessHours == undefined) {
        return undefined;
      }

      const { startLocalTimeMinutes, startLocalTimeHours } = nextBusinessHours;

      if (
        startLocalTimeMinutes == undefined ||
        startLocalTimeHours == undefined
      ) {
        return undefined;
      }

      const setNextDate = setHours(
        setMinutes(nextDate, startLocalTimeMinutes),
        startLocalTimeHours,
      );

      result = setNextDate;
    }

    this.logger.verbose(result.toISOString());
    return result;
  }

  static firstBusinessHoursFromDate(params: {
    businessHours: BusinessHoursPeriodEntity[];
    date: Date;
  }): BusinessHoursPeriodEntity | undefined {
    const { businessHours, date } = params;

    let result: BusinessHoursPeriodEntity | undefined = undefined;

    this.logger.verbose(this.firstBusinessHoursFromDate.name);

    for (let i = 0; i < Math.max(businessHours.length, 7); i++) {
      const dateAfterDays = addDays(date, i);
      const businessHoursPeriod = this.findBusinessHoursOnDate({
        businessHours,
        date: dateAfterDays,
      });
      if (businessHoursPeriod) {
        result = businessHoursPeriod;
        break;
      }
    }

    return result;
  }

  static findBusinessHoursOnDate(params: {
    businessHours: BusinessHoursPeriodEntity[];
    date: Date;
  }): BusinessHoursPeriodEntity | undefined {
    const { businessHours, date } = params;

    this.logger.verbose(this.findBusinessHoursOnDate.name);

    const found = businessHours.find((businessHoursPeriod) => {
      const dayOfWeekNumber = businessHoursPeriod.dayOfWeekNumber;
      if (dayOfWeekNumber != undefined && dayOfWeekNumber === date.getDay()) {
        return businessHoursPeriod;
      } else {
        return undefined;
      }
    });

    this.logger.verbose(found);

    return found;
  }

  static dateIsWithinBusinessHours(params: {
    businessHours: BusinessHoursPeriodEntity;
    date: Date;
  }): boolean {
    const { businessHours, date } = params;
    const {
      parsedEndLocalTimeNumberOfMinutes,
      parsedStartLocalTimeNumberOfMinutes,
    } = businessHours;

    this.logger.verbose(this.dateIsWithinBusinessHours.name);

    if (
      parsedEndLocalTimeNumberOfMinutes == undefined ||
      parsedStartLocalTimeNumberOfMinutes == undefined
    ) {
      return false;
    }

    const dateMinutes = date.getMinutes();
    const dateHours = date.getHours();
    const dateNumberOfMinutes = dateHours * 60 + dateMinutes;
    const result =
      dateNumberOfMinutes >= parsedStartLocalTimeNumberOfMinutes &&
      dateNumberOfMinutes <= parsedEndLocalTimeNumberOfMinutes;

    this.logger.verbose(`dateIsWithinBusinessHours: ${result}`);
    return result;
  }
}
