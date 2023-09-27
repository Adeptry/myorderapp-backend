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
