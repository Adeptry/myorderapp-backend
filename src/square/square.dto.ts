import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { nanoid } from 'nanoid';

export class SquareError {
  @ApiProperty({
    required: false,
    description:
      'Indicates the specific error that occurred during a request to a Square API.',
  })
  category: string;
  @ApiProperty({ required: false })
  code: string;
  @ApiProperty({
    required: false,
    description:
      'A human-readable description of the error for debugging purposes.',
  })
  detail?: string;

  @ApiProperty({
    required: false,
    description:
      'The name of the field provided in the original request (if any) that the error pertains to.',
  })
  field?: string;
}

export class SquareAddress {
  @ApiProperty({ required: false })
  @IsString()
  addressLine1?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  addressLine2?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  addressLine3?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  locality?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  sublocality?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  sublocality2?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  sublocality3?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  administrativeDistrictLevel1?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  administrativeDistrictLevel2?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  administrativeDistrictLevel3?: string; // | null;

  @ApiProperty({ required: false, example: '94103' })
  @IsString()
  postalCode?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  country?: string;

  @ApiProperty({ required: false })
  @IsString()
  firstName?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  lastName?: string; // | null;
}

export class SquareCard {
  @ApiProperty({ required: false })
  @IsOptional()
  id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  cardBrand?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  last4?: string;

  @ApiProperty({ type: String, required: false, example: '0' })
  @Transform(({ value }) => value && BigInt(value), { toClassOnly: true })
  expMonth?: bigint;

  @ApiProperty({ type: String, required: false, example: '0' })
  @Transform(({ value }) => value && BigInt(value), { toClassOnly: true })
  expYear?: bigint;

  @ApiProperty({ required: false })
  @IsOptional()
  cardholderName?: string;

  // @ApiProperty({ type: () => SquareAddress, required: false })
  @Exclude({ toPlainOnly: true })
  billingAddress?: SquareAddress;

  customerId?: string;

  merchantId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  referenceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  cardType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  prepaidType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  bin?: string;

  @ApiProperty({ type: String, required: false })
  @Transform(({ value }) => value && BigInt(value), { toClassOnly: true })
  version?: bigint;

  @ApiProperty({ required: false })
  @IsOptional()
  cardCoBrand?: string;
}

export class SquareCreateCustomerCardInput {
  @ApiProperty({ example: nanoid() })
  @IsNotEmpty()
  idempotencyKey: string;

  @ApiProperty({ example: 'cnon:card-nonce-ok' })
  @IsNotEmpty()
  sourceId: string;

  @ApiProperty({ required: false, default: null })
  @IsOptional()
  verificationToken?: string;

  @ApiProperty({ type: () => SquareCard })
  @IsNotEmpty()
  card: SquareCard;
}

export class SquareDisableCardResponse {
  @ApiProperty({ required: false, type: SquareError, isArray: true })
  errors?: SquareError[];

  @ApiProperty({ required: false, type: SquareCard })
  card?: SquareCard;
}

export class SquareListCardsResponse {
  @ApiProperty({ type: SquareError, isArray: true, required: false })
  errors?: SquareError[];

  @ApiProperty({ required: false, type: SquareCard, isArray: true })
  cards?: SquareCard[];

  @ApiProperty({ required: false })
  cursor?: string;
}

export class SquareMeasurementUnitCustom {
  @ApiProperty({ required: false })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  abbreviation: string;
}

export class SquareMeasurementUnit {
  @ApiProperty({ type: SquareMeasurementUnitCustom })
  @ValidateNested()
  customUnit?: SquareMeasurementUnitCustom;

  @ApiProperty({ required: false })
  @IsString()
  areaUnit?: string;

  @ApiProperty({ required: false })
  @IsString()
  lengthUnit?: string;

  @ApiProperty({ required: false })
  @IsString()
  volumeUnit?: string;

  @ApiProperty({ required: false })
  @IsString()
  weightUnit?: string;

  @ApiProperty({ required: false })
  @IsString()
  genericUnit?: string;

