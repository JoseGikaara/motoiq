export function paymentReceivedHtml(v) {
  return `<!DOCTYPE html><html><body><h1>Payment Received</h1><p>Hi ${v.fullName},</p><p>We are verifying. Account activated within 2 hours.</p></body></html>`;
}
