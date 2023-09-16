import { MerchantCreateDto } from './create-merchant.input.js';

export class MerchantUpdateInput extends MerchantCreateDto {
  stripeId?: string;
  stripeCheckoutSessionId?: string;
}
