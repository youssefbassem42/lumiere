interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(message: EmailMessage) {
  // SMTP/provider integration belongs behind this boundary. In development the
  // message is logged so order flows remain observable without a mail provider.
  if (!process.env.EMAIL_FROM) {
    console.info("[email:dev]", {
      to: message.to,
      subject: message.subject,
    });
    return;
  }

  console.info("[email:queued]", {
    from: process.env.EMAIL_FROM,
    to: message.to,
    subject: message.subject,
  });
}

export const emailService = {
  async sendOrderConfirmation(params: {
    to: string;
    orderId: string;
    totalAmount: number;
  }) {
    await sendEmail({
      to: params.to,
      subject: `Order ${params.orderId} received`,
      html: `<h1>Order received</h1><p>Your order is pending payment confirmation.</p><p>Total: $${params.totalAmount.toFixed(2)}</p>`,
    });
  },

  async sendPaymentSuccess(params: {
    to: string;
    orderId: string;
    totalAmount: number;
  }) {
    await sendEmail({
      to: params.to,
      subject: `Payment confirmed for order ${params.orderId}`,
      html: `<h1>Payment confirmed</h1><p>We received your payment.</p><p>Total: $${params.totalAmount.toFixed(2)}</p>`,
    });
  },

  async sendShippingUpdate(params: {
    to: string;
    orderId: string;
    status: string;
  }) {
    await sendEmail({
      to: params.to,
      subject: `Order ${params.orderId} is ${params.status.toLowerCase()}`,
      html: `<h1>Shipping update</h1><p>Your order status is now ${params.status}.</p>`,
    });
  },
};
