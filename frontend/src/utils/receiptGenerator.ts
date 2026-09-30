/**
 * Receipt generation is client-side only — jsPDF is not installed and the
 * backend models no receipt/cart endpoints. Kept export shape
 * (`generateReceiptPDF`, `generateHTMLReceipt`, `ReceiptData`) so the
 * checkout caller compiles; the PDF path prints the browser receipt view
 * instead and `*_display` strings from the API are used verbatim — never
 * computed from kobo.
 */

export interface ReceiptItem {
  name: string;
  quantity: number;
  /** Ready `*_display` string from the API (e.g. "₦1,500.00"). */
  priceDisplay: string;
  /** Ready `*_display` string from the API. */
  totalDisplay: string;
}

interface ReceiptData {
  orderNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
    /** Preferred: ready display strings from the API. */
    priceDisplay?: string;
    totalDisplay?: string;
  }>;
  subtotal: number;
  /** Preferred: ready display strings from the API. */
  subtotalDisplay?: string;
  shipping: number;
  shippingDisplay?: string;
  discount: number;
  discountDisplay?: string;
  total: number;
  /** Preferred: ready display string from the API. */
  totalDisplay?: string;
  paymentMethod: string;
  transactionId: string;
  shippingAddress: {
    address_line1?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
  };
}

/** Legacy positional signature kept for the checkout caller. Amounts are
 *  display-only here — the server is the source of truth. */
export const generateReceiptPDF = async (
  _orderId: string,
  orderNumber: string,
  items: Array<{ product?: { title?: string }; title?: string; quantity?: number; price?: number; priceDisplay?: string; totalDisplay?: string }>,
  _total: number,
  _discount: number,
  opts?: { totalDisplay?: string; customerName?: string; customerEmail?: string },
) => {
  const rows = items.map((item) => ({
    name: item.product?.title ?? item.title ?? "Item",
    quantity: item.quantity ?? 1,
    price: item.price ?? 0,
    total: (item.price ?? 0) * (item.quantity ?? 1),
    priceDisplay: item.priceDisplay,
    totalDisplay: item.totalDisplay,
  }));
  const html = generateHTMLReceipt({
    orderNumber,
    date: new Date().toLocaleDateString(),
    customerName: opts?.customerName ?? "Customer",
    customerEmail: opts?.customerEmail ?? "",
    items: rows,
    subtotal: 0,
    shipping: 0,
    discount: 0,
    total: 0,
    totalDisplay: opts?.totalDisplay,
    paymentMethod: "Wallet",
    transactionId: orderNumber,
    shippingAddress: {},
  });
  const win = window.open("", "_blank", "width=700,height=800");
  if (!win) throw new Error("Popup blocked — allow popups to view your receipt.");
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
};

// HTML Receipt for email
export const generateHTMLReceipt = (data: ReceiptData): string => {
  const money = (n: number, display?: string) =>
    display ?? `₦${n.toLocaleString()}`;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .receipt { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #5B2EFF; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>KHUB</h1>
          <p>Order Receipt</p>
        </div>

        <div class="content">
          <p><strong>Order #:</strong> ${data.orderNumber}</p>
          <p><strong>Date:</strong> ${data.date}</p>

          <h3>Order Summary</h3>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${money(item.price, item.priceDisplay)}</td>
                  <td>${money(item.total, item.totalDisplay)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            <p>Subtotal: ${money(data.subtotal, data.subtotalDisplay)}</p>
            <p>Shipping: ${money(data.shipping, data.shippingDisplay)}</p>
            ${data.discount > 0 ? `<p>Discount: -${money(data.discount, data.discountDisplay)}</p>` : ''}
            <p><strong>Total: ${money(data.total, data.totalDisplay)}</strong></p>
          </div>

          <h3>Payment Information</h3>
          <p>Method: ${data.paymentMethod}</p>
          <p>Transaction ID: ${data.transactionId}</p>

          <h3>Shipping Address</h3>
          <p>${data.shippingAddress.address_line1 ?? ''}<br>
          ${data.shippingAddress.city ?? ''}, ${data.shippingAddress.state ?? ''}<br>
          ${data.shippingAddress.country ?? ''}</p>
        </div>

        <div class="footer">
          <p>Thank you for shopping with KHUB!</p>
          <p>Track your order: https://khub.com.ng/orders/${data.orderNumber}</p>
        </div>
      </div>
    </body>
    </html>
  `
}
