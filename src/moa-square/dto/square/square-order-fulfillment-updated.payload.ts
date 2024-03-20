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

export class SquareOrderFulfillmentUpdatedPayload {
  merchant_id?: string;
  type?: string;
  event_id?: string;
  created_at?: Date;
  data?: SquareOrderFulfillmentUpdatedEventData;
}

class SquareOrderFulfillmentUpdatedEventData {
  type?: string;
  id?: string;
  object?: SquareOrderFulfillmentUpdatedObject;
}

class SquareOrderFulfillmentUpdatedObject {
  order_fulfillment_updated?: OrderFulfillmentUpdated;
}

class OrderFulfillmentUpdated {
  created_at?: Date;
  fulfillment_update?: FulfillmentUpdate[];
  location_id?: string;
  order_id?: string;
  state?: string;
  updated_at?: Date;
  version?: number;
}

/**
 * Enum for tracking the status of a fulfillment.
 */
export enum FulfillmentStatusEnum {
  /** Indicates that the fulfillment has been proposed. */
  proposed = 'PROPOSED',

  /** Indicates that the fulfillment has been reserved. */
  reserved = 'RESERVED',

  /** Indicates that the fulfillment has been prepared. */
  prepared = 'PREPARED',

  /** Indicates that the fulfillment was successfully completed. */
  completed = 'COMPLETED',

  /** Indicates that the fulfillment was canceled. */
  canceled = 'CANCELED',

  /** Indicates that the fulfillment failed to be completed, but was not explicitly canceled. */
  failed = 'FAILED',
}

export function isValidFulfillmentStatus(
  value: string,
): value is FulfillmentStatusEnum {
  return Object.values(FulfillmentStatusEnum).includes(
    value as FulfillmentStatusEnum,
  );
}

class FulfillmentUpdate {
  fulfillment_uid?: string;
  new_state?: string;
  old_state?: string;
}
