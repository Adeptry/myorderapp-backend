// {
//     "merchant_id": "6SSW7HV8K2ST5",
//     "type": "refund.created",
//     "event_id": "bc316346-6691-4243-88ed-6d651a0d0c47",
//     "created_at": "2020-02-06T21:27:41.852Z",
//     "data": {
//       "type": "refund",
//       "id": "KkAkhdMsgzn59SM8A89WgKwekxLZY_ptNBVqHYxt5gAdfcobBe4u1AZsXhoz06KTtuq9Ls24P",
//       "object": {
//         "refund": {
//           "id": "KkAkhdMsgzn59SM8A89WgKwekxLZY_ptNBVqHYxt5gAdfcobBe4u1AZsXhoz06KTtuq9Ls24P",
//           "created_at": "2020-02-06T21:27:41.836Z",
//           "updated_at": "2020-02-06T21:27:41.846Z",
//           "amount_money": {
//             "amount": 1000,
//             "currency": "USD"
//           },
//           "status": "PENDING",
//           "location_id": "NAQ1FHV6ZJ8YV",
//           "order_id": "haOyDuHiqtAXMk0d8pDKXpL7Jg4F",
//           "payment_id": "KkAkhdMsgzn59SM8A89WgKwekxLZY",
//           "version": 7
//         }
//       }
//     }
//   }

export class SquareRefundCreatedEventPayload {
  merchant_id?: string;

  type?: string;

  event_id?: string;

  created_at?: string;

  data?: {
    object?: {
      refund?: {
        order_id: string;
      };
    };
  };
}
