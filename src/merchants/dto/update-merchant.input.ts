import { MerchantCreateDto } from './create-merchant.input';

export class MerchantUpdateInput extends MerchantCreateDto {
  stripeId?: string;
  stripeCheckoutSessionId?: string;
}
