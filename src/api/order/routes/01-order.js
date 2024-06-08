"use strict";

module.exports = {
  routes: [
    {
      method: "POST",
      path: "/orders/initiate-payment",
      handler: "order.initiatePayment",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/orders/payment-callback",
      handler: "order.paymentCallback",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
