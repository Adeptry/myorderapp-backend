import { MerchantCreateInput } from './create-merchant.input';

export class MerchantUpdateInput extends MerchantCreateInput {
  stripeId?: string;
  stripeCheckoutSessionId?: string;
}
