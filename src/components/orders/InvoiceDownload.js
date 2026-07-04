/**
 * Helper utility to dynamically load scripts (for html2pdf.js library loading)
 */
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

/**
 * Invoice Downloader Utility
 * Generates a clean, print-styled HTML invoice card and downloads it directly as a PDF file
 */
export const downloadInvoice = async (order) => {
  // Load html2pdf CDN script if not already present in document header
  try {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
  } catch (err) {
    console.error(err);
    alert("Could not load PDF library. Please check your internet connection.");
    return;
  }

  const rupee = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // HTML Invoice Card using robust inline styles for exact PDF rendering
  const invoiceHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; background-color: #ffffff; width: 680px; margin: 0 auto; box-sizing: border-box;">
      <!-- Header row -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border-bottom: 2px solid #f3f4f6; padding-bottom: 24px;">
        <tr>
          <td style="vertical-align: top; padding: 0;">
            <div style="font-size: 22px; font-weight: 800; color: #78350f; letter-spacing: -0.025em; font-family: sans-serif;">Namma Oor Karuvattu Kadai</div>
            <div style="font-size: 12px; color: #6b7280;">Delicious & Traditional Dried Fish Specialties</div>
          </td>
          <td style="vertical-align: top; text-align: right; padding: 0;">
            <div style="font-size: 20px; font-weight: 800; color: #111827; font-family: sans-serif; margin-bottom: 4px;">INVOICE</div>
            <div style="font-size: 12px; color: #4b5563;">Order: #${order.id.slice(0, 8).toUpperCase()}</div>
            <div style="font-size: 12px; color: #4b5563; margin-top: 2px;">Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}</div>
          </td>
        </tr>
      </table>

      <!-- Billing info -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <tr>
          <td style="vertical-align: top; width: 50%; padding: 0;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 8px;">Billed To</div>
            <div style="font-size: 13px; color: #374151; line-height: 1.6;">
              <strong>${order.customerName || "Customer"}</strong><br/>
              Phone: ${order.customerPhone || "N/A"}<br/>
              ${order.address?.addressLine1 || ""}${order.address?.addressLine2 ? ", " + order.address.addressLine2 : ""}<br/>
              ${order.address?.city || ""}, ${order.address?.state || ""} – ${order.address?.pincode || ""}
            </div>
          </td>
          <td style="vertical-align: top; width: 50%; text-align: right; padding: 0;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 8px;">Payment Info</div>
            <div style="font-size: 13px; color: #374151; line-height: 1.6;">
              Status: <span style="color: #059669; font-weight: 600;">PAID</span><br/>
              Method: ${String(order.paymentMethod).toUpperCase().replace(/_/g, " ")}
            </div>
          </td>
        </tr>
      </table>

      <!-- Product List Table -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; text-align: left;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
            <th style="padding: 12px 16px; font-weight: 600; color: #4b5563;">Item Description</th>
            <th style="padding: 12px 16px; font-weight: 600; color: #4b5563; text-align: center; width: 80px;">Qty</th>
            <th style="padding: 12px 16px; font-weight: 600; color: #4b5563; text-align: right; width: 120px;">Unit Price</th>
            <th style="padding: 12px 16px; font-weight: 600; color: #4b5563; text-align: right; width: 120px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${(order.items || []).map(item => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 12px 16px; color: #374151;">${item.productName}</td>
              <td style="padding: 12px 16px; color: #374151; text-align: center;">${item.quantity}</td>
              <td style="padding: 12px 16px; color: #374151; text-align: right;">${rupee(item.price)}</td>
              <td style="padding: 12px 16px; color: #374151; text-align: right;">${rupee(item.price * item.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totals rows -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 30px; border-top: 2px solid #f3f4f6; font-size: 13px; color: #4b5563;">
        <tr>
          <td style="width: 50%; padding: 0;"></td>
          <td style="width: 50%; padding: 16px 0 0 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; line-height: 1.8;">
              <tr>
                <td style="padding: 4px 16px 4px 0; color: #4b5563;">Subtotal:</td>
                <td style="padding: 4px 0 4px 16px; text-align: right; color: #111827; font-weight: 600;">${rupee(order.subtotal)}</td>
              </tr>
              ${Number(order.discount) > 0 ? `
                <tr style="color: #059669;">
                  <td style="padding: 4px 16px 4px 0;">Discount:</td>
                  <td style="padding: 4px 0 4px 16px; text-align: right; font-weight: 600;">-${rupee(order.discount)}</td>
                </tr>
              ` : ""}
              <tr>
                <td style="padding: 4px 16px 4px 0; color: #4b5563;">Delivery Charges:</td>
                <td style="padding: 4px 0 4px 16px; text-align: right; color: #111827; font-weight: 600;">${Number(order.deliveryCharge) === 0 ? "FREE" : rupee(order.deliveryCharge)}</td>
              </tr>
              <tr style="border-top: 1px solid #e5e7eb; font-weight: 700; font-size: 16px; color: #111827;">
                <td style="padding: 10px 16px 10px 0; font-family: sans-serif;">Grand Total:</td>
                <td style="padding: 10px 0; text-align: right; font-family: sans-serif;">${rupee(order.total)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Footer note -->
      <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px dashed #f3f4f6; padding-top: 16px;">
        Thank you for ordering from Namma Oor Karuvattu Kadai! Come back soon.
      </div>
    </div>
  `;

  const options = {
    margin: 10,
    filename: `Invoice_${order.id.slice(0, 8).toUpperCase()}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  };

  // Convert HTML string to PDF directly and start download
  window.html2pdf().from(invoiceHtml).set(options).save().catch((err) => {
    console.error("PDF generation failed:", err);
  });
};