  @ApiProperty({ required: false })
  @IsString()
  timeUnit?: string;

  @ApiProperty({ required: false })
  @IsString()
  type?: string;
}

export class SquareOrderQuantityUnit {
  @ApiProperty({ type: SquareMeasurementUnit })
  @ValidateNested()
  measurementUnit?: SquareMeasurementUnit;

  @ApiProperty({ required: false })
  @IsNumber()
  precision?: number; // | null;

  @ApiProperty({ required: false })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ required: false })
  @IsNumber()
  catalogVersion?: bigint; // | null;
}

export class SquareMoney {
  @ApiProperty({ required: false })
  @IsNumber()
  amount?: bigint; // | null;

  @ApiProperty({ required: false })
  @IsString()
  currency?: string;
}

export class SquareOrderLineItemModifier {
  @ApiProperty({ required: false })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ required: false })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ required: false })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  quantity?: string; // | null;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  basePriceMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  totalPriceMoney?: SquareMoney;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;
}

export class SquareOrderLineItemAppliedTax {
  @ApiProperty({ required: false })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  taxUid: string;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;
}

export class SquareOrderLineItemAppliedDiscount {
  @ApiProperty({ required: false })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  discountUid: string;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;
}

export class SquareOrderLineItemAppliedServiceCharge {
  @ApiProperty({ required: false })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  serviceChargeUid: string;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;
}

export class SquareOrderLineItemPricingBlocklistsBlockedTax {
  @ApiProperty({ required: false })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  taxUid?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  taxCatalogObjectId?: string; // | null;
}

export class SquareOrderLineItemPricingBlocklistsBlockedDiscount {
  @ApiProperty({ required: false })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  discountUid?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  discountCatalogObjectId?: string; // | null;
}

export class SquareOrderLineItemPricingBlocklists {
  @ApiProperty({ type: [SquareOrderLineItemPricingBlocklistsBlockedDiscount] })
  @ValidateNested({ each: true })
  blockedDiscounts?: SquareOrderLineItemPricingBlocklistsBlockedDiscount[]; // | null;

  @ApiProperty({ type: [SquareOrderLineItemPricingBlocklistsBlockedTax] })
  @ValidateNested({ each: true })
  blockedTaxes?: SquareOrderLineItemPricingBlocklistsBlockedTax[]; // | null;
}

export class SquareOrderLineItem {
  @ApiProperty({ required: false })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  quantity: string;

  @ApiProperty({ type: SquareOrderQuantityUnit })
  @ValidateNested()
  quantityUnit?: SquareOrderQuantityUnit;

  @ApiProperty({ required: false })
  @IsString()
  note?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ required: false })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ required: false })
  @IsString()
  variationName?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  itemType?: string;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;

  @ApiProperty({ type: [SquareOrderLineItemModifier] })
  @ValidateNested({ each: true })
  modifiers?: SquareOrderLineItemModifier[]; // | null;

  @ApiProperty({ type: [SquareOrderLineItemAppliedTax] })
  @ValidateNested({ each: true })
  appliedTaxes?: SquareOrderLineItemAppliedTax[]; // | null;

  @ApiProperty({ type: [SquareOrderLineItemAppliedDiscount] })
  @ValidateNested({ each: true })
  appliedDiscounts?: SquareOrderLineItemAppliedDiscount[]; // | null;

  @ApiProperty({ type: [SquareOrderLineItemAppliedServiceCharge] })
  @ValidateNested({ each: true })
  appliedServiceCharges?: SquareOrderLineItemAppliedServiceCharge[]; // | null;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  basePriceMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  variationTotalPriceMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  grossSalesMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  totalTaxMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  totalDiscountMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  totalMoney?: SquareMoney;

  @ApiProperty({ type: SquareOrderLineItemPricingBlocklists })
  @ValidateNested()
  pricingBlocklists?: SquareOrderLineItemPricingBlocklists;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  totalServiceChargeMoney?: SquareMoney;
}

