const TZ = "Africa/Casablanca";
const RANGE_KEYS = ["today", "last_7_days", "last_30_days", "last_90_days", "this_month", "previous_month"];

const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

function parts(ms) {
  const o = {};
  for (const p of fmt.formatToParts(new Date(ms))) if (p.type !== "literal") o[p.type] = Number(p.value);
  return o;
}
const offsetMs = (ms) => {
  const p = parts(ms);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
};
// UTC instant of local midnight for (y, m, d); overflow of month/day is normalised by Date.UTC
function zonedMidnight(y, m, d) {
  const guess = Date.UTC(y, m - 1, d);
  return guess - offsetMs(guess - offsetMs(guess));
}
const pad = (n) => String(n).padStart(2, "0");
function dayKey(ms) {
  const p = parts(ms);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

function resolveRange(key, now = Date.now()) {
  const p = parts(now);
  const rolling = (n) => {
    const from = zonedMidnight(p.year, p.month, p.day - (n - 1));
    return { from, to: now, pFrom: zonedMidnight(p.year, p.month, p.day - (2 * n - 1)), pTo: from };
  };
  let r;
  switch (key) {
    case "today":        r = rolling(1); break;
    case "last_7_days":  r = rolling(7); break;
    case "last_30_days": r = rolling(30); break;
    case "last_90_days": r = rolling(90); break;
    case "this_month": {
      const from = zonedMidnight(p.year, p.month, 1);
      const pFrom = zonedMidnight(p.year, p.month - 1, 1);
      r = { from, to: now, pFrom, pTo: Math.min(pFrom + (now - from), from) }; // same elapsed span last month
      break;
    }
    case "previous_month": {
      const from = zonedMidnight(p.year, p.month - 1, 1);
      r = { from, to: zonedMidnight(p.year, p.month, 1), pFrom: zonedMidnight(p.year, p.month - 2, 1), pTo: from };
      break;
    }
    default: throw new Error(`Unknown range ${key}`);
  }
  return { key, current: { from: r.from, to: r.to }, previous: { from: r.pFrom, to: r.pTo } };
}

// Local calendar days (YYYY-MM-DD) covered by [fromMs, toMs)
function eachDay(fromMs, toMs) {
  const p = parts(fromMs), days = [];
  for (let i = 0; i < 400; i++) {
    const s = zonedMidnight(p.year, p.month, p.day + i);
    if (s >= toMs) break;
    days.push(dayKey(s + 12 * 3600 * 1000));
  }
  return days;
}

module.exports = { RANGE_KEYS, resolveRange, eachDay };