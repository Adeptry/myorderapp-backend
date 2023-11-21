# Square QA Notes

## Quick Fixes

### State parameter correctly used for CSRF validation (unguessable value stored in cookie or local storage)

> "<https://squareup.com/oauth2/authorize?client_id=sq0idp-STLnP3X6jb0f8UC47F0wcQ&scope=MERCHANT_PROFILE_READ+CUSTOMERS_WRITE+CUSTOMERS_READ+ORDERS_WRITE+ORDERS_READ+PAYMENTS_READ+PAYMENTS_WRITE+PAYMENTS_WRITE_ADDITIONAL_RECIPIENTS+ITEMS_WRITE+ITEMS_READ&session=true&state=uBSSeXIabud4wRKQzUB0K>
> State parameter should be unique upon every oAuth attempt. I have tried
> multiple times and see the same state parameter state=uBSSeXIabud4wRKQzUB0K"

Careless programming error on my part, I'm sorry about that, it has been
addressed.

### Session parameter set to false

> See above example URL - ensure that the session = false. It should require me
> to sign into my Square account upon every oAuth attempt. After the first
> attempt, it auto-logs me into my Square seller account

Misunderstood requirement and my code, I was using my login system's CSRF token,
now using unique Square CSRF token.

### Selecting 'Deny' on OAuth Permissions shows a user friendly message

> Upon initiating oAuth through 'Account Settings' and selecting Deny, the site
> returns to previous 'synchronizaton' screen and stuck on a loading screen

This did not make it to production in time for you to test, but I have
re-verified it my side, apologies.

### Reconnect partner account with different Square account

> When I connecting the existing account with another Square account, the
> previous location still appeared. Moreover, when adding an item to the cart
> and attempting to check out, I received a 403 error. I only was able to test
> ordering when creating a new account and connecting my Square integration to
> that new account

This was two-fold: (1) some settings were not cleared correctly even on staging;
(2) the changes did not make it to production.

I've re-confirmed and pushed to production.

### Revoke partner app access token from within Square (from the 'App Integrations' section of the dashboard). Partner app / platform must be aware of disconnected state

> Option to 'Deauthorize Square' still is present, indicating that MyOrderApp is
> not aware of the disconnected state

I did not know about this! It's actually a pretty cool endpoint, because it now
allows me to test and re-test oauth and sync, _and_ it allows me to clear up the
many authorizations in Sandbox I now have.

### Allow merchants to revoke access from partner app from the partner application (revoke endpoint must be used)

> When revoking access from MyOrderApp, the integration still appears in my
> seller dashboard under 'App Integrations' - Therefore, when making a new
> account, it skipped the oAuth process.

See comment above - fixed and very cool.

### Partner name + unique transaction ID and/or invoice ID is provided in the note parameter

> Unique transaction ID does not appear in the notes parameter within
> TRANSACTIONS. For example, I created order ID 6IKQAVUJ that shows up in
> MyOrderApp - this order ID is present within 'Orders' in the Order Manager but
> not within 'Transactions.' It would be beneficial to have it appear within
> Transactions as well, since refunds would be processed from the Transactions
> screen

Didn't make it to production in time, my apologies, I have revalidated this now.

## Orders

### Order fulfillment state pushed as PROPOSED & Order can move through all states

> "For two test orders, I made one that was pickup ASAP and another that was to
> be picked up in the future. For the pickup in the future (Using Order ID
> xhl1gcyccCghluD1YVrWsZfyThWZY) I do not see any order fulfillment state on my
> end when viewing the API log (via API Explorer) of the test order created;
> however, for the pick-up ASAP order, (Order ID ZJhS4DfsMDouqiDhh8grz5QId8IZY),
> I do see the fulfillment state as 'PROPOSED' Please validate on your end with
> API Logs
>
> "Order xhl1gcyccCghluD1YVrWsZfyThWZY appears in state 'DRAFT' - what would be
> the reasoning for the order to appear as 'DRAFT' while another appears as
> 'OPEN'?
>
> Orders in the DRAFT state cannot be fulfilled or paid. For example, Square
> products or the Payments API cannot process payments for a DRAFT order. When
> the buyer is ready to make the purchase, the application can call UpdateOrder
> Updates an open order by adding, replacing, or deleting fields. Endpoint to
> set the order state to OPEN so that the order can be fulfilled or payment can
> be processed.

The way MyOrderApp creates orders is by first creating an order in "DRAFT" state
for the purposes of building a cart, quoting from the documentation linked:

> In some application scenarios, such as an eCommerce cart building application,
> buyers add items to the cart only to later abandon the order. In such
> scenarios, applications can create temporary orders by explicitly setting the
> order state to DRAFT in a CreateOrder request.

This was what happened for all three of your orders, specifically with Square
Order IDs:

- R9zdNijix1ezNva63ab8zndRXM7YY
- 1HhiNZC3ZkqCifO5yacO2YBwjH6YY
- tHpvzLtGBxfq6TrPEF16Lh6I4pFZY

When a Customer taps the pay button, I mark these draft orders as cancelled
and open a new order with the final details and post the payment for that order.

First, from the documentation, the reason that I cancel the order instead of deleting it:

> In the current implementation, the Orders API doesn't provide an endpoint to
> delete an order. However, Square reserves the right to delete DRAFT orders
> that haven't been updated in 30 days.

Second, you ask "why have DRAFT orders?" The reason is that Customers can change
information about the order while they're building it. Specifcally, customers can change
the location and fulfillment information. The API does not allow Orders to have
these fields updated.

### If partner is closing Orders in Square, partner must mark Order and Order Fulfillment as 'COMPLETE'

> No Order Fulfillment Line item for one order but appears on another

## If partner is closing Orders, partner must send corresponding refund to Refunds API to maintain proper reporting

> Do not see refund reporting from Square to MyOrderApp - please add an
> indicator of refunds processed in order to maintain proper reporting across
> both platforms

## Sync an item with a location price override, correct price must be shown for location chosen in partner platform

> I set the test item "Croissant" with a location price override of $0.50 for my
> New York location. While the price is updated when selecting 'Check out,' in
> the interface it still shows the old price. Small UI fix to ensure that
> sellers see the correct price per location

## Future fixes

### Refunds in third-party are pushed to Square via Refunds API

> While MyOrderApp does not allow refunds within the platform, please at minimum
> add in a status indicator of refunds
