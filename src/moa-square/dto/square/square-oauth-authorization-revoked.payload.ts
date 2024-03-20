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

/*
{
  "merchant_id": "J9Z30SF99NPFJ",
  "type": "oauth.authorization.revoked",
  "event_id": "e1d6ae37-5aa9-45a5-b525-b12caf819fdb",
  "created_at": "2020-08-14T15:51:04.246373287Z",
  "data": {
    "type": "revocation",
    "id": "415641cf-eba2-4dfa-88cc-c4be1301fdc6",
    "object": {
      "revocation": {
        "revoked_at": "2020-08-14T15:51:00.246373287Z",
        "revoker_type": "MERCHANT"
      }
    }
  }
}
*/

export class SquareOauthAuthorizationRevokedEventPayload {
  merchant_id?: string;

  type?: string;

  event_id?: string;

  created_at?: string;
}
