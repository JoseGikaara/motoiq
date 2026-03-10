export function accountApprovedHtml(vars) {
  const fullName = vars.fullName || "";
  const email = vars.email || "";
  const tempPassword = vars.tempPassword || "";
  const loginUrl = vars.loginUrl || "#";
  return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body style=\"font-family:system-ui;padding:24px;\"><h1>MotorIQ - Your Account is Live!</h1><p>Hi " + fullName + ",</p><p>Login URL: " + loginUrl + "</p><p>Email: " + email + "</p><p>Temporary Password: " + tempPassword + "</p><p>Please change your password after first login.</p><p><a href=\"" + loginUrl + "\">Log in to MotorIQ</a></p><p>— MotorIQ Team</p></body></html>";
}
