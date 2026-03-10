export function applicationReceivedHtml(v) {
  return `<!DOCTYPE html><html><body><h1>Application Received</h1><p>Hi ${v.fullName},</p><p>Check status: <a href="${v.statusUrl}">${v.statusUrl}</a></p></body></html>`;
}
