import type { OrderDetailDTO } from "./order.types";

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}

export function generateInvoicePdf(order: OrderDetailDTO): Buffer {
  const lines = [
    "LUMIERE INVOICE",
    `Invoice: ${order.id}`,
    `Date: ${new Date(order.createdAt).toLocaleDateString("en-US")}`,
    `Status: ${order.status}`,
    "",
    "Ship To:",
    order.shippingAddress
      ? `${order.shippingAddress.fullName}, ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.country}`
      : "No shipping address",
    "",
    "Items:",
    ...order.items.map(
      (item) =>
        `${item.productName} x ${item.quantity} - ${money(item.lineTotal, order.currency)}`
    ),
    "",
    `Subtotal: ${money(order.subtotal, order.currency)}`,
    `Tax: ${money(order.taxAmount, order.currency)}`,
    `Shipping: ${money(order.shippingFee, order.currency)}`,
    `Total: ${money(order.totalAmount, order.currency)}`,
  ];

  const text = lines
    .map((line, index) => `BT /F1 12 Tf 50 ${760 - index * 18} Td (${escapePdfText(line)}) Tj ET`)
    .join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf);
}
