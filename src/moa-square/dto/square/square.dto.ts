/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

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
    nullable: true,
    description:
      'Indicates the specific error that occurred during a request to a Square API.',
  })
  category?: string;

  @ApiProperty({ required: false, nullable: true })
  code?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'A human-readable description of the error for debugging purposes.',
  })
  detail?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'The name of the field provided in the original request (if any) that the error pertains to.',
  })
  field?: string;
}

export class SquareAddress {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  addressLine1?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  addressLine2?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  addressLine3?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  locality?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  sublocality?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  sublocality2?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  sublocality3?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  administrativeDistrictLevel1?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  administrativeDistrictLevel2?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  administrativeDistrictLevel3?: string; // | null;

  @ApiProperty({ required: false, example: '94103', nullable: true })
  @IsString()
  postalCode?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  country?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  firstName?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  lastName?: string; // | null;
}

export class SquareCard {
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  id?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  cardBrand?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  last4?: string;

  @ApiProperty({ type: String, required: false, example: '0', nullable: true })
  @Transform(({ value }) => value && BigInt(value), { toClassOnly: true })
  expMonth?: bigint;

  @ApiProperty({ type: String, required: false, example: '0', nullable: true })
  @Transform(({ value }) => value && BigInt(value), { toClassOnly: true })
  expYear?: bigint;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  cardholderName?: string;

  // @ApiProperty({ type: () => SquareAddress, required: false, nullable: true })
  @Exclude({ toPlainOnly: true })
  billingAddress?: SquareAddress;

  customerId?: string;

  merchantId?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  referenceId?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  cardType?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  prepaidType?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  bin?: string;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Transform(({ value }) => value && BigInt(value), { toClassOnly: true })
  version?: bigint;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  cardCoBrand?: string;
}

export class SquareCreateCustomerCardInput {
  @ApiProperty({ example: nanoid() })
  @IsNotEmpty()
  idempotencyKey?: string;

  @ApiProperty({ example: 'cnon:card-nonce-ok' })
  @IsNotEmpty()
  sourceId?: string;

  @ApiProperty({ required: false, default: null, nullable: true })
  @IsOptional()
  verificationToken?: string;

  @ApiProperty({ type: () => SquareCard })
  @IsNotEmpty()
  card?: SquareCard;
}

export class SquareDisableCardResponse {
  @ApiProperty({
    required: false,
    type: SquareError,
    isArray: true,
    nullable: true,
  })
  errors?: SquareError[];

  @ApiProperty({ required: false, type: SquareCard, nullable: true })
  card?: SquareCard;
}

export class SquareListCardsResponse {
  @ApiProperty({
    type: SquareError,
    isArray: true,
    required: false,
    nullable: true,
  })
  errors?: SquareError[];

  @ApiProperty({
    required: false,
    type: SquareCard,
    isArray: true,
    nullable: true,
  })
  cards?: SquareCard[];

  @ApiProperty({ required: false, nullable: true })
  cursor?: string;
}

export class SquareMeasurementUnitCustom {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  name?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  abbreviation?: string;
}

export class SquareMeasurementUnit {
  @ApiProperty({ type: SquareMeasurementUnitCustom })
  @ValidateNested()
  customUnit?: SquareMeasurementUnitCustom;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  areaUnit?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  lengthUnit?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  volumeUnit?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  weightUnit?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  genericUnit?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  timeUnit?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  type?: string;
}

export class SquareOrderQuantityUnit {
  @ApiProperty({ type: SquareMeasurementUnit })
  @ValidateNested()
  measurementUnit?: SquareMeasurementUnit;

  @ApiProperty({ required: false, nullable: true })
  @IsNumber()
  precision?: number; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsNumber()
  catalogVersion?: bigint; // | null;
}

export class SquareMoney {
  @ApiProperty({ required: false, nullable: true })
  @IsNumber()
  amount?: bigint; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  currency?: string;
}

export class SquareOrderLineItemModifier {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  quantity?: string; // | null;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  basePriceMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  totalPriceMoney?: SquareMoney;

  @ApiProperty({ required: false, nullable: true })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;
}

export class SquareOrderLineItemAppliedTax {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  taxUid?: string;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;
}

export class SquareOrderLineItemAppliedDiscount {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  discountUid?: string;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;
}

