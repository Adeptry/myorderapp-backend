export class SquareOrderFulfillmentUpdatedPayload {
  merchant_id: string;
  type: string;
  event_id: string;
  created_at: Date;
  data: SquareOrderFulfillmentUpdatedEventData;
}

class SquareOrderFulfillmentUpdatedEventData {
  type: string;
  id: string;
  object: SquareOrderFulfillmentUpdatedObject;
}

class SquareOrderFulfillmentUpdatedObject {
  order_fulfillment_updated: OrderFulfillmentUpdated;
}

class OrderFulfillmentUpdated {
  created_at: Date;
  fulfillment_update: FulfillmentUpdate[];
  location_id: string;
  order_id: string;
  state: string;
  updated_at: Date;
  version: number;
}

class FulfillmentUpdate {
  fulfillment_uid: string;
  new_state: string;
  old_state: string;
}
