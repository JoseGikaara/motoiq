import crypto from "crypto";

const SHORT_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(length = 8) {
  let code = "";
  while (code.length < length) {
    const byte = crypto.randomBytes(1)[0];
    code += SHORT_CODE_CHARS[byte % SHORT_CODE_CHARS.length];
  }
  return code;
}

/** Generate a short code for affiliate links (e.g. 5–6 chars). */
export function generateShortCode(length = 6) {
  let code = "";
  while (code.length < length) {
    const byte = crypto.randomBytes(1)[0];
    code += SHORT_CODE_CHARS[byte % SHORT_CODE_CHARS.length];
  }
  return code;
}

