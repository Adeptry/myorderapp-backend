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