export class SquareOrderLineItemTax {
  @ApiProperty({ required: false })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ required: false })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ required: false })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsString()
  percentage?: string; // | null;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;

  @ApiProperty({ required: false })
  @IsString()
  scope?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  autoApplied?: boolean;
}

export class SquareOrderLineItemDiscount {
  @ApiProperty({ required: false })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ required: false })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ required: false })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsString()
  percentage?: string; // | null;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  amountMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;

  @ApiProperty({ required: false })
  @IsString()
  scope?: string;

  @ApiProperty({ required: false })
  @IsString({ each: true })
  rewardIds?: string[];

  @ApiProperty({ required: false })
  @IsString()
  pricingRuleId?: string;
}

export class SquareOrderServiceCharge {
  @ApiProperty({ required: false })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ required: false })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ required: false })
  @IsString()
  percentage?: string; // | null;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  amountMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  totalMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  totalTaxMoney?: SquareMoney;

  @ApiProperty({ required: false })
  @IsString()
  calculationPhase?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  taxable?: boolean; // | null;

  @ApiProperty({ type: [SquareOrderLineItemAppliedTax] })
  @ValidateNested({ each: true })
  appliedTaxes?: SquareOrderLineItemAppliedTax[]; // | null;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;

  @ApiProperty({ required: false })
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsString()
  treatmentType?: string;

  @ApiProperty({ required: false })
  @IsString()
  scope?: string;
}

export class SquareFulfillmentPickupDetailsCurbsidePickupDetails {
  @ApiProperty({ required: false })
  @IsString()
  curbsideDetails?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  buyerArrivedAt?: string; // | null;
}

export class SquareFulfillmentFulfillmentEntry {
  @ApiProperty({ required: false })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  lineItemUid: string;

  @ApiProperty({ required: false })
  @IsString()
  quantity: string;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;
}

export class SquareFulfillmentRecipient {
  @ApiProperty({ required: false })
  @IsString()
  customerId?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  displayName?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  emailAddress?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  phoneNumber?: string; // | null;

  @ApiProperty({ type: SquareAddress })
  @ValidateNested()
  address?: SquareAddress;
}

export class SquareFulfillmentPickupDetails {
  @ApiProperty({ type: SquareFulfillmentRecipient })
  @ValidateNested()
  recipient?: SquareFulfillmentRecipient;

  @ApiProperty({ required: false })
  @IsString()
  expiresAt?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  autoCompleteDuration?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  scheduleType?: string;

  @ApiProperty({ required: false })
  @IsString()
  pickupAt?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  pickupWindowDuration?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  prepTimeDuration?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  note?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  placedAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  acceptedAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  rejectedAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  readyAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  expiredAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  pickedUpAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  canceledAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  cancelReason?: string; // | null;

  @ApiProperty({ required: false })
  @IsBoolean()
  isCurbsidePickup?: boolean; // | null;

  @ApiProperty({ type: SquareFulfillmentPickupDetailsCurbsidePickupDetails })
  @ValidateNested()
  curbsidePickupDetails?: SquareFulfillmentPickupDetailsCurbsidePickupDetails;
}

export class SquareFulfillmentDeliveryDetails {
  @ApiProperty({ type: SquareFulfillmentRecipient })
  @ValidateNested()
  recipient?: SquareFulfillmentRecipient;

  @ApiProperty({ required: false })
  @IsString()
  scheduleType?: string;

  @ApiProperty({ required: false })
  @IsString()
  placedAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  deliverAt?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  prepTimeDuration?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  deliveryWindowDuration?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  note?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  completedAt?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  inProgressAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  rejectedAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  readyAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  deliveredAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  canceledAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  cancelReason?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  courierPickupAt?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  courierPickupWindowDuration?: string; // | null;

  @ApiProperty({ required: false })
  @IsBoolean()
  isNoContactDelivery?: boolean; // | null;

  @ApiProperty({ required: false })
  @IsString()
  dropoffNotes?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  courierProviderName?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  courierSupportPhoneNumber?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  squareDeliveryId?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  externalDeliveryId?: string; // | null;

