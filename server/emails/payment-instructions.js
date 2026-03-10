export function paymentInstructionsHtml({ fullName, amount, applicationId, statusUrl, paybill = "522522", accountSuffix }) {
  const acc = accountSuffix || applicationId.slice(-6);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Payment Instructions</title></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #1e293b;">MotorIQ — Your Payment Instructions</h1>
  <p>Hi ${fullName},</p>
  <p>Your application has been reviewed. Please complete payment to activate your account.</p>
  <p><strong>Amount due: KES ${amount.toLocaleString()}</strong></p>
  <h2 style="font-size: 1.1em;">M-Pesa</h2>
  <ul>
    <li>Paybill: ${paybill}</li>
    <li>Account: MotorIQ-${acc}</li>
    <li>Amount: KES ${amount.toLocaleString()}</li>
  </ul>
  <h2 style="font-size: 1.1em;">Bank Transfer (Equity Bank)</h2>
  <ul>
    <li>Account Name: MotorIQ Limited</li>
    <li>Account Number: 1234567890</li>
    <li>Branch: Westlands, Nairobi</li>
    <li>Reference: MotorIQ-${applicationId}</li>
  </ul>
  <p><a href="${statusUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Submit Payment Proof</a></p>
  <p style="color: #64748b; font-size: 14px;">Reply to this email or WhatsApp if you have questions.</p>
  <p style="color: #94a3b8; font-size: 12px;">— MotorIQ Team</p>
</body>
</html>`;
}
