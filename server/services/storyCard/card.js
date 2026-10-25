// "Celebration Burst" story image (1080x1920 JPEG) for credit / withdrawal emails.
import path from "path";
import sharp from "sharp";
import {
  textPath,
  measureText,
  fitSize,
  truncateToWidth,
  formatRupees,
  getFont,
  ASSET_DIR,
} from "./svgText.js";

const W = 1080;
const H = 1920;
const CX = W / 2;

// Vertical layout. Everything essential sits between y≈230 and y≈1660 so the
// Instagram / WhatsApp story overlays (profile row on top, reply bar below) never cover it.
const LOGO_W = 490; // ~1.3x the original 380px
const LOGO_TOP = 232;
const LOGO_H = Math.round((LOGO_W * 151) / 437); // logo-light.png is 437x151
const BADGE_Y = 446;
const BADGE_H = 76;
const HEADLINE_Y = 624;
const AMOUNT_CY = 770; // vertical centre of the digit block
const PILL_Y = 914;
const PILL_H = 72;
const CHIP_Y = 1018;
const CHIP_H = 124;
const CARD_Y = 1192;
const CARD_H = 444;

// ---------- shared helpers ----------
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toDate = (date) => new Date(date instanceof Date ? date.getTime() : date || Date.now());

// "25 Oct 2026" in IST, independent of server timezone / ICU data.
const formatDate = (date) => {
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return "";
  const ist = new Date(d.getTime() + 330 * 60 * 1000);
  return `${ist.getUTCDate()} ${MONTHS[ist.getUTCMonth()]} ${ist.getUTCFullYear()}`;
};

