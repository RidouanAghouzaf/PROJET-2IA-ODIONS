// Returns digits-only E.164 without "+" (what Meta expects), or null.
function normalizePhoneNumber(input) {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  const hadPlus = raw.startsWith("+");
  let d = raw.replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2); // 00212... -> 212...

  // Moroccan mobiles only (6/7); landlines (05) can't use WhatsApp reliably
  if (/^212[67]\d{8}$/.test(d)) return d;                 // 2126XXXXXXXX / +2127XXXXXXXX
  if (/^0[67]\d{8}$/.test(d)) return "212" + d.slice(1);  // 06XXXXXXXX / 07XXXXXXXX
  if (/^[67]\d{8}$/.test(d) && !hadPlus) return "212" + d; // 6XXXXXXXX

  // Other international numbers: only accept if explicitly international
  if ((hadPlus || raw.startsWith("00")) && /^\d{8,15}$/.test(d) && !d.startsWith("0")) return d;

  return null;
}

module.exports = { normalizePhoneNumber };