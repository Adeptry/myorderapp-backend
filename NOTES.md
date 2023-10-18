stripe listen --forward-to http://localhost:4000/v2/stripe/webhook
https://www.npmjs.com/package/nextjs-google-analytics


if (!payload.merchant_id) {
this.logger.error(
'Missing merchant_id in SquareLocationCreatedEventPayload',
);
return;
}

    const merchant = await this.findOne({
      where: { squareId: payload.merchant_id },
    });
    if (!merchant) {
      this.logger.error(`Merchant with id ${payload.merchant_id} not found`);
      return;
    }

    const app = this.merchantsFirebaseService.firebaseAdminApp({ merchant });
    if (!app) {
      this.logger.error(`Firebase app not found for merchant ${merchant.id}`);
      return;
    }

    const customer = await this.loadOneRelation<CustomerEntity>(
      order,
      'customer',
    );
    if (!customer) {
      this.logger.error(`Customer not found for order ${order.id}`);
      return;
    }

    const appInstalls =
      await this.customersService.loadManyRelation<AppInstall>(
        customer,
        'appInstalls',
      );

    const messaging = this.firebaseAdminService.messaging(app);
    const orderFulfillment = payload?.data?.object?.order_fulfillment_updated;
    const latestUpdate = (orderFulfillment?.fulfillment_update ?? [])[
      (orderFulfillment?.fulfillment_update?.length ?? 0) - 1
    ];
    const body = `Your order with ID ${order.id} has been updated from ${latestUpdate.old_state} to ${latestUpdate.new_state}.`;

    for (const appInstall of appInstalls) {
      if (!appInstall.firebaseCloudMessagingToken) {
        continue;
      }
      await messaging.send({
        token: appInstall.firebaseCloudMessagingToken,
        notification: {
          title: 'Order Update',
          body,
        },
      });
    }

// import { SpelunkerModule } from 'nestjs-spelunker';
// const tree = SpelunkerModule.explore(app);
// const root = SpelunkerModule.graph(tree);
// const edges = SpelunkerModule.findGraphEdges(root);
// console.log('graph LR');
// const mermaidEdges = edges.map(
// ({ from, to }) => `  ${from.module.name}-->${to.module.name}`,
// );
// console.log(mermaidEdges.join('\n'));