export class SquareOrderLineItemAppliedServiceCharge {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  serviceChargeUid?: string;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;
}

export class SquareOrderLineItemPricingBlocklistsBlockedTax {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  taxUid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  taxCatalogObjectId?: string; // | null;
}

export class SquareOrderLineItemPricingBlocklistsBlockedDiscount {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  discountUid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
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
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  quantity?: string;

  @ApiProperty({ type: SquareOrderQuantityUnit })
  @ValidateNested()
  quantityUnit?: SquareOrderQuantityUnit;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  note?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  variationName?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  itemType?: string;

  @ApiProperty({ required: false, nullable: true })
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
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  type?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  percentage?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  scope?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsBoolean()
  autoApplied?: boolean;
}

export class SquareOrderLineItemDiscount {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  type?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  percentage?: string; // | null;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  amountMoney?: SquareMoney;

  @ApiProperty({ type: SquareMoney })
  @ValidateNested()
  appliedMoney?: SquareMoney;

  @ApiProperty({ required: false, nullable: true })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  scope?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString({ each: true })
  rewardIds?: string[];

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  pricingRuleId?: string;
}

export class SquareOrderServiceCharge {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  name?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  catalogObjectId?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsNumber()
  catalogVersion?: bigint; // | null;

  @ApiProperty({ required: false, nullable: true })
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

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  calculationPhase?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsBoolean()
  taxable?: boolean; // | null;

  @ApiProperty({ type: [SquareOrderLineItemAppliedTax] })
  @ValidateNested({ each: true })
  appliedTaxes?: SquareOrderLineItemAppliedTax[]; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  type?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  treatmentType?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  scope?: string;
}

export class SquareFulfillmentPickupDetailsCurbsidePickupDetails {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  curbsideDetails?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  buyerArrivedAt?: string; // | null;
}

export class SquareFulfillmentFulfillmentEntry {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  lineItemUid?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  quantity?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;
}

export class SquareFulfillmentRecipient {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  customerId?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  displayName?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  emailAddress?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
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

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  expiresAt?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  autoCompleteDuration?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  scheduleType?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  pickupAt?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  pickupWindowDuration?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  prepTimeDuration?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  note?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  placedAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  acceptedAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  rejectedAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  readyAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  expiredAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  pickedUpAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  canceledAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  cancelReason?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
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

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  scheduleType?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  placedAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  deliverAt?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  prepTimeDuration?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  deliveryWindowDuration?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  note?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  completedAt?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  inProgressAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  rejectedAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  readyAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  deliveredAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  canceledAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  cancelReason?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  courierPickupAt?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  courierPickupWindowDuration?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsBoolean()
  isNoContactDelivery?: boolean; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  dropoffNotes?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  courierProviderName?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  courierSupportPhoneNumber?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  squareDeliveryId?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  externalDeliveryId?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsBoolean()
  managedDelivery?: boolean; // | null;
}

export class SquareFulfillmentShipmentDetails {
  @ApiProperty({ type: SquareFulfillmentRecipient })
  @ValidateNested()
  recipient?: SquareFulfillmentRecipient;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  carrier?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  shippingNote?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  shippingType?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  trackingNumber?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  trackingUrl?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  placedAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  inProgressAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  packagedAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  expectedShippedAt?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  shippedAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  canceledAt?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  cancelReason?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  failedAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  failureReason?: string; // | null;
}

export class SquareFulfillment {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  uid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  type?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  state?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  lineItemApplication?: string;

  @ApiProperty({ type: [SquareFulfillmentFulfillmentEntry] })
  @ValidateNested({ each: true })
  entries?: SquareFulfillmentFulfillmentEntry[];

  @ApiProperty({ required: false, nullable: true })
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
  @ApiProperty({ required: false, nullable: true })
  @IsBoolean()
  autoApplyDiscounts?: boolean; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsBoolean()
  autoApplyTaxes?: boolean; // | null;
}

export class SquareOrderReward {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  id?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  rewardTierId?: string;
}

export class SquareOrder {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  id?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  locationId?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  referenceId?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
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

  @ApiProperty({ required: false, nullable: true })
  @IsNotEmpty()
  metadata?: Record<string, string>; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  createdAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  updatedAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  closedAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  state?: string;

  @ApiProperty({ required: false, nullable: true })
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

  @ApiProperty({ required: false, nullable: true })
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
