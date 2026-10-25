import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import opentype from "opentype.js";

// Text is drawn as vector paths, not <text>, so the image looks the same on
// servers that have no fonts installed (Vercel has none).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ASSET_DIR = path.resolve(__dirname, "../../assets/story-card");

const FONT_FILES = {
  medium: "Poppins-Medium.ttf",
  semibold: "Poppins-SemiBold.ttf",
  bold: "Poppins-Bold.ttf",
  extrabold: "Poppins-ExtraBold.ttf",
};

const fontCache = {};

export const getFont = (weight = "bold") => {
  const file = FONT_FILES[weight];
  if (!file) throw new Error(`Unknown font weight "${weight}"`);
  if (!fontCache[weight]) {
    const buf = fs.readFileSync(path.join(ASSET_DIR, "fonts", file));
    fontCache[weight] = opentype.parse(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    );
  }
  return fontCache[weight];
};

// Width in px of `text` at `size`, including extra letter spacing.
export const measureText = (text, { size, weight = "bold", letterSpacing = 0 }) => {
  const str = String(text ?? "");
  if (!str) return 0;
  return (
    getFont(weight).getAdvanceWidth(str, size, { kerning: true }) +
    letterSpacing * Math.max(0, [...str].length - 1)
  );
};

// Largest size <= `size` (not below `minSize`) at which `text` fits in `maxWidth`.
export const fitSize = (text, { size, maxWidth, minSize = 12, weight = "bold", letterSpacing = 0 }) => {
  let s = size;
  while (s > minSize && measureText(text, { size: s, weight, letterSpacing }) > maxWidth) {
    s -= 1;
  }
  return s;
};

// Shortens `text` with "…" until it fits `maxWidth` at `size`.
export const truncateToWidth = (text, { size, maxWidth, weight = "bold", letterSpacing = 0 }) => {
  let str = String(text ?? "");
  if (measureText(str, { size, weight, letterSpacing }) <= maxWidth) return str;
  const chars = [...str];
  while (chars.length > 1) {
    chars.pop();
    str = chars.join("").trimEnd() + "…";
    if (measureText(str, { size, weight, letterSpacing }) <= maxWidth) return str;
  }
  return str;
};

const escapeAttr = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * Returns an SVG <path> drawing `text` with its baseline at `y`.
 * anchor: "start" | "middle" | "end" — horizontal alignment around `x`.
 * Optional: fill, opacity, letterSpacing (px between characters), maxWidth
 * (auto-shrinks font size down to minSize, then truncates with "…").
 */
export const textPath = (
  text,
  {
    x,
    y,
    size,
    weight = "bold",
    anchor = "start",
    fill = "#ffffff",
    opacity,
    letterSpacing = 0,
    maxWidth,
    minSize,
  },
) => {
  let str = String(text ?? "");
  if (!str) return "";
  let fontSize = size;
  if (maxWidth) {
    fontSize = fitSize(str, { size, maxWidth, minSize: minSize ?? Math.round(size * 0.6), weight, letterSpacing });
    str = truncateToWidth(str, { size: fontSize, maxWidth, weight, letterSpacing });
  }

  const font = getFont(weight);
  const width = measureText(str, { size: fontSize, weight, letterSpacing });
  let cursor = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;

  let d = "";
  if (letterSpacing) {
    for (const ch of [...str]) {
      d += font.getPath(ch, cursor, y, fontSize).toPathData(2);
      cursor += font.getAdvanceWidth(ch, fontSize) + letterSpacing;
    }
  } else {
    d = font.getPath(str, cursor, y, fontSize, { kerning: true }).toPathData(2);
  }

  const opacityAttr = opacity !== undefined ? ` fill-opacity="${opacity}"` : "";
  return `<path d="${d}" fill="${escapeAttr(fill)}"${opacityAttr}/>`;
};

// Indian digit grouping: 125000 -> "1,25,000"; keeps paise only when present.
export const formatRupees = (amount) => {
  const n = Math.round(Number(amount || 0) * 100) / 100;
  const hasPaise = Math.round(n * 100) % 100 !== 0;
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
};
