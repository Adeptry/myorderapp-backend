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
