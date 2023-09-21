import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config.type.js';

@Injectable()
export class StripeConfigUtils {
  constructor(private configService: ConfigService<AllConfigType>) {}

  tierForStripePriceId(priceId: string): number | null {
    if (this.isStripePriceIdTier0(priceId)) {
      return 0;
    } else if (this.isStripePriceIdTier1(priceId)) {
      return 1;
    } else if (this.isStripePriceIdTier2(priceId)) {
      return 2;
    } else {
      return null;
    }
  }

  isStripePriceIdTier2(priceId: string) {
    return Object.values(this.stripePriceIdsTier2()).includes(priceId);
  }

  stripePriceIdsTier2() {
    return {
      priceIdTier2USD: this.configService.getOrThrow('stripe.priceIdTier2USD', {
        infer: true,
      }),
      priceIdTier2EUR: this.configService.getOrThrow('stripe.priceIdTier2EUR', {
        infer: true,
      }),
      priceIdTier2GBP: this.configService.getOrThrow('stripe.priceIdTier2GBP', {
        infer: true,
      }),
      priceIdTier2JPY: this.configService.getOrThrow('stripe.priceIdTier2JPY', {
        infer: true,
      }),
      priceIdTier2CAD: this.configService.getOrThrow('stripe.priceIdTier2CAD', {
        infer: true,
      }),
      priceIdTier2AUD: this.configService.getOrThrow('stripe.priceIdTier2AUD', {
        infer: true,
      }),
    };
  }

  isStripePriceIdTier1(priceId: string) {
    return Object.values(this.stripePriceIdsTier1()).includes(priceId);
  }

  stripePriceIdsTier1() {
    return {
      priceIdTier1USD: this.configService.getOrThrow('stripe.priceIdTier1USD', {
        infer: true,
      }),
      priceIdTier1EUR: this.configService.getOrThrow('stripe.priceIdTier1EUR', {
        infer: true,
      }),
      priceIdTier1GBP: this.configService.getOrThrow('stripe.priceIdTier1GBP', {
        infer: true,
      }),
      priceIdTier1JPY: this.configService.getOrThrow('stripe.priceIdTier1JPY', {
        infer: true,
      }),
      priceIdTier1CAD: this.configService.getOrThrow('stripe.priceIdTier1CAD', {
        infer: true,
      }),
      priceIdTier1AUD: this.configService.getOrThrow('stripe.priceIdTier1AUD', {
        infer: true,
      }),
    };
  }

  isStripePriceIdTier0(priceId: string) {
    return Object.values(this.stripePriceIdsTier0()).includes(priceId);
  }

  stripePriceIdsTier0() {
    return {
      priceIdTier0USD: this.configService.getOrThrow('stripe.priceIdTier0USD', {
        infer: true,
      }),
      priceIdTier0EUR: this.configService.getOrThrow('stripe.priceIdTier0EUR', {
        infer: true,
      }),
      priceIdTier0GBP: this.configService.getOrThrow('stripe.priceIdTier0GBP', {
        infer: true,
      }),
      priceIdTier0JPY: this.configService.getOrThrow('stripe.priceIdTier0JPY', {
        infer: true,
      }),
      priceIdTier0CAD: this.configService.getOrThrow('stripe.priceIdTier0CAD', {
        infer: true,
      }),
      priceIdTier0AUD: this.configService.getOrThrow('stripe.priceIdTier0AUD', {
        infer: true,
      }),
    };
  }
}