// Small seeded PRNG (mulberry32): same data -> same image.
const prng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// FNV-1a, so a leader posting every day gets a slightly different confetti/coin layout.
const hashString = (str) => {
  let h = 0x811c9dc5;
  for (const ch of str) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

const r1 = (n) => Math.round(n * 10) / 10;

// User text minus characters Poppins cannot draw (emoji etc. would render as boxes),
// with whitespace collapsed and stray separators (" · ", "|", "-") trimmed off the ends.
const SEP = "\\s·•|:,;\\-–—/";
const drawable = (value, weight = "bold") => {
  const font = getFont(weight);
  return [...String(value ?? "")]
    .filter((ch) => /\s/.test(ch) || font.charToGlyphIndex(ch) > 0)
    .join("")
    .replace(/\s+/g, " ")
    .replace(/\s*([·•|])(\s*[·•|])+\s*/g, " $1 ")
    .replace(new RegExp(`^[${SEP}]+|[${SEP}]+$`, "g"), "")
    .trim();
};

// Word-aware name shortening: full name -> middle names as initials ->
// everything after the first name as initials -> "…" truncation.
const fitName = (name, { size, minSize, maxWidth, weight = "bold" }) => {
  const words = name.split(" ").filter(Boolean);
  const initial = (w) => (/^\p{L}\.$/u.test(w) ? w : `${[...w][0].toUpperCase()}.`);
  const candidates = [words.join(" ")];
  if (words.length > 2) candidates.push([words[0], ...words.slice(1, -1).map(initial), words.at(-1)].join(" "));
  if (words.length > 1) candidates.push([words[0], ...words.slice(1).map(initial)].join(" "));
  for (const text of candidates) {
    const s = fitSize(text, { size, maxWidth, minSize, weight });
    if (measureText(text, { size: s, weight }) <= maxWidth) return { text, size: s };
  }
  return { text: truncateToWidth(candidates.at(-1), { size: minSize, maxWidth, weight }), size: minSize };
};

const THEME = {
  credit: {
    badge: "INCOME CREDITED",
    headline: "I just earned",
    accentA: "#FFE38A",
    accentB: "#FFB21E",
    accentInk: "#4A1A00",
    glow: "#FFB347",
    confetti: ["#FFC83D", "#FFE08A", "#FFFFFF", "#FF8A3D", "#FF3D6E", "#FFD966"],
    seed: 48213,
  },
  withdrawal: {
    badge: "WITHDRAWAL SUCCESSFUL",
    headline: "I just got paid",
    accentA: "#7CF5C2",
    accentB: "#16C784",
    accentInk: "#033A22",
    glow: "#FFC56B",
    confetti: ["#FFC83D", "#7CF5C2", "#FFFFFF", "#FF8A3D", "#FFE08A", "#2EE59D"],
    seed: 90417,
  },
};

// 4-point sparkle centred on (x, y).
const sparkle = (x, y, s, fill, opacity = 1) => {
  const k = s * 0.18;
  return `<path d="M${r1(x)} ${r1(y - s)} C${r1(x + k)} ${r1(y - k)} ${r1(x + k)} ${r1(y - k)} ${r1(x + s)} ${r1(y)} C${r1(x + k)} ${r1(y + k)} ${r1(x + k)} ${r1(y + k)} ${r1(x)} ${r1(y + s)} C${r1(x - k)} ${r1(y + k)} ${r1(x - k)} ${r1(y + k)} ${r1(x - s)} ${r1(y)} C${r1(x - k)} ${r1(y - k)} ${r1(x - k)} ${r1(y - k)} ${r1(x)} ${r1(y - s)}Z" fill="${fill}" fill-opacity="${opacity}"/>`;
};

// Gold coin with a ₹ mark; tilt squashes it for a 3D feel.
const coin = (x, y, r, rot = 0, tilt = 0.86) => {
  const rupee = textPath("₹", { x: 0, y: r * 0.36, size: r * 1.05, weight: "bold", anchor: "middle", fill: "#A15C00" });
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(rot)}) scale(1 ${tilt})">
    <circle cx="0" cy="${r1(r * 0.16)}" r="${r}" fill="#9A5A00"/>
    <circle cx="0" cy="0" r="${r}" fill="url(#coinGrad)"/>
    <circle cx="0" cy="0" r="${r1(r * 0.78)}" fill="none" stroke="#C98500" stroke-width="${r1(r * 0.07)}"/>
    ${rupee}
    <ellipse cx="${r1(-r * 0.35)}" cy="${r1(-r * 0.45)}" rx="${r1(r * 0.28)}" ry="${r1(r * 0.12)}" transform="rotate(-35 ${r1(-r * 0.35)} ${r1(-r * 0.45)})" fill="#FFFFFF" fill-opacity="0.55"/>
  </g>`;
};

// Banknote (withdrawal motif).
const note = (x, y, w, rot = 0) => {
  const h = w * 0.5;
  const rupee = textPath("₹", { x: 0, y: h * 0.17, size: h * 0.5, weight: "bold", anchor: "middle", fill: "#0B6B43" });
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(rot)})">
    <rect x="${r1(-w / 2 + 4)}" y="${r1(-h / 2 + 8)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(h * 0.12)}" fill="#04351F" fill-opacity="0.45"/>
    <rect x="${r1(-w / 2)}" y="${r1(-h / 2)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(h * 0.12)}" fill="url(#noteGrad)"/>
    <rect x="${r1(-w / 2 + h * 0.1)}" y="${r1(-h / 2 + h * 0.1)}" width="${r1(w - h * 0.2)}" height="${r1(h * 0.8)}" rx="${r1(h * 0.08)}" fill="none" stroke="#E9FFF4" stroke-opacity="0.7" stroke-width="${r1(h * 0.04)}"/>
    <circle cx="0" cy="0" r="${r1(h * 0.3)}" fill="#E9FFF4" fill-opacity="0.85"/>
    ${rupee}
  </g>`;
};

// Simple bank building icon in a box of `s` px, top-left at (x, y).
const bankIcon = (x, y, s, fill) => {
  const u = s / 24;
  const p = (px, py) => `${r1(x + px * u)} ${r1(y + py * u)}`;
  return `<path d="M${p(12, 2)} L${p(22, 7.5)} L${p(22, 9.5)} L${p(2, 9.5)} L${p(2, 7.5)} Z
    M${p(4, 11)} h${r1(3 * u)} v${r1(7 * u)} h${r1(-3 * u)} Z
    M${p(10.5, 11)} h${r1(3 * u)} v${r1(7 * u)} h${r1(-3 * u)} Z
    M${p(17, 11)} h${r1(3 * u)} v${r1(7 * u)} h${r1(-3 * u)} Z
    M${p(2, 19.5)} h${r1(20 * u)} v${r1(2.5 * u)} h${r1(-20 * u)} Z" fill="${fill}"/>`;
};

