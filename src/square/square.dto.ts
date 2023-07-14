import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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
    nullable: true,
    description:
      'Indicates the specific error that occurred during a request to a Square API.',
  })
  category: string;
  @ApiProperty({ nullable: true })
  code: string;
  @ApiProperty({
    nullable: true,
    description:
      'A human-readable description of the error for debugging purposes.',
  })
  detail?: string;

  @ApiProperty({
    nullable: true,
    description:
      'The name of the field provided in the original request (if any) that the error pertains to.',
  })
  field?: string;
}

export class SquareAddress {
  @ApiProperty({ nullable: true })
  @IsString()
  addressLine1?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  addressLine2?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  addressLine3?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  locality?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  sublocality?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  sublocality2?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  sublocality3?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  administrativeDistrictLevel1?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  administrativeDistrictLevel2?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  administrativeDistrictLevel3?: string; // | null;

  @ApiProperty({ nullable: true, example: '94103' })
  @IsString()
  postalCode?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  country?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  firstName?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  lastName?: string; // | null;
}

export class SquareCard {
  @ApiProperty({ nullable: true })
  @IsOptional()
  id?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  cardBrand?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  last4?: string;

  @ApiProperty({ type: String, required: false, example: '0' })
  @Transform(({ value }) => value && BigInt(value), { toClassOnly: true })
  expMonth?: bigint;

  @ApiProperty({ type: String, required: false, example: '0' })
  @Transform(({ value }) => value && BigInt(value), { toClassOnly: true })
  expYear?: bigint;

  @ApiProperty({ nullable: true })
  @IsOptional()
  cardholderName?: string;

  @ApiProperty({ type: () => SquareAddress, nullable: true })
  billingAddress?: SquareAddress;

  customerId?: string;

  merchantId?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  referenceId?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ nullable: true })
  @IsOptional()
  cardType?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  prepaidType?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  bin?: string;

  @ApiProperty({ type: String, required: false })
  @Transform(({ value }) => value && BigInt(value), { toClassOnly: true })
  version?: bigint;

  @ApiProperty({ nullable: true })
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

  @ApiProperty({ nullable: true, default: null })
  @IsOptional()
  verificationToken?: string;

  @ApiProperty({ type: () => SquareCard })
  @IsNotEmpty()
  card: SquareCard;
}

export class SquareDisableCardResponse {
  @ApiProperty({ nullable: true, type: SquareError, isArray: true })
  errors?: SquareError[];

  @ApiProperty({ nullable: true, type: SquareCard })
  card?: SquareCard;
}

export class SquareListCardsResponse {
  @ApiProperty({ type: SquareError, isArray: true, nullable: true })
  errors?: SquareError[];

  @ApiProperty({ nullable: true, type: SquareCard, isArray: true })
  cards?: SquareCard[];

  @ApiProperty({ nullable: true })
  cursor?: string;
}

export class SquareMeasurementUnitCustom {
  @ApiProperty({ nullable: true })
  @IsString()
  name: string;

  @ApiProperty({ nullable: true })
  @IsString()
  abbreviation: string;
}

export class SquareMeasurementUnit {
  @ApiProperty({ type: SquareMeasurementUnitCustom })
  @ValidateNested()
  customUnit?: SquareMeasurementUnitCustom;

  @ApiProperty({ nullable: true })
  @IsString()
  areaUnit?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  lengthUnit?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  volumeUnit?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  weightUnit?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  genericUnit?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  timeUnit?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  type?: string;
}

export class SquareOrderQuantityUnit {
  @ApiProperty({ type: SquareMeasurementUnit })
  @ValidateNested()
  measurementUnit?: SquareMeasurementUnit;

  @ApiProperty({ nullable: true })
  @IsNumber()
  precision?: number; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsNumber()
  catalogVersion?: bigint; // | null;
}

export class SquareMoney {
  @ApiProperty({ nullable: true })
  @IsNumber()
  amount?: bigint; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  currency?: string;
}

