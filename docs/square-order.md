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

### If schedule_type is 'SCHEDULED', partner must populate pick_up time and prep_time_duration

> It is scheduled within MyOrderApp Interface, but there is no pick_up time and
> prep_time duration that appears in the API call of the order

I have added prep_time_duration for scheduled orders. Specifically, in my FAQ I
state that all "pickup lead time durations" are by default 15 minutes, and that
this is configurable upon submission of a support ticket. I plan on making this
merchant configurable soon after launch.

## Customers

For items:

- Create customer in partner app creates customer in Square (P1)
- Delete customer in partner app deletes customer in Square
- Update customer in partner app updates customer in Square
- All Partner/Square common customer fields are synced between systems

> Partner is not created in partner app but it is created in Square - made an
> order with a customer ‘Amit Test’ but the customer does not appear in the
> MyOrderApp Interface. Within customers, the list is empty

When you log in as a Seller in the "MyOrderApp for Sellers" dashboard,
it automatically passes your authentication information to the created
application, which in turn automatically creates a MyOrderApp Customer
(which also creates a Square Customer) on the Merchant's behalf.

That is to say that there is a User who is both a Merchant and a Customer.

In the Customer list on MyOrderApp, I exclude the Customer that has the same
User ID as the current Merchant.

In order to test the create/read/update/delete functions of MyOrderApp seperate
from the Merchant, because even if you hit "delete" while on the Seller
dashboard, it will just automatically create a new one, you need to navigate
in a separate browser or browse anonymously. This is because the authentication
information is securely stored in cookies for persistance.

If you test it in a new browser, you should find that you can create a Customer,
perform any operations, and then delete that customer, and as long as you do not
use the same email as the Merchant account, that Customer will be visible on the
Dashboard, and regardless of whether they're the Merchant or not, that Square
is kept up to date on the Customer information.

## Orders

For items:

- Order can move through all states
- If partner is closing Orders in Square, partner must mark Order and Order
  Fulfillment as 'COMPLETE'
- Order fulfillment state pushed as PROPOSED

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

When you tapped the pay button, I marked these DRAFT Orders as CANCELED and
created a new OPEN Order with the final details and posted the payment for that
Order.

The reason I did this was I found that if something goes wrong with updating the
Order, my app and Square can get into a state where the Customer is stuck,
because Orders may only have and be created with one fulfillment object.
However, assuming nothing goes wrong with the UpdateOrder call, this is safe.

All that is to say: **I've changed the behavior to be what I think is more
conventional, try it now.**

### Sync an item with a location price override, correct price must be shown for location chosen in partner platform (P1)

> I set the test item "Croissant" with a location price override of $0.50 for my
> New York location. While the price is updated when selecting 'Check out,' in
> the interface it still shows the old price. Small UI fix to ensure that
> sellers see the correct price per location

If a Merchant updates their Catalog while a Customer has a Draft Order with
an updated object, they will see stale information until they update the Order.
However, given that the price at the time of Order creation is a valid price,
if they do not update the Order and they checkout, they will have the original
price, which I believe is the correct behavior. When they subsequently refresh
their catalog by either pulling down to refresh, selecting a new location, or
otherwise refreshing the application, they will receive the updated catalog.

## Future fixes

For items:

- Refunds in third-party are pushed to Square via Refunds API
- If partner is closing Orders, partner must send corresponding refund to Refunds API to maintain proper reporting

With comment:

> Do not see refund reporting from Square to MyOrderApp - please add an
> indicator of refunds processed in order to maintain proper reporting across
> both platforms

And:

> While MyOrderApp does not allow refunds within the platform, please at minimum
> add in a status indicator of refunds

I kindly request that this do not block passing QA. I am happy to implement refund
awareness in the customer and merchant applications, and I've even started it,
but I do not want to do it hastily and make a mistake.

### Invalid CVV & Invalid expiration date (P2)

> Long loading time then eventually get a 400 error (Our servers couldn't handle that) -
> recommend adjusting this wording to be more user friendly

Similarly, I can commit to having this fixed within a week.
