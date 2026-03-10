export function applicationRejectedHtml(vars) {
  const fullName = vars.fullName || "";
  const reason = vars.reason || "";
  return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body style=\"font-family:system-ui;padding:24px;\"><h1>MotorIQ - Application Update</h1><p>Hi " + fullName + ",</p><p>After reviewing your application we're unable to proceed at this time.</p>" + (reason ? "<p>Reason: " + reason + "</p>" : "") + "<p>Reply or WhatsApp us to discuss.</p><p>— MotorIQ Team</p></body></html>";
}