export class SquareOrderLineItemModifier {
  @ApiProperty({ nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  quantity?: string; // | null;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  basePriceMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  totalPriceMoney?: SquareMoney;

  @ApiProperty({ nullable: true })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;
}

export class SquareOrderLineItemAppliedTax {
  @ApiProperty({ nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  taxUid: string;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;
}

export class SquareOrderLineItemAppliedDiscount {
  @ApiProperty({ nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  discountUid: string;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;
}

export class SquareOrderLineItemAppliedServiceCharge {
  @ApiProperty({ nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  serviceChargeUid: string;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;
}

export class SquareOrderLineItemPricingBlocklistsBlockedTax {
  @ApiProperty({ nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  taxUid?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  taxCatalogObjectId?: string; // | null;
}

export class SquareOrderLineItemPricingBlocklistsBlockedDiscount {
  @ApiProperty({ nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  discountUid?: string; // | null;

  @ApiProperty({ nullable: true })
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
  @ApiProperty({ nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  quantity: string;

  @ApiProperty({ type: SquareOrderQuantityUnit })
  @ValidateNested()
  quantityUnit?: SquareOrderQuantityUnit;

  @ApiProperty({ nullable: true })
  @IsString()
  note?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  variationName?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  itemType?: string;

  @ApiProperty({ nullable: true })
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
  @ApiProperty({ nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  type?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  percentage?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;

  @ApiProperty({ nullable: true })
  @IsString()
  scope?: string;

  @ApiProperty({ nullable: true })
  @IsBoolean()
  autoApplied?: boolean;
}

export class SquareOrderLineItemDiscount {
  @ApiProperty({ nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  type?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  percentage?: string; // | null;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  amountMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;

  @ApiProperty({ nullable: true })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  scope?: string;

  @ApiProperty({ nullable: true })
  @IsString({ each: true })
  rewardIds?: string[];

  @ApiProperty({ nullable: true })
  @IsString()
  pricingRuleId?: string;
}

export class SquareOrderServiceCharge {
  @ApiProperty({ nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ nullable: true })
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

  @ApiProperty({ nullable: true })
  @IsString()
  calculationPhase?: string;

  @ApiProperty({ nullable: true })
  @IsBoolean()
  taxable?: boolean; // | null;

  @ApiProperty({ type: [SquareOrderLineItemAppliedTax] })
  @ValidateNested({ each: true })
  appliedTaxes?: SquareOrderLineItemAppliedTax[]; // | null;

  @ApiProperty({ nullable: true })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  type?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  treatmentType?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  scope?: string;
}

export class SquareFulfillmentPickupDetailsCurbsidePickupDetails {
  @ApiProperty({ nullable: true })
  @IsString()
  curbsideDetails?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  buyerArrivedAt?: string; // | null;
}

export class SquareFulfillmentFulfillmentEntry {
  @ApiProperty({ nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  lineItemUid: string;

  @ApiProperty({ nullable: true })
  @IsString()
  quantity: string;

  @ApiProperty({ nullable: true })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;
}

export class SquareFulfillmentRecipient {
  @ApiProperty({ nullable: true })
  @IsString()
  customerId?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  displayName?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  emailAddress?: string; // | null;

  @ApiProperty({ nullable: true })
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

  @ApiProperty({ nullable: true })
  @IsString()
  expiresAt?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  autoCompleteDuration?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  scheduleType?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  pickupAt?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  pickupWindowDuration?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  prepTimeDuration?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  note?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  placedAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  acceptedAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  rejectedAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  readyAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  expiredAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  pickedUpAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  canceledAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  cancelReason?: string; // | null;

  @ApiProperty({ nullable: true })
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

  @ApiProperty({ nullable: true })
  @IsString()
  scheduleType?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  placedAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  deliverAt?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  prepTimeDuration?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  deliveryWindowDuration?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  note?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  completedAt?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  inProgressAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  rejectedAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  readyAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  deliveredAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  canceledAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  cancelReason?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  courierPickupAt?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  courierPickupWindowDuration?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsBoolean()
  isNoContactDelivery?: boolean; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  dropoffNotes?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  courierProviderName?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  courierSupportPhoneNumber?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  squareDeliveryId?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  externalDeliveryId?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsBoolean()
  managedDelivery?: boolean; // | null;
}

export class SquareFulfillmentShipmentDetails {
  @ApiProperty({ type: SquareFulfillmentRecipient })
  @ValidateNested()
  recipient?: SquareFulfillmentRecipient;

  @ApiProperty({ nullable: true })
  @IsString()
  carrier?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  shippingNote?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  shippingType?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  trackingNumber?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  trackingUrl?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  placedAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  inProgressAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  packagedAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  expectedShippedAt?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  shippedAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  canceledAt?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  cancelReason?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  failedAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  failureReason?: string; // | null;
}

export class SquareFulfillment {
  @ApiProperty({ nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  type?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  state?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  lineItemApplication?: string;

  @ApiProperty({ type: [SquareFulfillmentFulfillmentEntry] })
  @ValidateNested({ each: true })
  entries?: SquareFulfillmentFulfillmentEntry[];

  @ApiProperty({ nullable: true })
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
  @ApiProperty({ nullable: true })
  @IsBoolean()
  autoApplyDiscounts?: boolean; // | null;

  @ApiProperty({ nullable: true })
  @IsBoolean()
  autoApplyTaxes?: boolean; // | null;
}

export class SquareOrderReward {
  @ApiProperty({ nullable: true })
  @IsString()
  id: string;

  @ApiProperty({ nullable: true })
  @IsString()
  rewardTierId: string;
}

export class SquareOrder {
  @ApiProperty({ nullable: true })
  @IsString()
  id?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  locationId: string;

  @ApiProperty({ nullable: true })
  @IsString()
  referenceId?: string; // | null;

  @ApiProperty({ nullable: true })
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

  @ApiProperty({ nullable: true })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;

  @ApiProperty({ nullable: true })
  @IsString()
  createdAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  updatedAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  closedAt?: string;

  @ApiProperty({ nullable: true })
  @IsString()
  state?: string;

  @ApiProperty({ nullable: true })
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

  @ApiProperty({ nullable: true })
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
