stripe listen --forward-to http://localhost:4000/v2/stripe/webhook
https://www.npmjs.com/package/nextjs-google-analytics

remote: NPM_CONFIG_LOGLEVEL=error
remote: NODE_VERBOSE=false
remote: NODE_ENV=staging
remote: NODE_MODULES_CACHE=true

```
listLocationsOrThrow(params: { accessToken: string }) {
    this.logger.verbose(this.listLocationsOrThrow.name);
    const { accessToken } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken: accessToken,
      }).locationsApi?.listLocations(),
    );
  }

  retrieveLocationOrThrow(params: {
    accessToken: string;
    locationSquareId: string;
  }) {
    this.logger.verbose(this.retrieveLocationOrThrow.name);
    const { accessToken, locationSquareId } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken: accessToken,
      }).locationsApi.retrieveLocation(locationSquareId),
    );
  }

  createCustomerOrThrow(params: {
    accessToken: string;
    request: CreateCustomerRequest;
  }) {
    this.logger.verbose(this.createCustomerOrThrow.name);
    const { accessToken, request } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken: accessToken,
      }).customersApi.createCustomer(request),
    );
  }

  updateCustomerOrThrow(params: {
    accessToken: string;
    customerId: string;
    body: UpdateCustomerRequest;
  }) {
    this.logger.verbose(this.updateCustomerOrThrow.name);
    const { accessToken, customerId, body } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken: accessToken,
      }).customersApi.updateCustomer(customerId, body),
    );
  }

  retrieveCustomerOrThrow(params: { accessToken: string; squareId: string }) {
    this.logger.verbose(this.retrieveCustomerOrThrow.name);
    const { accessToken, squareId } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken: accessToken,
      }).customersApi.retrieveCustomer(squareId),
    );
  }

  createOrderOrThrow(params: {
    accessToken: string;
    body: CreateOrderRequest;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.createOrderOrThrow.name);
    const { accessToken, body, requestOptions } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken,
      }).ordersApi.createOrder(body, requestOptions),
    );
  }

  retrieveOrderOrThrow(params: {
    accessToken: string;
    orderId: string;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.retrieveOrderOrThrow.name);
    const { accessToken, orderId, requestOptions } = params;
    return this.retryOrThrow(() =>
      this.client({ accessToken }).ordersApi.retrieveOrder(
        orderId,
        requestOptions,
      ),
    );
  }

  updateOrderOrThrow(params: {
    accessToken: string;
    orderId: string;
    body: UpdateOrderRequest;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.updateOrderOrThrow.name);
    const { accessToken, orderId, requestOptions, body } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken,
      }).ordersApi.updateOrder(orderId, body, requestOptions),
    );
  }

  calculateOrderOrThrow(params: {
    accessToken: string;
    body: CalculateOrderRequest;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.calculateOrderOrThrow.name);
    const { accessToken, body, requestOptions } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken,
      }).ordersApi.calculateOrder(body, requestOptions),
    );
  }

  createPaymentOrThrow(params: {
    accessToken: string;
    body: CreatePaymentRequest;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.createPaymentOrThrow.name);
    const { accessToken, body, requestOptions } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken: accessToken,
      }).paymentsApi.createPayment(body, requestOptions),
    );
  }

  listCards(params: {
    accessToken: string;
    cursor?: string;
    customerId?: string;
    includeDisabled?: boolean;
    referenceId?: string;
    sortOrder?: string;
  }) {
    this.logger.verbose(this.listCards.name);
    const {
      accessToken,
      cursor,
      customerId,
      includeDisabled,
      referenceId,
      sortOrder,
    } = params;
    return this.retryOrThrow(() =>
      this.client({ accessToken }).cardsApi.listCards(
        cursor,
        customerId,
        includeDisabled,
        referenceId,
        sortOrder,
      ),
    );
  }

  retrieveCard(params: { accessToken: string; cardId: string }) {
    this.logger.verbose(this.retrieveCard.name);
    return this.retryOrThrow(() =>
      this.client({ accessToken: params.accessToken }).cardsApi.retrieveCard(
        params.cardId,
      ),
    );
  }

  createCard(params: { accessToken: string; body: CreateCardRequest }) {
    this.logger.verbose(this.createCard.name);
    return this.retryOrThrow(() =>
      this.client({ accessToken: params.accessToken }).cardsApi.createCard(
        params.body,
      ),
    );
  }

  disableCard(params: { accessToken: string; cardId: string }) {
    this.logger.verbose(this.disableCard.name);
    return this.retryOrThrow(() =>
      this.client({
        accessToken: params.accessToken,
      }).cardsApi.disableCard(params.cardId),
    );
  }
```

```
  async createCustomer(
    params?: Stripe.CustomerCreateParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Customer> {
    this.logger.verbose(this.createCheckoutSession.name);
    return this.retryOrThrow(() =>
      this.stripe.customers.create(params, options),
    );
  }

  async createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    this.logger.verbose(this.createCheckoutSession.name);
    return this.retryOrThrow(() =>
      this.stripe.checkout.sessions.create(params, options),
    );
  }

  async retrieveCheckoutSession(
    id: string,
    params?: Stripe.Checkout.SessionRetrieveParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    this.logger.verbose(this.retrieveCheckoutSession.name);
    return this.retryOrThrow(() =>
      this.stripe.checkout.sessions.retrieve(id, params, options),
    );
  }

  async createBillingPortalSession(
    params: Stripe.BillingPortal.SessionCreateParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Response<Stripe.BillingPortal.Session>> {
    this.logger.verbose(this.createBillingPortalSession.name);
    return this.retryOrThrow(() =>
      this.stripe.billingPortal.sessions.create(params, options),
    );
  }
```

```
  oauthUrl(params: { scope: string[]; state?: string }) {
    return `${this.configService.getOrThrow('baseUrl', {
      infer: true,
    })}/oauth2/authorize?client_id=${this.configService.getOrThrow(
      'oauthClientId',
      {
        infer: true,
      },
    )}&scope=${params.scope.join('+')}&state=${params.state}`;
  }
```

Merchants
Locations
Customers
Catalogs
Cards

// import { SpelunkerModule } from 'nestjs-spelunker';
// const tree = SpelunkerModule.explore(app);
// const root = SpelunkerModule.graph(tree);
// const edges = SpelunkerModule.findGraphEdges(root);
// console.log('graph LR');
// const mermaidEdges = edges.map(
// ({ from, to }) => `  ${from.module.name}-->${to.module.name}`,
// );
// console.log(mermaidEdges.join('\n'));
