import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config.type.js';

@Injectable()
export class StripeConfigUtils {
  constructor(private configService: ConfigService<AllConfigType>) {}

  isProStripePriceId(priceId: string) {
    return Object.values(this.stripePriceIdsPro()).includes(priceId);
  }

  stripePriceIdsPro() {
    return {
      priceIdProUSD: this.configService.getOrThrow('stripe.priceIdProUSD', {
        infer: true,
      }),
      priceIdProEUR: this.configService.getOrThrow('stripe.priceIdProEUR', {
        infer: true,
      }),
      priceIdProGBP: this.configService.getOrThrow('stripe.priceIdProGBP', {
        infer: true,
      }),
      priceIdProJPY: this.configService.getOrThrow('stripe.priceIdProJPY', {
        infer: true,
      }),
      priceIdProCAD: this.configService.getOrThrow('stripe.priceIdProCAD', {
        infer: true,
      }),
      priceIdProAUD: this.configService.getOrThrow('stripe.priceIdProAUD', {
        infer: true,
      }),
    };
  }

  isFreeStripePriceId(priceId: string) {
    return Object.values(this.stripePriceIdsFree()).includes(priceId);
  }

  stripePriceIdsFree() {
    return {
      priceIdFreeUSD: this.configService.getOrThrow('stripe.priceIdFreeUSD', {
        infer: true,
      }),
      priceIdFreeEUR: this.configService.getOrThrow('stripe.priceIdFreeEUR', {
        infer: true,
      }),
      priceIdFreeGBP: this.configService.getOrThrow('stripe.priceIdFreeGBP', {
        infer: true,
      }),
      priceIdFreeJPY: this.configService.getOrThrow('stripe.priceIdFreeJPY', {
        infer: true,
      }),
      priceIdFreeCAD: this.configService.getOrThrow('stripe.priceIdFreeCAD', {
        infer: true,
      }),
      priceIdFreeAUD: this.configService.getOrThrow('stripe.priceIdFreeAUD', {
        infer: true,
      }),
    };
  }
}