const checkIcon = (cx, cy, r, stroke) =>
  `<path d="M${r1(cx - r * 0.45)} ${r1(cy + r * 0.02)} L${r1(cx - r * 0.12)} ${r1(cy + r * 0.34)} L${r1(cx + r * 0.48)} ${r1(cy - r * 0.32)}" fill="none" stroke="${stroke}" stroke-width="${r1(r * 0.2)}" stroke-linecap="round" stroke-linejoin="round"/>`;

const initialsOf = (name) => {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "Y";
  const first = [...words[0]][0] || "";
  const last = words.length > 1 ? [...words[words.length - 1]][0] || "" : "";
  return (first + last).toUpperCase();
};

// ---------- geometry helpers for keeping decorations off the text ----------
const box = (x1, y1, x2, y2) => ({ x1, y1, x2, y2 });
const rectsOverlap = (a, b, pad = 0) => a.x1 < b.x2 + pad && a.x2 > b.x1 - pad && a.y1 < b.y2 + pad && a.y2 > b.y1 - pad;
const hitsAny = (rect, boxes, pad = 0) => boxes.some((b) => rectsOverlap(rect, b, pad));
const around = (x, y, rx, ry = rx) => box(x - rx, y - ry, x + rx, y + ry);

// ---------- story image ----------
const buildConfetti = (theme, rand, blocked) => {
  const inBlocked = (x, y, pad) => blocked.some((b) => x > b.x1 - pad && x < b.x2 + pad && y > b.y1 - pad && y < b.y2 + pad);
  let out = "";
  let placed = 0;
  let tries = 0;
  while (placed < 90 && tries < 2000) {
    tries++;
    const x = rand() * W;
    const y = rand() * H;
    const size = 6 + rand() * 14;
    if (inBlocked(x, y, size)) continue;
    const color = theme.confetti[Math.floor(rand() * theme.confetti.length)];
    const rot = Math.round(rand() * 180);
    const op = (0.55 + rand() * 0.45).toFixed(2);
    const t = rand();
    if (t < 0.6) {
      out += `<rect x="${r1(x - size / 2)}" y="${r1(y - size / 4)}" width="${r1(size)}" height="${r1(size / 2)}" rx="2" fill="${color}" fill-opacity="${op}" transform="rotate(${rot} ${r1(x)} ${r1(y)})"/>`;
    } else {
      out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(size / 3)}" fill="${color}" fill-opacity="${op}"/>`;
    }
    placed++;
  }
  return out;
};

const buildRays = (cx, cy, count, rotation) => {
  const R = 1500;
  let d = "";
  for (let i = 0; i < count; i++) {
    const a0 = ((i * 360) / count + rotation) * (Math.PI / 180);
    const a1 = a0 + ((360 / count) * 0.42 * Math.PI) / 180;
    d += `M${cx} ${cy} L${r1(cx + R * Math.cos(a0))} ${r1(cy + R * Math.sin(a0))} L${r1(cx + R * Math.cos(a1))} ${r1(cy + R * Math.sin(a1))}Z`;
  }
  return `<path d="${d}" fill="url(#rayGrad)"/>`;
};

// Hero amount: small raised ₹ + giant rupee digits + smaller baseline-aligned paise,
// centred on CX and vertically centred on `centerY` (so shrunk amounts stay balanced).
const buildAmount = (amount, { centerY, maxWidth, size }) => {
  const [intPart, frac] = formatRupees(amount).split(".");
  const paise = frac ? `.${frac}` : "";
  const layout = (s) => {
    const ls = -Math.round(s * (intPart.length > 8 ? 0.03 : 0.02));
    const rs = Math.round(s * 0.5);
    const ps = Math.round(s * 0.58);
    const pls = -Math.round(ps * 0.02);
    const wR = measureText("₹", { size: rs, weight: "bold" });
    const gap = Math.round(s * 0.04);
    const wI = measureText(intPart, { size: s, weight: "extrabold", letterSpacing: ls });
    const pGap = paise ? -Math.round(s * 0.03) : 0; // pull the small "." in against the digits
    const wP = paise ? measureText(paise, { size: ps, weight: "extrabold", letterSpacing: pls }) : 0;
    return { s, ls, rs, ps, pls, wR, gap, wI, pGap, wP, total: wR + gap + wI + pGap + wP };
  };
  let L = layout(size);
  while (L.total > maxWidth && L.s > 60) L = layout(L.s - 2);
  const baseline = Math.round(centerY + 0.373 * L.s);
  const left = CX - L.total / 2;
  const digitTop = baseline - L.s * 0.746;
  const xI = left + L.wR + L.gap;
  const xP = xI + L.wI + L.pGap;
  // ₹ top aligned with the digit tops
  const rupeeBase = digitTop + L.rs * 0.702;
  const draw = (rupeeFill, digitFill, paiseFill) =>
    textPath("₹", { x: left, y: rupeeBase, size: L.rs, weight: "bold", fill: rupeeFill }) +
    textPath(intPart, { x: xI, y: baseline, size: L.s, weight: "extrabold", letterSpacing: L.ls, fill: digitFill }) +
    (paise ? textPath(paise, { x: xP, y: baseline, size: L.ps, weight: "extrabold", letterSpacing: L.pls, fill: paiseFill }) : "");
  return {
    shadow: draw("#2A0000", "#2A0000", "#2A0000"),
    glow: draw("#FFC46B", "#FFC46B", "#FFC46B"),
    main: draw("#FFE7A8", "#FFFFFF", "#FFE7A8"),
    // y2 includes the comma descenders
    box: { x1: left, x2: left + L.total, y1: digitTop, y2: baseline + L.s * 0.12, baseline, size: L.s },
  };
};

