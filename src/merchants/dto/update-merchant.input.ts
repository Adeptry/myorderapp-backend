import { MoaCreateMerchantInput } from './create-merchant.input';

export class MoaUpdateMerchantInput extends MoaCreateMerchantInput {
  stripeId?: string;

  stripeCheckoutSessionId?: string;
}
