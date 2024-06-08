module.exports = {
  order: {
    routes: [
      {
        method: "POST",
        path: "/api/",
        handler: "order.initiatePayment",
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  },
};