const buildSvg = (data) => {
  const kind = data.kind === "withdrawal" ? "withdrawal" : "credit";
  const T = THEME[kind];
  const burstY = 770;

  // --- user text, cleaned of characters the font cannot draw ---
  const name = drawable(data.name) || drawable(data.firstName) || "YesITryMe Member";
  const srcText =
    drawable(data.sourceLabel, "semibold") || (kind === "withdrawal" ? "Paid to my bank account" : "Wallet income");
  const code = drawable(String(data.referralCode || "").toUpperCase(), "extrabold");
  const site = drawable(data.website, "semibold") || "www.yesitryme.com";
  const dateStr = formatDate(data.date);

  // Per-image decoration seed: same data -> same image, different days/amounts -> varied layout.
  const dateMs = toDate(data.date).getTime();
  const seed = (hashString(`${kind}|${name}|${Math.round(Number(data.amount || 0) * 100)}|${Number.isNaN(dateMs) ? "" : dateMs}`) ^ T.seed) >>> 0;
  const rand = prng(seed);
  const jitter = (n) => (rand() - 0.5) * 2 * n;

  // --- status badge ---
  const badgeText = T.badge;
  const badgeSize = 30;
  const badgeLS = 4;
  const badgeTW = measureText(badgeText, { size: badgeSize, weight: "bold", letterSpacing: badgeLS });
  const iconR = 25;
  const badgeW = 14 + iconR * 2 + 16 + badgeTW + 34;
  const badgeX = CX - badgeW / 2;
  const iconCx = badgeX + 14 + iconR;
  const iconCy = BADGE_Y + BADGE_H / 2;
  const badge = `
    <rect x="${r1(badgeX)}" y="${BADGE_Y + 6}" width="${r1(badgeW)}" height="${BADGE_H}" rx="${BADGE_H / 2}" fill="#1A0000" fill-opacity="0.35"/>
    <rect x="${r1(badgeX)}" y="${BADGE_Y}" width="${r1(badgeW)}" height="${BADGE_H}" rx="${BADGE_H / 2}" fill="url(#badgeGrad)"/>
    <circle cx="${r1(iconCx)}" cy="${iconCy}" r="${iconR}" fill="${T.accentInk}"/>
    ${kind === "withdrawal" ? checkIcon(iconCx, iconCy, iconR, T.accentA) : textPath("₹", { x: iconCx, y: iconCy + 11, size: 32, weight: "bold", anchor: "middle", fill: T.accentA })}
    ${textPath(badgeText, { x: iconCx + iconR + 16, y: iconCy + 11, size: badgeSize, weight: "bold", letterSpacing: badgeLS, fill: T.accentInk })}`;

  // --- headline + amount ---
  const headSize = 64;
  const headW = Math.min(measureText(T.headline, { size: headSize, weight: "semibold" }), 900);
  const headline = textPath(T.headline, { x: CX, y: HEADLINE_Y, size: headSize, weight: "semibold", anchor: "middle", fill: "#FFFFFF", maxWidth: 900 });
  const amt = buildAmount(data.amount, { centerY: AMOUNT_CY, maxWidth: 930, size: 232 });

  // --- source pill ---
  const srcSize = 34;
  const srcIcon = 38;
  const srcMaxText = 820 - srcIcon - 70;
  const srcFit = fitSize(srcText, { size: srcSize, maxWidth: srcMaxText, minSize: 26, weight: "semibold" });
  const srcTW = Math.min(measureText(srcText, { size: srcFit, weight: "semibold" }), srcMaxText);
  const srcW = 30 + srcIcon + 16 + srcTW + 36;
  const srcX = CX - srcW / 2;
  const srcIconSvg =
    kind === "withdrawal"
      ? bankIcon(srcX + 30, PILL_Y + (PILL_H - srcIcon) / 2 - 1, srcIcon, T.accentA)
      : sparkle(srcX + 30 + srcIcon / 2, PILL_Y + PILL_H / 2, srcIcon / 2, T.accentA);
  const sourcePill = `
    <rect x="${r1(srcX)}" y="${PILL_Y}" width="${r1(srcW)}" height="${PILL_H}" rx="${PILL_H / 2}" fill="#1A0000" fill-opacity="0.38" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="2"/>
    ${srcIconSvg}
    ${textPath(srcText, { x: srcX + 30 + srcIcon + 16, y: PILL_Y + PILL_H / 2 + srcFit * 0.36, size: srcFit, weight: "semibold", fill: "#FFFFFF", maxWidth: srcMaxText, minSize: 26 })}`;

  // --- name chip ---
  const av = 88;
  const nameMax = 640;
  const fitted = fitName(name, { size: 44, minSize: 32, maxWidth: nameMax, weight: "bold" });
  const nameW = Math.min(measureText(fitted.text, { size: fitted.size, weight: "bold" }), nameMax);
  const dateW = measureText(dateStr, { size: 30, weight: "medium" }) + 34;
  const chipW = 18 + av + 24 + Math.max(nameW, dateW) + 40;
  const chipX = CX - chipW / 2;
  const avCx = chipX + 18 + av / 2;
  const avCy = CHIP_Y + CHIP_H / 2;
  const tx = chipX + 18 + av + 24;
  const initials = initialsOf(name);
  const chip = `
    <rect x="${r1(chipX)}" y="${CHIP_Y}" width="${r1(chipW)}" height="${CHIP_H}" rx="${CHIP_H / 2}" fill="#FFFFFF" fill-opacity="0.12" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="2"/>
    <circle cx="${r1(avCx)}" cy="${avCy}" r="${av / 2 + 4}" fill="url(#badgeGrad)"/>
    <circle cx="${r1(avCx)}" cy="${avCy}" r="${av / 2 - 2}" fill="url(#avatarGrad)"/>
    ${textPath(initials, { x: avCx, y: avCy + 13, size: 36, weight: "bold", anchor: "middle", fill: "#FFFFFF", maxWidth: av - 20 })}
    ${textPath(fitted.text, { x: tx, y: CHIP_Y + 60, size: fitted.size, weight: "bold", fill: "#FFFFFF", maxWidth: nameMax, minSize: fitted.size })}
    <rect x="${r1(tx)}" y="${CHIP_Y + 80}" width="22" height="20" rx="4" fill="none" stroke="${T.accentA}" stroke-width="2.5"/>
    <path d="M${r1(tx)} ${CHIP_Y + 87} h22 M${r1(tx + 6)} ${CHIP_Y + 76} v7 M${r1(tx + 16)} ${CHIP_Y + 76} v7" stroke="${T.accentA}" stroke-width="2.5" stroke-linecap="round"/>
    ${textPath(dateStr, { x: tx + 34, y: CHIP_Y + 101, size: 30, weight: "medium", fill: "#FFFFFF", opacity: 0.85 })}`;

  // --- CTA card ---
  const cardX = 70;
  const cardW = 940;
  const couponX = 120;
  const couponY = CARD_Y + 162;
  const couponW = 840;
  const couponH = 150;
  // No referral code (yet): keep the coupon, but make it a plain sign-up call to action.
  const subtitle = code ? "Start your digital earning journey today" : "Start your digital earning journey";
  const couponLabel = code ? "USE MY REFERRAL CODE" : "TAKE THE FIRST STEP";
  const couponMain = code || "SIGN UP TODAY";
  const card = `
    ${[34, 26, 18, 10].map((o, i) => `<rect x="${cardX - o / 2}" y="${CARD_Y + 8 + o / 2}" width="${cardW + o}" height="${CARD_H + o / 2}" rx="${48 + o / 2}" fill="#0A0000" fill-opacity="${[0.08, 0.1, 0.12, 0.16][i]}"/>`).join("")}
    <rect x="${cardX}" y="${CARD_Y}" width="${cardW}" height="${CARD_H}" rx="48" fill="#FFFFFF"/>
    ${textPath("Join me on YesITryMe", { x: CX, y: CARD_Y + 82, size: 54, weight: "extrabold", anchor: "middle", fill: "#17080A" })}
    ${textPath(subtitle, { x: CX, y: CARD_Y + 126, size: 30, weight: "medium", anchor: "middle", fill: "#6E5F5A" })}
    <rect x="${couponX}" y="${couponY}" width="${couponW}" height="${couponH}" rx="26" fill="#FFF1E7" stroke="#FF4E00" stroke-width="3.5" stroke-dasharray="14 10"/>
    ${textPath(couponLabel, { x: CX, y: couponY + 46, size: 26, weight: "bold", anchor: "middle", fill: "#C73E00", letterSpacing: 5 })}
    ${textPath(couponMain, { x: CX, y: couponY + 124, size: 78, weight: "extrabold", anchor: "middle", fill: "#E04400", letterSpacing: 6, maxWidth: couponW - 60, minSize: 48 })}
    ${(() => {
      const sSize = fitSize(site, { size: 32, maxWidth: 640, minSize: 24, weight: "semibold" });
      const sW = Math.min(measureText(site, { size: sSize, weight: "semibold" }), 640);
      const pillW = sW + 40 + 56 + 14;
      const px = CX - pillW / 2;
      const py = CARD_Y + CARD_H - 100;
      return `<rect x="${r1(px)}" y="${py}" width="${r1(pillW)}" height="68" rx="34" fill="#17080A"/>
        ${textPath(site, { x: px + 34, y: py + 45, size: sSize, weight: "semibold", fill: "#FFFFFF", maxWidth: 640, minSize: sSize })}
        <circle cx="${r1(px + pillW - 40)}" cy="${py + 34}" r="24" fill="#FF4E00"/>
        <path d="M${r1(px + pillW - 50)} ${py + 34} h20 M${r1(px + pillW - 39)} ${py + 24} l10 10 l-10 10" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    })()}`;

  // --- text boxes that decorations must stay off ---
  const b = amt.box;
  const textBoxes = [
    box(CX - LOGO_W / 2, LOGO_TOP, CX + LOGO_W / 2, LOGO_TOP + LOGO_H),
    box(badgeX, BADGE_Y, badgeX + badgeW, BADGE_Y + BADGE_H + 6),
    box(CX - headW / 2, HEADLINE_Y - headSize * 0.78, CX + headW / 2, HEADLINE_Y + headSize * 0.24),
    box(b.x1, b.y1, b.x2, b.y2),
    box(srcX, PILL_Y, srcX + srcW, PILL_Y + PILL_H),
    box(chipX, CHIP_Y, chipX + chipW, CHIP_Y + CHIP_H),
    box(cardX - 6, CARD_Y - 6, cardX + cardW + 6, CARD_Y + CARD_H + 24),
  ];

  // --- side decorations: jittered per image, pushed outwards if they would touch text ---
  const motif = kind === "credit" ? "coin" : "note";
  const sideSpecs = [
    { t: motif, x: 118, y: 562, s: kind === "credit" ? 52 : 130, rot: kind === "credit" ? -18 : -22 },
    { t: motif, x: 970, y: 474, s: kind === "credit" ? 40 : 110, rot: kind === "credit" ? 22 : 18, tilt: 0.8 },
    { t: motif, x: 994, y: 1060, s: kind === "credit" ? 52 : 130, rot: 14 },
    { t: "coin", x: 78, y: 1100, s: 34, rot: -30, tilt: 0.8 },
  ];
  const farSpecs = [
    { t: motif, x: 76, y: 150, s: kind === "credit" ? 46 : 150, rot: kind === "credit" ? -20 : -24, tilt: 0.8 },
    { t: motif, x: 1004, y: 1750, s: kind === "credit" ? 64 : 170, rot: kind === "credit" ? 25 : 18, tilt: 0.8 },
    { t: motif, x: 112, y: 1796, s: kind === "credit" ? 40 : 120, rot: kind === "credit" ? 10 : -8, tilt: 0.85 },
  ];
  // Rough half-extents of each decoration (notes are rotated, so be generous).
  const extent = (d) => (d.t === "coin" ? { rx: d.s * 1.02, ry: d.s * 1.02 } : { rx: d.s * 0.54, ry: d.s * 0.4 });
  const drawDeco = (d) => (d.t === "coin" ? coin(d.x, d.y, d.s, d.rot, d.tilt ?? 0.86) : note(d.x, d.y, d.s, d.rot));
  const placedDeco = [];
  const placeSide = (spec) => {
    const d = { ...spec, x: spec.x + jitter(16), y: spec.y + jitter(26), rot: spec.rot + jitter(10) };
    const { rx, ry } = extent(d);
    const dir = d.x < CX ? -1 : 1;
    const limit = dir < 0 ? rx * 0.25 : W - rx * 0.25; // keep at least ~60% of it on canvas
    for (let i = 0; i < 40; i++) {
      if (!hitsAny(around(d.x, d.y, rx, ry), textBoxes, 14)) {
        placedDeco.push(around(d.x, d.y, rx, ry));
        return drawDeco(d);
      }
      const next = d.x + dir * 6;
      if ((dir < 0 && next < limit) || (dir > 0 && next > limit)) break;
      d.x = next;
    }
    return ""; // no room without covering text: leave it out
  };
  const placeFar = (spec) => {
    const d = { ...spec, x: spec.x + jitter(26), y: spec.y + jitter(30), rot: spec.rot + jitter(14) };
    placedDeco.push(around(d.x, d.y, extent(d).rx, extent(d).ry));
    return `<g filter="url(#blurFar)">${drawDeco(d)}</g>`;
  };
  const deco = farSpecs.map(placeFar).join("") + sideSpecs.map(placeSide).join("");

  // --- sparkles: hero ones hug the amount, ambient ones drift a little per image ---
  const grow = (r, n) => box(r.x1 - n, r.y1 - n, r.x2 + n, r.y2 + n);
  const sparkBoxes = [...textBoxes.map((r, i) => (i === 3 ? grow(r, 4) : r)), ...placedDeco]; // a little extra air around the amount
  const placedSparks = [];
  // A sparkle is a thin 4-point star, so test its two arms rather than its whole square:
  // that lets the hero sparkle tuck diagonally into the amount's corner without touching a digit.
  const trySparkle = (candidates, s, fill, opacity = 1) => {
    const k = s * 0.2;
    for (const [x, y] of candidates) {
      if (x - s < 10 || x + s > W - 10 || y - s < 10 || y + s > H - 10) continue;
      const arms = [box(x - s, y - k, x + s, y + k), box(x - k, y - s, x + k, y + s)];
      if (arms.some((a) => hitsAny(a, sparkBoxes, 8)) || hitsAny(around(x, y, s), placedSparks, 6)) continue;
      placedSparks.push(around(x, y, s));
      return sparkle(x, y, s, fill, opacity);
    }
    return "";
  };
  const sparkles = [
    trySparkle([[b.x2 + 22, b.y1 - 22], [b.x2 - 6, b.y1 - 44], [b.x2 - 50, b.y1 - 46]], 30, "#FFFFFF"),
    trySparkle([[b.x2 + 58, b.y1 + 30], [b.x2 + 52, b.y1 - 60], [b.x2 + 24, b.y1 + 74]], 14, "#FFE08A"),
    trySparkle([[b.x1 - 38, b.baseline - 30], [b.x1 - 38, b.y1 + 30], [b.x1 + 40, b.y2 + 26]], 22, "#FFE08A"),
    trySparkle([[250 + jitter(30), 300 + jitter(40)], [200, 330]], 18, "#FFFFFF", 0.9),
    trySparkle([[860 + jitter(30), 330 + jitter(40)], [900, 300]], 24, "#FFE08A"),
    trySparkle([[930 + jitter(30), 640 + jitter(24)], [960, 610]], 14, "#FFFFFF", 0.8),
    trySparkle([[540 + jitter(120), 1712 + jitter(16)]], 20, "#FFE08A", 0.9),
    trySparkle([[300 + jitter(60), 1780 + jitter(30)]], 12, "#FFFFFF", 0.8),
    trySparkle([[800 + jitter(60), 1850 + jitter(20)]], 14, "#FFFFFF", 0.7),
  ].join("");

  // Confetti keeps to the edges: the whole hero column, logo and CTA card are blocked.
  const confettiBlocked = [
    box(Math.min(90, b.x1), BADGE_Y - 40, Math.max(990, b.x2), CHIP_Y + CHIP_H + 30),
    grow(textBoxes[0], 30),
    box(cardX - 10, CARD_Y - 20, cardX + cardW + 10, CARD_Y + CARD_H + 20),
  ];
  const confetti = buildConfetti(T, rand, confettiBlocked);
  const rayRot = (kind === "withdrawal" ? 4 : -2) + jitter(4);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="${CX}" cy="${burstY}" r="1150" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FF6A12"/>
      <stop offset="0.2" stop-color="#FF4E00"/>
      <stop offset="0.42" stop-color="#D3141C"/>
      <stop offset="0.68" stop-color="#5E0A14"/>
      <stop offset="1" stop-color="#140306"/>
    </radialGradient>
    <radialGradient id="rayGrad" cx="${CX}" cy="${burstY}" r="1000" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFE3B0" stop-opacity="0.32"/>
      <stop offset="0.45" stop-color="#FFD39A" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#FFD39A" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="core" cx="${CX}" cy="${burstY}" r="520" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFB15C" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#FF6A12" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="vTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0E0204" stop-opacity="0.92"/>
      <stop offset="0.24" stop-color="#0E0204" stop-opacity="0.35"/>
      <stop offset="0.4" stop-color="#0E0204" stop-opacity="0"/>
      <stop offset="0.62" stop-color="#0E0204" stop-opacity="0"/>
      <stop offset="1" stop-color="#0E0204" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${T.accentA}"/>
      <stop offset="1" stop-color="${T.accentB}"/>
    </linearGradient>
    <linearGradient id="avatarGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF7A1A"/>
      <stop offset="1" stop-color="#B3121A"/>
    </linearGradient>
    <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFF1B0"/>
      <stop offset="0.45" stop-color="#FFC93C"/>
      <stop offset="1" stop-color="#E08E00"/>
    </linearGradient>
    <linearGradient id="noteGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9DF7CF"/>
      <stop offset="0.5" stop-color="#3FD996"/>
      <stop offset="1" stop-color="#14A866"/>
    </linearGradient>
    <filter id="glow" filterUnits="userSpaceOnUse" x="${r1(b.x1 - 70)}" y="${r1(b.y1 - 70)}" width="${r1(b.x2 - b.x1 + 140)}" height="${r1(b.y2 - b.y1 + 140)}"><feGaussianBlur stdDeviation="20"/></filter>
    <filter id="shadow" filterUnits="userSpaceOnUse" x="${r1(b.x1 - 30)}" y="${r1(b.y1 - 20)}" width="${r1(b.x2 - b.x1 + 60)}" height="${r1(b.y2 - b.y1 + 70)}"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="blurFar" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="#140306"/>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${buildRays(CX, burstY, 30, r1(rayRot))}
  <rect width="${W}" height="${H}" fill="url(#core)"/>
  <rect width="${W}" height="${H}" fill="url(#vTop)"/>
  ${confetti}
  ${deco}
  ${badge}
  ${headline}
  <g transform="translate(0 10)" filter="url(#shadow)" fill-opacity="0.5">${amt.shadow}</g>
  <g filter="url(#glow)" opacity="0.75">${amt.glow}</g>
  ${amt.main}
  ${sparkles}
  ${sourcePill}
  ${chip}
  ${card}
</svg>`;
};

let logoCache = null;
const getLogo = async () => {
  if (!logoCache) {
    // The source is 437px wide; a ~12% lanczos upscale stays crisp at story size.
    const buf = await sharp(path.join(ASSET_DIR, "logo-light.png")).resize({ width: LOGO_W, kernel: "lanczos3" }).png().toBuffer();
    const { width } = await sharp(buf).metadata();
    logoCache = { buf, width };
  }
  return logoCache;
};

export async function renderCard(data) {
  getFont("extrabold");
  const svg = buildSvg(data);
  const logo = await getLogo();
  return sharp(Buffer.from(svg))
    .composite([{ input: logo.buf, left: Math.round(CX - logo.width / 2), top: LOGO_TOP }])
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4" })
    .toBuffer();
}