  @ApiProperty({ required: false })
  @IsBoolean()
  managedDelivery?: boolean; // | null;
}

export class SquareFulfillmentShipmentDetails {
  @ApiProperty({ type: SquareFulfillmentRecipient })
  @ValidateNested()
  recipient?: SquareFulfillmentRecipient;

  @ApiProperty({ required: false })
  @IsString()
  carrier?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  shippingNote?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  shippingType?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  trackingNumber?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  trackingUrl?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  placedAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  inProgressAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  packagedAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  expectedShippedAt?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  shippedAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  canceledAt?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  cancelReason?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  failedAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  failureReason?: string; // | null;
}

export class SquareFulfillment {
  @ApiProperty({ required: false })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsString()
  state?: string;

  @ApiProperty({ required: false })
  @IsString()
  lineItemApplication?: string;

  @ApiProperty({ type: [SquareFulfillmentFulfillmentEntry] })
  @ValidateNested({ each: true })
  entries?: SquareFulfillmentFulfillmentEntry[];

  @ApiProperty({ required: false })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;

  @ApiProperty({ type: SquareFulfillmentPickupDetails })
  @ValidateNested()
  pickupDetails?: SquareFulfillmentPickupDetails;

  @ApiProperty({ type: SquareFulfillmentShipmentDetails })
  @ValidateNested()
  shipmentDetails?: SquareFulfillmentShipmentDetails;

  @ApiProperty({ type: SquareFulfillmentDeliveryDetails })
  @ValidateNested()
  deliveryDetails?: SquareFulfillmentDeliveryDetails;
}

export class SquareOrderPricingOptions {
  @ApiProperty({ required: false })
  @IsBoolean()
  autoApplyDiscounts?: boolean; // | null;

  @ApiProperty({ required: false })
  @IsBoolean()
  autoApplyTaxes?: boolean; // | null;
}

export class SquareOrderReward {
  @ApiProperty({ required: false })
  @IsString()
  id: string;

  @ApiProperty({ required: false })
  @IsString()
  rewardTierId: string;
}

export class SquareOrder {
  @ApiProperty({ required: false })
  @IsString()
  id?: string;

  @ApiProperty({ required: false })
  @IsString()
  locationId: string;

  @ApiProperty({ required: false })
  @IsString()
  referenceId?: string; // | null;

  @ApiProperty({ required: false })
  @IsString()
  customerId?: string; // | null;

  @ApiProperty({ type: [SquareOrderLineItem] })
  @ValidateNested({ each: true })
  lineItems?: SquareOrderLineItem[]; // | null;

  @ApiProperty({ type: [SquareOrderLineItemTax] })
  @ValidateNested({ each: true })
  taxes?: SquareOrderLineItemTax[]; // | null;

  @ApiProperty({ type: [SquareOrderLineItemDiscount] })
  @ValidateNested({ each: true })
  discounts?: SquareOrderLineItemDiscount[]; // | null;

  @ApiProperty({ type: [SquareOrderServiceCharge] })
  @ValidateNested({ each: true })
  serviceCharges?: SquareOrderServiceCharge[]; // | null;

  @ApiProperty({ type: [SquareFulfillment] })
  @ValidateNested({ each: true })
  fulfillments?: SquareFulfillment[]; // | null;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;

  @ApiProperty({ required: false })
  @IsString()
  createdAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  updatedAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  closedAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  state?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  version?: number;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  totalMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  totalTaxMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  totalDiscountMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  totalTipMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  totalServiceChargeMoney?: SquareMoney;

  @ApiProperty({ required: false })
  @IsString()
  ticketName?: string; // | null;

  @ApiProperty({ type: SquareOrderPricingOptions })
  @ValidateNested()
  pricingOptions?: SquareOrderPricingOptions;

  @ApiProperty({ type: [SquareOrderReward] })
  @ValidateNested({ each: true })
  rewards?: SquareOrderReward[];

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  netAmountDueMoney?: SquareMoney;
}
