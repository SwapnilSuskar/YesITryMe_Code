// "Celebration Burst" HTML email for credit / withdrawal.
import { formatRupees } from "./svgText.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SITE_ROOT = "https://www.yesitryme.com";

// "25 Oct 2026" in IST, independent of server timezone.
const formatDate = (date) => {
  const d = new Date(date instanceof Date ? date.getTime() : date || Date.now());
  if (Number.isNaN(d.getTime())) return "";
  const ist = new Date(d.getTime() + 330 * 60 * 1000);
  return `${ist.getUTCDate()} ${MONTHS[ist.getUTCMonth()]} ${ist.getUTCFullYear()}`;
};

// ---------- email ----------
const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Raw URL, only http(s); anything else falls back to the site root.
const safeUrl = (url) => {
  const s = String(url || "").trim();
  return /^https?:\/\/[^\s]+$/i.test(s) ? s : SITE_ROOT;
};

// encodeURIComponent throws on lone surrogates; replace them first if needed.
const encodeText = (s) => {
  try {
    return encodeURIComponent(s);
  } catch {
    return encodeURIComponent(
      s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "�"),
    );
  }
};

const FONT = "'Poppins','Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// Pill-shaped button that stays clickable as plain text where inline-block is ignored.
const button = (href, label, bg, color) => `<table role="presentation" width="280" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:280px;"><tr>
<td align="center" bgcolor="${bg}" style="background-color:${bg};border-radius:999px;">
<a href="${href}" target="_blank" class="btn" style="display:block;padding:14px 18px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:700;color:${color};text-decoration:none;border-radius:999px;">${label}</a>
</td></tr></table>`;

