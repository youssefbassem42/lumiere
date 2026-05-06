interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

function renderTemplate(params: {
  preheader: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  const brand = "#0055FF";
  const text = "#0f172a";
  const muted = "#64748b";

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${params.title}</title>
  </head>
  <body style="margin:0;background:#FAF8FF;font-family:Inter,Arial,sans-serif;color:${text};">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${params.preheader}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAF8FF;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 12px;text-align:center;">
                <div style="font-size:28px;font-weight:800;letter-spacing:-0.03em;color:${brand};">Lumière</div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 8px;">
                <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:700;color:${text};">${params.title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px;font-size:15px;line-height:1.7;color:${muted};">
                ${params.body}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <a href="${params.ctaUrl}" style="display:inline-block;background:${brand};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:8px;">${params.ctaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f8fafc;color:#94a3b8;font-size:12px;line-height:1.6;">
                If you did not request this email, you can safely ignore it.<br />
                © ${new Date().getFullYear()} Lumière
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendEmail(message: EmailMessage) {
  if (!process.env.BREVO_API_KEY || !process.env.EMAIL_FROM) {
    console.info("[email:dev]", {
      to: message.to,
      subject: message.subject,
    });
    return;
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Lumière",
        email: process.env.EMAIL_FROM.replace(/^.*<(.+)>$/, "$1"),
      },
      to: [{ email: message.to }],
      subject: message.subject,
      htmlContent: message.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Brevo email failed: ${detail}`);
  }
}

export const emailService = {
  sendEmail,

  async sendVerificationEmail(params: { to: string; name: string | null; verificationUrl: string }) {
    await sendEmail({
      to: params.to,
      subject: "Verify your Lumière account",
      html: renderTemplate({
        preheader: "Confirm your email address to activate your Lumière account.",
        title: "Verify your email",
        body: `<p style="margin:0 0 12px;">Hi ${params.name ?? "there"},</p><p style="margin:0;">Confirm your email address to finish creating your account and start shopping securely.</p>`,
        ctaLabel: "Verify email",
        ctaUrl: params.verificationUrl,
      }),
    });
  },

  async sendPasswordResetEmail(params: { to: string; name: string | null; resetUrl: string }) {
    await sendEmail({
      to: params.to,
      subject: "Reset your Lumière password",
      html: renderTemplate({
        preheader: "Use this secure link within 15 minutes to reset your password.",
        title: "Reset your password",
        body: `<p style="margin:0 0 12px;">Hi ${params.name ?? "there"},</p><p style="margin:0;">We received a request to reset your password. This link expires in 15 minutes.</p>`,
        ctaLabel: "Reset password",
        ctaUrl: params.resetUrl,
      }),
    });
  },

  async sendOrderConfirmation(params: {
    to: string;
    orderId: string;
    totalAmount: number;
  }) {
    await sendEmail({
      to: params.to,
      subject: `Lumière Order Received: #${params.orderId.slice(-8)}`,
      html: renderTemplate({
        preheader: "We've received your order and are getting it ready.",
        title: "Order Confirmed",
        body: `<p style="margin:0 0 12px;">Thank you for shopping with Lumière!</p><p style="margin:0;">We're currently processing your order #${params.orderId.slice(-8)}. Your total is <strong>$${params.totalAmount.toFixed(2)}</strong>.</p>`,
        ctaLabel: "View Order",
        ctaUrl: `${process.env.NEXTAUTH_URL}/orders/${params.orderId}`,
      }),
    });
  },

  async sendPaymentSuccess(params: {
    to: string;
    orderId: string;
    totalAmount: number;
  }) {
    await sendEmail({
      to: params.to,
      subject: `Payment Successful: #${params.orderId.slice(-8)}`,
      html: renderTemplate({
        preheader: "Your payment has been successfully processed.",
        title: "Payment Confirmed",
        body: `<p style="margin:0 0 12px;">We've successfully received your payment of <strong>$${params.totalAmount.toFixed(2)}</strong>.</p><p style="margin:0;">We will notify you again once your order ships.</p>`,
        ctaLabel: "View Order",
        ctaUrl: `${process.env.NEXTAUTH_URL}/orders/${params.orderId}`,
      }),
    });
  },

  async sendShippingUpdate(params: {
    to: string;
    orderId: string;
    status: string;
  }) {
    await sendEmail({
      to: params.to,
      subject: `Order Update: Your package is ${params.status.toLowerCase()}`,
      html: renderTemplate({
        preheader: `Great news! Your order status has been updated to ${params.status}.`,
        title: `Order ${params.status}`,
        body: `<p style="margin:0 0 12px;">Your order #${params.orderId.slice(-8)} is now marked as <strong>${params.status}</strong>.</p><p style="margin:0;">If you have any questions, feel free to reply to this email.</p>`,
        ctaLabel: "Track Order",
        ctaUrl: `${process.env.NEXTAUTH_URL}/orders/${params.orderId}`,
      }),
    });
  },

  async sendSellerNotification(params: {
    to: string;
    orderId: string;
    productName: string;
  }) {
    await sendEmail({
      to: params.to,
      subject: `New Sale: ${params.productName}`,
      html: renderTemplate({
        preheader: "You have a new order to fulfill.",
        title: "You made a sale!",
        body: `<p style="margin:0 0 12px;">Congratulations! Your product <strong>${params.productName}</strong> was just purchased in order #${params.orderId.slice(-8)}.</p><p style="margin:0;">Please check your seller dashboard to fulfill this order.</p>`,
        ctaLabel: "Seller Dashboard",
        ctaUrl: `${process.env.NEXTAUTH_URL}/seller/orders`,
      }),
    });
  },
};
