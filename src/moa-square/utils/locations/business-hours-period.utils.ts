import { Logger } from '@nestjs/common';
import { addDays, addMinutes, setHours, setMinutes } from 'date-fns';
import { BusinessHoursPeriodEntity } from '../../entities/business-hours-period.entity';

export class BusinessHoursUtils {
  private static readonly logger = new Logger(BusinessHoursUtils.name);

  static firstPickupDateAfterOrThrow(params: {
    date: Date;
    businessHours: BusinessHoursPeriodEntity[];
    durationMinutes: number;
  }): Date {
    const { date, businessHours, durationMinutes } = params;

    this.logger.verbose(this.firstPickupDateAfterOrThrow.name);

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
      const businessHoursAfterToday = this.firstBusinessHoursFromDate({
        businessHours,
        date: addDays(date, 1),
      });
      const startLocalTimeHours = businessHoursAfterToday?.startLocalTimeHours;
      const startLocalTimeMinutes =
        businessHoursAfterToday?.startLocalTimeMinutes;
      const dayOfWeekNumber = businessHoursAfterToday?.dayOfWeekNumber;

      if (
        startLocalTimeHours == null ||
        startLocalTimeMinutes == null ||
        dayOfWeekNumber == null
      ) {
        throw new Error(
          `No business hours found for ${startLocalTimeHours}:${startLocalTimeMinutes} ${dayOfWeekNumber}`,
        );
      }

      const daysUntilNextBusinessDay =
        (dayOfWeekNumber - date.getDay() + 7) % 7;
      this.logger.debug(
        `daysUntilNextBusinessDay: ${daysUntilNextBusinessDay}`,
      );
      result = addDays(date, daysUntilNextBusinessDay);
      result = setHours(result, startLocalTimeHours);
      result = setMinutes(result, startLocalTimeMinutes);
      result = addMinutes(result, durationMinutes);
    }

    this.logger.verbose(result?.toISOString());
    return result;
  }

  static businessHoursOnDayOfWeek(params: {
    dayOfWeek: number;
    businessHours: BusinessHoursPeriodEntity[];
  }) {
    const { dayOfWeek, businessHours } = params;
    this.logger.verbose(`${this.businessHoursOnDayOfWeek.name} ${dayOfWeek}`);
    const result = businessHours.find(
      (period) => period.dayOfWeekNumber === dayOfWeek,
    );
    this.logger.verbose(result);
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
      this.logger.debug(dayOfWeekNumber);
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