export function buildEmailHtml(data, { cardCid } = {}) {
  const isW = data.kind === "withdrawal";
  const amount = `₹${formatRupees(data.amount)}`;
  const first = esc(data.firstName || String(data.name || "").split(/\s+/)[0] || "there");
  const source = isW ? "" : String(data.sourceLabel || "").trim();
  const rawCode = String(data.referralCode || "").trim().toUpperCase();
  const code = esc(rawCode);
  const linkUrl = safeUrl(data.referralLink);
  const link = esc(linkUrl);
  const linkText = esc(linkUrl.replace(/^https?:\/\//i, ""));
  const siteLabel = String(data.website || "www.yesitryme.com").replace(/^https?:\/\//i, "");
  const site = esc(siteLabel);
  const siteHref = esc(safeUrl(`https://${siteLabel}`));
  const date = esc(formatDate(data.date));
  // Long amounts (lakhs/crores with paise) get a smaller phone size so they never overflow 320px.
  const amtLen = [...amount].length;
  const amtClass = amtLen <= 10 ? "amt" : amtLen <= 12 ? "amt-m" : "amt-s";
  const amtSize = amtLen <= 12 ? 58 : 52;

  // One phrase for withdrawals everywhere in this email.
  const BANK = "Received in your bank";
  // Where a credit landed: the wallet, or a fund such as "Car Fund".
  const creditedTo = esc(data.creditedTo || "wallet");

  const badgeBg = isW ? "#16C784" : "#FFC93C";
  const badgeInk = isW ? "#033A22" : "#4A1A00";
  const badgeText = isW ? "&#10003;&nbsp; WITHDRAWAL SUCCESSFUL" : "&#9733;&nbsp; INCOME CREDITED";
  const title = isW ? "Withdrawal successful" : "Income credited";
  const heroLine = isW ? BANK : `Added to your ${creditedTo}`;
  const strong = (t) => `<strong style="color:#17080A;">${t}</strong>`;
  // "Level 3 Income · Daimond" -> parts; in running text the separator is glued with
  // non-breaking spaces so a line can never start or end with it.
  const sourceParts = source.split(/\s*[·•|]\s*/).filter(Boolean);
  const sourceInline = sourceParts.map(esc).join("&nbsp;&middot;&nbsp;");
  const intro = isW
    ? `Great news! Your withdrawal is complete &mdash; ${strong(esc(amount))} received in your bank. It may take a little while to show in your bank statement.`
    : `Congratulations! ${strong(esc(amount))} has just been credited to your YesITryMe ${creditedTo}${sourceInline ? ` as ${strong(sourceInline)}` : ""}. Keep it up!`;
  const preheader = isW
    ? `${amount} received in your bank. Your success card is attached, ready for your Status!`
    : `${amount} added to your ${creditedTo}. Your success card is attached, ready for your Status!`;

  // Ready-to-post caption (first person, it goes on the user's Status).
  const join = rawCode ? `Join me with my referral code ${rawCode}` : "Join me";
  const caption = isW
    ? `Got ${amount} in my bank from YesITryMe today! ✅ ${join} 👉 ${linkUrl}`
    : `Earned ${amount} on YesITryMe today! 🎉 ${join} 👉 ${linkUrl}`;
  // Display copy: let the URL break before "?" / "&" instead of mid-word (wbr adds no characters when copied).
  const captionHtml = esc(caption).replace(/(\?|&amp;)/g, "<wbr>$1");
  const waHref = esc(`https://wa.me/?text=${encodeText(caption)}`);

  // Source parts as chips: they wrap whole, so no separator is ever left dangling.
  const chips = sourceParts
    .map(
      (t) =>
        `<span style="display:inline-block;margin:3px 2px;padding:4px 12px;border-radius:999px;background-color:#A8240C;background-color:rgba(74,7,16,0.32);font-family:${FONT};font-size:12px;line-height:18px;font-weight:600;color:#FFFFFF;">${esc(t)}</span>`,
    )
    .join(" ");

  const rows = [...(Array.isArray(data.details) ? data.details : [])];
  if (!isW && data.walletBalance !== undefined && data.walletBalance !== null && data.walletBalance !== "") {
    rows.push({ label: "Wallet balance", value: `₹${formatRupees(data.walletBalance)}`, highlight: true });
  }
  const highlightLabel = isW ? /received in (your )?bank/i : /wallet balance/i;
  const detailRows = rows
    .map((r, i) => {
      const hi = r.highlight || highlightLabel.test(String(r.label || ""));
      const label = isW && /^received in (your )?bank$/i.test(String(r.label || "").trim()) ? BANK : r.label;
      const border = i === rows.length - 1 ? "" : "border-bottom:1px solid #F3E6DE;";
      const bg = hi ? "background-color:#FFEBDD;" : "";
      const cls = hi ? "dch" : "dc";
      // Short values (amounts, "25 Oct 2026, 2:32 PM") only break after a comma on small phones.
      const rawValue = String(r.value ?? "");
      const value =
        [...rawValue].length > 24
          ? esc(rawValue)
          : rawValue.split(", ").map((part) => esc(part).replace(/ /g, "&nbsp;")).join(", ");
      return `<tr>
<td class="${cls}" style="padding:13px 16px;${border}${bg}${hi ? "border-left:4px solid #FF4E00;" : ""}font-family:${FONT};font-size:14px;line-height:20px;color:${hi ? "#8A3A12" : "#7A6A64"};${hi ? "font-weight:600;" : ""}vertical-align:middle;">${esc(label).replace(/ (?=\S+$)/, "&nbsp;")}</td>
<td align="right" class="${cls}" style="padding:13px 16px;${border}${bg}font-family:${FONT};font-size:${hi ? 17 : 14}px;line-height:20px;font-weight:${hi ? 800 : 600};color:${hi ? "#E04400" : "#17080A"};vertical-align:middle;">${value}</td>
</tr>`;
    })
    .join("");

  const cardImg = cardCid
    ? `<tr><td align="center" style="padding:6px 28px 8px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
<td bgcolor="#1A0508" style="background-color:#1A0508;background-image:linear-gradient(160deg,#3A0A10 0%,#140306 100%);border-radius:30px;padding:10px;">
<img src="cid:${esc(cardCid)}" width="300" alt="Your ${esc(amount)} success card" style="display:block;width:100%;max-width:300px;height:auto;border:0;border-radius:22px;outline:none;text-decoration:none;">
</td></tr></table>
</td></tr>
<tr><td align="center" style="padding:6px 28px 0;font-family:${FONT};font-size:11px;line-height:16px;color:#9A8A84;letter-spacing:0.8px;white-space:nowrap;">YOUR SUCCESS CARD&nbsp;&middot;&nbsp;ATTACHED</td></tr>
<tr><td align="center" class="px" style="padding:10px 44px 28px;font-family:${FONT};font-size:13px;line-height:20px;color:#6B5B55;"><strong style="color:#C73E00;">Tip:</strong> open this email on your phone, tap the attached image, save it, then post it to your WhatsApp Status or Instagram Story.</td></tr>`
    : "";

  const codeBox = rawCode
    ? `<tr><td align="center" style="padding:0 24px 20px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td bgcolor="#FFF1E7" style="background-color:#FFF1E7;border:2px dashed #FF4E00;border-radius:14px;padding:10px 26px;text-align:center;">
<div style="font-family:${FONT};font-size:10px;line-height:14px;font-weight:700;color:#C73E00;letter-spacing:2px;">YOUR REFERRAL CODE</div>
<div style="font-family:${FONT};font-size:26px;line-height:34px;font-weight:800;color:#E04400;letter-spacing:3px;">${code}</div>
</td></tr></table>
</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<title>${esc(title)} &ndash; ${esc(amount)}</title>
<style>
@media only screen and (max-width:520px){
 .wrap{padding:12px 8px !important;}
 .px{padding-left:20px !important;padding-right:20px !important;}
 .ipx{padding-left:16px !important;padding-right:16px !important;}
 .sp{padding-left:12px !important;padding-right:12px !important;}
 .dc{padding-left:12px !important;padding-right:12px !important;font-size:13px !important;}
 .dch{padding-left:12px !important;padding-right:12px !important;}
 .btn{padding-left:12px !important;padding-right:12px !important;}
 .cap{padding:12px 14px !important;}
 .amt{font-size:46px !important;line-height:54px !important;}
 .amt-m{font-size:38px !important;line-height:46px !important;}
 .amt-s{font-size:33px !important;line-height:42px !important;}
 .h1{font-size:20px !important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#F3ECE8;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#F3ECE8;">${esc(preheader)}${"&#8199;&#847; ".repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F3ECE8" style="background-color:#F3ECE8;">
<tr><td align="center" class="wrap" style="padding:28px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

<tr><td bgcolor="#E04400" class="px" style="background-color:#E04400;background-image:radial-gradient(circle at 50% 70%,#FF6A12 0%,#FF4E00 28%,#D3141C 62%,#4A0710 100%);border-radius:28px 28px 0 0;padding:26px 32px 32px;text-align:center;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="font-family:${FONT};font-size:24px;line-height:28px;font-weight:800;color:#FFFFFF;letter-spacing:0.3px;">Yes<span style="color:#FFD39A;">I</span>TryMe</td></tr>
<tr><td align="center" style="padding-top:2px;font-family:${FONT};font-size:10px;line-height:14px;font-weight:600;color:#FFE3CC;letter-spacing:2.5px;">DIGITAL EARNING OPPORTUNITY</td></tr>
<tr><td align="center" style="padding-top:22px;font-family:${FONT};font-size:14px;line-height:14px;color:#FFE08A;letter-spacing:6px;">&#10022; &#183; &#10023; &#183; &#10022;</td></tr>
<tr><td align="center" style="padding-top:14px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td bgcolor="${badgeBg}" style="background-color:${badgeBg};border-radius:999px;padding:8px 18px;font-family:${FONT};font-size:12px;line-height:16px;font-weight:700;color:${badgeInk};letter-spacing:1.5px;">${badgeText}</td>
</tr></table>
</td></tr>
<tr><td align="center" class="h1" style="padding-top:18px;font-family:${FONT};font-size:22px;line-height:28px;font-weight:600;color:#FFFFFF;">${isW ? "You just got paid" : "You just earned"}</td></tr>
<tr><td align="center" class="${amtClass}" style="padding-top:4px;font-family:${FONT};font-size:${amtSize}px;line-height:66px;white-space:nowrap;font-weight:800;color:#FFFFFF;letter-spacing:-1px;text-shadow:0 4px 18px rgba(80,0,0,0.45);">${esc(amount)}</td></tr>
<tr><td align="center" style="padding-top:8px;font-family:${FONT};font-size:15px;line-height:22px;font-weight:600;color:#FFFFFF;">${esc(heroLine)}</td></tr>
${chips ? `<tr><td align="center" style="padding-top:8px;font-size:12px;line-height:18px;">${chips}</td></tr>` : ""}
${date ? `<tr><td align="center" style="padding-top:${chips ? 8 : 4}px;font-family:${FONT};font-size:13px;line-height:18px;font-weight:500;color:#FFE3CC;letter-spacing:0.5px;">${date}</td></tr>` : ""}
</table>
</td></tr>

<tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td class="px" style="padding:30px 36px 6px;font-family:${FONT};font-size:20px;line-height:28px;font-weight:700;color:#17080A;">Hi ${first} &#127881;</td></tr>
<tr><td class="px" style="padding:4px 36px 22px;font-family:${FONT};font-size:15px;line-height:24px;color:#4E4440;">${intro}</td></tr>
${cardImg}
<tr><td class="px" style="padding:0 36px 8px;font-family:${FONT};font-size:12px;line-height:16px;font-weight:700;color:#C73E00;letter-spacing:1.5px;">${isW ? "PAYOUT DETAILS" : "CREDIT DETAILS"}</td></tr>
<tr><td class="px" style="padding:0 36px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #F0DFD5;border-radius:16px;border-collapse:separate;overflow:hidden;">
${detailRows}
</table>
</td></tr>

<tr><td class="px sp" style="padding:0 36px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1A0508" style="background-color:#1A0508;background-image:linear-gradient(150deg,#4A0710 0%,#1A0508 60%);border-radius:22px;">
<tr><td align="center" class="ipx" style="padding:26px 24px 6px;font-family:${FONT};font-size:22px;line-height:28px;font-weight:800;color:#FFFFFF;">Share your success &#128640;</td></tr>
<tr><td align="center" class="ipx" style="padding:4px 24px 18px;font-family:${FONT};font-size:14px;line-height:22px;color:#F1DCD4;"><strong style="color:#FFFFFF;">Post your success card on WhatsApp Status or Instagram Story</strong> with the caption below &mdash; friends who join ${rawCode ? "with your code" : "through your link"} become part of your team.</td></tr>
${codeBox}
<tr><td class="ipx" style="padding:0 24px 6px;font-family:${FONT};font-size:10px;line-height:14px;font-weight:700;color:#FFB38A;letter-spacing:2px;">YOUR CAPTION &middot; COPY &amp; PASTE</td></tr>
<tr><td class="ipx" style="padding:0 24px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td bgcolor="#FFF8F3" class="cap" style="background-color:#FFF8F3;border:1px solid #FFD2B8;border-radius:14px;padding:14px 16px;font-family:${FONT};font-size:14px;line-height:22px;color:#2A1410;text-align:left;word-break:break-word;overflow-wrap:break-word;-webkit-user-select:all;user-select:all;">${captionHtml}</td>
</tr></table>
</td></tr>
<tr><td align="center" class="ipx" style="padding:0 24px 12px;">${button(waHref, "Share on WhatsApp", "#25D366", "#FFFFFF")}</td></tr>
<tr><td align="center" class="ipx" style="padding:0 24px 10px;">${button(link, rawCode ? "Invite friends with your link&nbsp;&rarr;" : "Invite friends to YesITryMe&nbsp;&rarr;", "#FF4E00", "#FFFFFF")}</td></tr>
<tr><td align="center" class="ipx" style="padding:0 24px 24px;font-family:${FONT};font-size:12px;line-height:18px;color:#C9AFA6;word-break:break-all;"><a href="${link}" target="_blank" style="color:#FFB38A;text-decoration:underline;">${linkText}</a></td></tr>
</table>
</td></tr>
</table>
</td></tr>

<tr><td bgcolor="#17080A" class="px" style="background-color:#17080A;border-radius:0 0 28px 28px;padding:26px 32px 28px;text-align:center;">
<div style="font-family:${FONT};font-size:18px;line-height:24px;font-weight:800;color:#FFFFFF;">Yes<span style="color:#FF6A1A;">I</span>TryMe</div>
<div style="padding-top:6px;font-family:${FONT};font-size:12px;line-height:20px;color:#BFAFAA;">Support: <a href="tel:+917066916324" style="color:#FFB38A;text-decoration:none;white-space:nowrap;">+91 7066916324</a><br><a href="mailto:YesITryMeofficial@gmail.com" style="color:#FFB38A;text-decoration:none;">YesITryMeofficial@gmail.com</a></div>
<div style="padding-top:2px;font-family:${FONT};font-size:12px;line-height:20px;"><a href="${siteHref}" target="_blank" style="color:#FFFFFF;text-decoration:none;font-weight:600;">${site}</a></div>
<div style="padding-top:12px;font-family:${FONT};font-size:11px;line-height:17px;color:#8E7C76;">You received this email because money moved in your YesITryMe account.</div>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
