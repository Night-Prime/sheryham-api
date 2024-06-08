// @ts-nocheck
"use strict";
const axios = require("axios");

/**
 * order controller
 */

const public_key = process.env.PUBLIC_KEY;
const secret_key = process.env.SECRET_KEY;
const encrypted = process.env.ENCRYPTION;

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async initiatePayment(ctx) {
    try {
      const {
        tx_ref,
        amount,
        currency,
        redirect_url,
        meta,
        customer,
        product,
      } = ctx.request.body;

      if (!tx_ref || !amount || !customer || !product) {
        return ctx.badRequest("Missing required fields");
      }

      const data = {
        tx_ref: tx_ref,
        amount: amount,
        currency: currency || "NGN",
        meta: meta,
        customer: customer,
        products: product,
        status: "pending",
      };

      // Save payment details to Strapi
      const savedPayment = await strapi.entityService.create(
        "api::order.order",
        { data }
      );

      const response = await axios.post(
        "https://api.flutterwave.com/v3/payments",
        {
          tx_ref: tx_ref,
          amount: amount,
          currency: "NGN",
          redirect_url: redirect_url,
          meta: meta,
          customer: customer,
          products: product,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SECRET_KEY}`,
          },
        }
      );

      ctx.send(response.data);
    } catch (err) {
      console.log(err.code);
      if (err.response) {
        console.log("Error", err.response.data);
        ctx.send({ error: err.response.data }, err.response.status);
      } else {
        console.log("Error", err.message);
        ctx.send({ error: err.message }, 500);
      }
    }
  },

  async paymentCallback(ctx) {
    console.log("Triggered!)");
    try {
      const { status, tx_ref, transaction_id } = ctx.query;

      if (status !== "successful") {
        return ctx.badRequest("Payment not successful");
      }

      // Retrieve the payment using tx_ref
      const [payment] = await strapi.entityService.findOne("api::order.order", {
        filters: { tx_ref },
      });

      if (!payment) {
        return ctx.notFound("Payment not found");
      }

      const response = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.SECRET_KEY}`,
          },
        }
      );

      const data = response.data.data;

      if (data.status === "successful") {
        // Update the payment status in Strapi
        await strapi.entityService.update("api::order.order", payment.id, {
          data: {
            status: data.status,
          },
        });

        // Success! Redirect to the frontend payment confirmation page
        return ctx.redirect(
          `${process.env.TEST_FRONTEND}/payment?status=successful&tx_ref=${tx_ref}&transaction_id=${transaction_id}`
        );
      } else {
        // Inform the customer their payment was unsuccessful
        return ctx.send({ message: "Payment verification failed" });
      }
    } catch (err) {
      console.log(err.code);
      if (err.response) {
        console.log(err.response.data);
        ctx.send({ error: err.response.data }, err.response.status);
      } else {
        console.log(err.message);
        ctx.send({ error: err.message }, 500);
      }
    }
  },
}));
