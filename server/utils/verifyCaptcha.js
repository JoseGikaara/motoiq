export async function verifyCaptchaToken(token, remoteIp) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  // If not configured, treat captcha as disabled (always pass)
  if (!secret) return true;
  if (!token) return false;

  try {
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);
    if (remoteIp) params.append("remoteip", remoteIp);

    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      body: params,
    });
    const data = await res.json().catch(() => null);
    return Boolean(data?.success);
  } catch (e) {
    // Fail open: don't block real users if Google is unreachable
    return true;
  }
}

