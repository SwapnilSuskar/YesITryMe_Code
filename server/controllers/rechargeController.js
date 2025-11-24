import Recharge from "../models/Recharge.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import RechargeWallet from "../models/RechargeWallet.js";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { checkActiveMemberStatus } from "../services/mlmService.js";
import { sendMobileRechargeReceipt } from "../services/emailReceiptService.js";

const RECHARGE_PROXY_URL =
  process.env.RECHARGE_PROXY_URL ||
  process.env.FIXIE_URL ||
  process.env.FIXIE_HTTP_URL ||
  process.env.AXIOS_RECHARGE_PROXY ||
  process.env.HTTP_RECHARGE_PROXY ||
  process.env.HTTPS_PROXY ||
  process.env.HTTP_PROXY ||
  "";

let rechargeProxyAgent = null;
let proxyInitAttempted = false;

const getRechargeProxyAgent = () => {
  if (proxyInitAttempted) {
    return rechargeProxyAgent;
  }

  proxyInitAttempted = true;

  if (!RECHARGE_PROXY_URL) {
    return null;
  }

  try {
    rechargeProxyAgent = new HttpsProxyAgent(RECHARGE_PROXY_URL);
    const sanitizedHost = (() => {
      try {
        const parsedUrl = new URL(RECHARGE_PROXY_URL);
        return parsedUrl.hostname || parsedUrl.host || "configured proxy";
      } catch (error) {
        return "configured proxy";
      }
    })();
    console.log(
      `[Recharge][Proxy] Routing provider traffic through ${sanitizedHost}`
    );
  } catch (error) {
    console.error(
      "[Recharge][Proxy] Failed to initialize proxy agent:",
      error.message
    );
    rechargeProxyAgent = null;
  }

  return rechargeProxyAgent;
};

// Legacy base URL for legacy endpoints (plans, etc.)
const A1TOPUP_LEGACY_BASE_URL =
  process.env.AITOPUP_BASE_URL || "https://business.a1topup.com";

const normalizePath = (path) => (path || "").replace(/^\/+/, "");

const buildA1TopupUrl = (path) => {
  const base = A1TOPUP_LEGACY_BASE_URL.replace(/\/+$/, "");
  const cleaned = normalizePath(path);
  return `${base}/${cleaned}`;
};

const A1TOPUP_RECHARGE_ENDPOINT = normalizePath(
  process.env.AITOPUP_RECHARGE_ENDPOINT || "recharge"
);
const A1TOPUP_RECHARGE_ACTION =
  process.env.AITOPUP_RECHARGE_ACTION ||
  process.env.AITOPUP_ACTION_RECHARGE ||
  "recharge";
const A1TOPUP_POSTPAID_FETCH_ENDPOINT = normalizePath(
  process.env.AITOPUP_POSTPAID_FETCH_ENDPOINT || "postpaid/fetch-bill"
);
const A1TOPUP_POSTPAID_PAY_ENDPOINT = normalizePath(
  process.env.AITOPUP_POSTPAID_PAY_ENDPOINT || "postpaid"
);

const A1TOPUP_PLANS_ENDPOINT =
  process.env.AITOPUP_PLANS_ENDPOINT || "/recharge/api";
const A1TOPUP_PLANS_METHOD = (
  process.env.AITOPUP_PLANS_METHOD || "post"
).toLowerCase();
const A1TOPUP_PLAN_ACTION =
  process.env.AITOPUP_PLAN_ACTION ||
  process.env.AITOPUP_ACTION_FETCH_PLANS ||
  "plans";
const A1TOPUP_STATUS_ACTION =
  process.env.AITOPUP_STATUS_ACTION ||
  process.env.AITOPUP_ACTION_STATUS ||
  "status";

const RECHARGE_STATUS_POLL_ATTEMPTS = parseInt(
  process.env.RECHARGE_STATUS_POLL_ATTEMPTS || "2",
  10
);
const RECHARGE_STATUS_POLL_DELAY_MS = parseInt(
  process.env.RECHARGE_STATUS_POLL_DELAY_MS || "4000",
  10
);
const RECHARGE_STATUS_POLL_WAIT_FIRST =
  (process.env.RECHARGE_STATUS_POLL_WAIT_FIRST || "true")
    .toString()
    .toLowerCase() !== "false";
const PENDING_RECHARGE_STATUSES = new Set([
  "pending",
  "processing",
  "payment_success",
]);
const BACKGROUND_STATUS_REFRESH_INTERVAL_MS = parseInt(
  process.env.RECHARGE_STATUS_REFRESH_INTERVAL_MS || "30000",
  10
);
const BACKGROUND_STATUS_REFRESH_MIN_AGE_MS = parseInt(
  process.env.RECHARGE_STATUS_REFRESH_MIN_AGE_MS || "60000",
  10
);
const BACKGROUND_STATUS_REFRESH_BATCH_SIZE = parseInt(
  process.env.RECHARGE_STATUS_REFRESH_BATCH_SIZE || "10",
  10
);
const RECHARGE_WALLET_PROMOTE_MIN_AGE_MS = parseInt(
  process.env.RECHARGE_WALLET_PROMOTE_MIN_AGE_MS || "120000",
  10
);

const CIRCLE_CODE_MAP = {
  ANDHRA_PRADESH: "AP",
  ANDHRA_PRADESH_TELANGANA: "AP",
  ARUNACHAL_PRADESH: "NE",
  ASSAM: "AS",
  BIHAR: "BH",
  CHATTISGARH: "CG",
  DELHI_NCR: "DL",
  DELHI: "DL",
  GOA: "GA",
  GUJARAT: "GJ",
  HARYANA: "HR",
  HIMACHAL_PRADESH: "HP",
  JAMMU_AND_KASHMIR: "JK",
  JHARKHAND: "JH",
  KARNATAKA: "KA",
  KERALA: "KL",
  KOLKATA: "KO",
  MADHYA_PRADESH: "MP",
  MAHARASHTRA: "MH",
  MAHARASHTRA_MUMBAI: "MH",
  MAHARASHTRA_MUMBAI_CITY: "MH",
  MAHARASHTRA_MUMBAI_METRO: "MH",
  MUMBAI: "MB",
  NORTH_EAST: "NE",
  ODISHA: "OR",
  ORISSA: "OR",
  PUNJAB: "PB",
  RAJASTHAN: "RJ",
  TAMIL_NADU: "TN",
  CHENNAI: "CH",
  TELANGANA: "TS",
  UTTAR_PRADESH_EAST: "UPE",
  UTTAR_PRADESH_WEST: "UPW",
  UTTARAKHAND: "UK",
  WEST_BENGAL: "WB",
  BIHAR_JHARKHAND: "BH",
  MADHYA_PRADESH_CHHATTISGARH: "MP",
  HARYANA_PUNJAB: "PB",
  HARYANA_DELHI: "DL",
};

const CIRCLE_NUMERIC_CODE_MAP = {
  ANDHRA_PRADESH: "13",
  AP: "13",
  ASSAM: "24",
  AS: "24",
  BIHAR: "17",
  BH: "17",
  CHHATTISGARH: "27",
  CG: "27",
  GUJARAT: "12",
  GJ: "12",
  HARYANA: "20",
  HR: "20",
  HIMACHAL_PRADESH: "21",
  HP: "21",
  JAMMU_AND_KASHMIR: "25",
  JK: "25",
  JHARKHAND: "22",
  JH: "22",
  KARNATAKA: "9",
  KA: "9",
  KERALA: "14",
  KL: "14",
  MADHYA_PRADESH: "16",
  MP: "16",
  MAHARASHTRA: "4",
  MH: "4",
  ODISHA: "23",
  ORISSA: "23",
  OR: "23",
  PUNJAB: "1",
  PB: "1",
  RAJASTHAN: "18",
  RJ: "18",
  TAMIL_NADU: "8",
  TN: "8",
  UTTAR_PRADESH_EAST: "10",
  UPE: "10",
  UTTAR_PRADESH_WEST: "11",
  UPW: "11",
  WEST_BENGAL: "2",
  WB: "2",
  MUMBAI: "3",
  MB: "3",
  DELHI: "5",
  DL: "5",
  CHENNAI: "7",
  CH: "7",
  NORTH_EAST: "26",
  NE: "26",
  KOLKATA: "6",
  KO: "6",
  TELANGANA: "28",
  TS: "28",
  UTTARAKHAND: "19",
  UK: "19",
  GOA: "15",
  GA: "15",
};

const normalizeCircleKey = (value) => {
  if (!value && value !== 0) return "";
  return value
    .toString()
    .trim()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/gi, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
};

const CIRCLE_DISPLAY_NAME_MAP = {
  AP: "Andhra Pradesh",
  AS: "Assam",
  BH: "Bihar & Jharkhand",
  CH: "Chennai",
  CG: "Chhattisgarh",
  DL: "Delhi NCR",
  GA: "Goa",
  GJ: "Gujarat",
  HP: "Himachal Pradesh",
  HR: "Haryana",
  JH: "Jharkhand",
  JK: "Jammu & Kashmir",
  KA: "Karnataka",
  KL: "Kerala",
  KO: "Kolkata",
  MB: "Mumbai",
  MH: "Maharashtra",
  MP: "Madhya Pradesh & Chhattisgarh",
  NE: "North East",
  OR: "Odisha",
  PB: "Punjab",
  RJ: "Rajasthan",
  TN: "Tamil Nadu",
  TS: "Telangana",
  UPE: "Uttar Pradesh East",
  UPW: "Uttar Pradesh West",
  UK: "Uttarakhand",
  WB: "West Bengal",
};

const getPreferredCircleName = (value) => {
  if (!value && value !== 0) return undefined;
  const raw = value.toString().trim();
  if (!raw) return undefined;

  const directCode = CIRCLE_DISPLAY_NAME_MAP[raw.toUpperCase()];
  if (directCode) return directCode;

  const normalizedKey = normalizeCircleKey(raw);
  if (!normalizedKey) return raw;

  const mappedCode = CIRCLE_CODE_MAP[normalizedKey];
  if (mappedCode && CIRCLE_DISPLAY_NAME_MAP[mappedCode.toUpperCase()]) {
    return CIRCLE_DISPLAY_NAME_MAP[mappedCode.toUpperCase()];
  }

  const withoutAnd = normalizedKey.replace(/_AND_/g, "_");
  if (withoutAnd !== normalizedKey) {
    const code = CIRCLE_CODE_MAP[withoutAnd];
    if (code && CIRCLE_DISPLAY_NAME_MAP[code.toUpperCase()]) {
      return CIRCLE_DISPLAY_NAME_MAP[code.toUpperCase()];
    }
  }

  return raw
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const CIRCLE_DETECTION_PRIORITY = [
  "Delhi NCR",
  "Mumbai",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Gujarat",
  "Andhra Pradesh",
  "Telangana",
  "Uttar Pradesh East",
  "Uttar Pradesh West",
  "Rajasthan",
  "Punjab",
  "West Bengal",
  "Bihar Jharkhand",
  "Madhya Pradesh Chhattisgarh",
  "Kerala",
  "Assam",
  "North East",
  "Odisha",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Chennai",
  "Goa",
  "Kolkata",
  "Uttarakhand",
];

const resolveCircleCode = (circleValue) => {
  if (!circleValue) return undefined;
  const normalized = circleValue.toString().trim();
  if (!normalized) return undefined;

  const upperKey = normalized.replace(/\s+/g, "_").toUpperCase();
  return CIRCLE_CODE_MAP[upperKey] || normalized;
};

const resolveCircleNumericCode = (circleValue) => {
  if (!circleValue) return undefined;
  const normalized = circleValue.toString().trim();
  if (!normalized) return undefined;
  
  // If it's already a numeric code, return it
  if (/^\d+$/.test(normalized)) {
    return normalized;
  }
  
  // Try direct lookup
  const upperKey = normalized.replace(/\s+/g, "_").toUpperCase();
  let numericCode = CIRCLE_NUMERIC_CODE_MAP[upperKey];
  
  // If not found, try resolving to text code first, then to numeric
  if (!numericCode) {
    const textCode = CIRCLE_CODE_MAP[upperKey];
    if (textCode) {
      const textCodeUpper = textCode.toUpperCase();
      numericCode =
        CIRCLE_NUMERIC_CODE_MAP[textCodeUpper] ||
        CIRCLE_NUMERIC_CODE_MAP[textCode];
    }
  }
  
  return numericCode;
};

const A1TOPUP_USERNAME =
  process.env.AITOPUP_USERNAME ||
  process.env.AITOPUP_USER_ID ||
  process.env.AITOPUP_ACCOUNT_ID ||
  process.env.AITOPUP_ACCOUNT ||
  "";
const A1TOPUP_PASSWORD =
  process.env.AITOPUP_PASSWORD || process.env.AITOPUP_PWD || "";

const buildProviderParams = (baseParams = {}) => {
  const params = {};

  const setValue = (key, value) => {
    if (value !== undefined && value !== null && value !== "") {
      params[key] = value;
    }
  };

  if (A1TOPUP_USERNAME) {
    setValue("username", A1TOPUP_USERNAME);
    setValue("user", A1TOPUP_USERNAME);
    setValue("userid", A1TOPUP_USERNAME);
  }

  if (A1TOPUP_PASSWORD) {
    setValue("pwd", A1TOPUP_PASSWORD);
    setValue("password", A1TOPUP_PASSWORD);
    setValue("passcode", A1TOPUP_PASSWORD);
  }

  const apiKey = process.env.AITOPUP_API_KEY;
  if (apiKey) {
    setValue("api_key", apiKey);
    setValue("apikey", apiKey);
    setValue("apiKey", apiKey);
    setValue("key", apiKey);
  }
  setValue("format", "json");
  setValue("response", "json");

  const mobile =
    baseParams.mobile || baseParams.number || baseParams.mobileNumber;
  if (mobile) {
    setValue("mobile", mobile);
    setValue("number", mobile);
    setValue("mobile_no", mobile);
    setValue("mobileNumber", mobile);
    setValue("msisdn", mobile);
    setValue("phone", mobile);
    setValue("subscriber_no", mobile);
  }

  const operator =
    baseParams.operator ||
    baseParams.operator_code ||
    baseParams.opid ||
    baseParams.operatorcode;
  if (operator) {
    setValue("operator", operator);
    setValue("operator_code", operator);
    setValue("operatorCode", operator);
    setValue("opid", operator);
    setValue("operatorid", operator);
    setValue("operatorcode", operator);
  }

  const circle =
    baseParams.circle || baseParams.circle_code || baseParams.circlecode;
  if (circle) {
    setValue("circle", circle);
    setValue("circle_code", circle);
    setValue("state", circle);
    setValue("circlecode", circle);
  }

  const typeValue =
    baseParams.type || baseParams.recharge_type || baseParams.category;
  if (typeValue) {
    setValue("type", typeValue);
    setValue("recharge_type", typeValue);
    setValue("category", typeValue);
  }

  if (baseParams.amount) {
    setValue("amount", baseParams.amount);
    setValue("amt", baseParams.amount);
    setValue("recharge_amount", baseParams.amount);
  }

  const orderId =
    baseParams.orderId || baseParams.orderid || baseParams.reference;
  if (orderId) {
    setValue("orderid", orderId);
    setValue("orderId", orderId);
    setValue("order_no", orderId);
  }

  if (baseParams.plan_code) {
    setValue("plan_code", baseParams.plan_code);
  }

  if (baseParams.action) {
    setValue("action", baseParams.action);
    setValue("request", baseParams.action);
    setValue("service", baseParams.action);
  }

  if (baseParams.extra) {
    Object.entries(baseParams.extra).forEach(([key, value]) =>
      setValue(key, value)
    );
  }

  return params;
};

const parseA1TopupLegacyResponse = (rawResponse) => {
  if (rawResponse === null || rawResponse === undefined) {
    return {};
  }

  if (typeof rawResponse === "object" && !Array.isArray(rawResponse)) {
    return rawResponse;
  }

  if (typeof rawResponse !== "string") {
    return { raw: rawResponse };
  }

  const trimmed = rawResponse.trim();
  if (!trimmed) {
    return {};
  }

  const jsonLike = trimmed.startsWith("{") || trimmed.startsWith("[");
  if (jsonLike) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      return { raw: trimmed, parseError: error.message };
    }
  }

  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((part) => part.trim());
    const [txid, status, opid, number, amount, orderid, ...rest] = parts;
    const response = {
      txid,
      status,
      opid,
      number,
      amount,
      orderid,
      raw: trimmed,
    };
    if (rest.length > 0) {
      response.extra = rest;
    }
    return response;
  }

  return { status: trimmed, message: trimmed, raw: trimmed };
};

const extractA1TopupStatus = (payload) => {
  if (!payload || typeof payload !== "object") return "";
  const candidates = [
    payload.status,
    payload.Status,
    payload.STATUS,
    payload.message,
    payload.Message,
    payload.response,
  ];
  const status = candidates.find(
    (value) => value !== undefined && value !== null && value !== ""
  );
  return status ? status.toString() : "";
};

const isA1TopupSuccessStatus = (status) => /success/i.test(status || "");
const isA1TopupPendingStatus = (status) =>
  /(pending|inprocess|processing)/i.test(status || "");

const callA1TopupRechargeEndpoint = async (params) => {
  const legacyUrl = new URL(
    "/recharge/api",
    A1TOPUP_LEGACY_BASE_URL
  ).toString();
  const formBody = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formBody.append(key, value.toString());
    }
  });

  const proxyAgent = getRechargeProxyAgent();
  const axiosOptions = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    timeout: 10000,
  };

  if (proxyAgent) {
    axiosOptions.httpAgent = proxyAgent;
    axiosOptions.httpsAgent = proxyAgent;
    axiosOptions.proxy = false; // Disable axios default proxy handling
  }

  const response = await axios.post(
    legacyUrl,
    formBody.toString(),
    axiosOptions
  );

  return response.data;
};

const sleep = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

const isRechargePending = (recharge) => {
  if (!recharge) return false;
  const status = (recharge.status || "").toString().toLowerCase();
  return PENDING_RECHARGE_STATUSES.has(status);
};

const getRechargeAgeMs = (recharge) => {
  if (!recharge) return 0;
  const referenceDate =
    recharge.rechargeInitiatedAt ||
    recharge.paymentCompletedAt ||
    recharge.updatedAt ||
    recharge.createdAt;
  if (!referenceDate) return 0;
  return Date.now() - new Date(referenceDate).getTime();
};

const shouldPollStatusUpdates = (attemptsOverride, delayOverride) => {
  const attempts =
    typeof attemptsOverride === "number"
      ? attemptsOverride
      : RECHARGE_STATUS_POLL_ATTEMPTS;
  const delay =
    typeof delayOverride === "number"
      ? delayOverride
      : RECHARGE_STATUS_POLL_DELAY_MS;

  return Boolean(
    A1TOPUP_STATUS_ACTION &&
      A1TOPUP_STATUS_ACTION.toLowerCase() !== "disabled" &&
      attempts > 0 &&
      delay > 0
  );
};

const callA1TopupStatusEndpoint = async (orderId, mobileNumber) => {
  if (!orderId || !A1TOPUP_STATUS_ACTION) {
    return null;
  }

  const params = {
    username: A1TOPUP_USERNAME,
    pwd: A1TOPUP_PASSWORD,
    orderid: orderId,
    number: mobileNumber,
    mobile: mobileNumber,
    action: A1TOPUP_STATUS_ACTION,
    request: A1TOPUP_STATUS_ACTION,
    service: A1TOPUP_STATUS_ACTION,
  };

  return callA1TopupRechargeEndpoint(params);
};

const tryResolveRechargeAfterVendorError = async (recharge, orderId) => {
  if (
    !A1TOPUP_STATUS_ACTION ||
    A1TOPUP_STATUS_ACTION.toLowerCase() === "disabled"
  ) {
    return null;
  }

  try {
    const rawStatusResponse = await callA1TopupStatusEndpoint(
      orderId,
      recharge.mobileNumber
    );
    if (!rawStatusResponse) {
      return null;
    }

    const parsedStatusResponse =
      parseA1TopupLegacyResponse(rawStatusResponse);
    const statusOutcome = await applyProviderResponse(
      recharge,
      parsedStatusResponse,
      {
        source: "status_check_after_error",
        orderId,
      }
    );

    if (statusOutcome?.outcome === "success") {
      return true;
    }

    if (statusOutcome?.outcome === "pending") {
      return { outcome: "pending" };
    }

    return null;
  } catch (error) {
    console.error(
      "[A1Topup][StatusRecovery] Failed to verify recharge after vendor error:",
      error.response?.data || error.message
    );
    return null;
  }
};

const buildVendorErrorResult = (recharge, parsedResponse, statusText = "") => {
  const opid = parsedResponse?.opid || parsedResponse?.opId || "";
  const responseMessage = parsedResponse?.message || parsedResponse?.msg || "";
  const combinedLookup = `${opid} ${responseMessage}`.trim();

  let errorMessage = "Recharge failed";
  let errorType = "VENDOR_ERROR";

  if (/low\s*balance/i.test(combinedLookup)) {
    errorMessage =
      "Service temporarily unavailable. Our recharge service is currently experiencing high demand. Please try again in a few minutes.";
    errorType = "VENDOR_LOW_BALANCE";
  } else if (
    /parameter.*missing/i.test(combinedLookup) ||
    (/parameter/i.test(combinedLookup) && /missing/i.test(combinedLookup))
  ) {
    errorMessage =
      "Invalid request parameters. Please verify your recharge details (operator, circle, mobile number) and try again.";
    errorType = "VENDOR_INVALID_PARAMS";
  } else if (
    /minimum/i.test(combinedLookup) ||
    /amount/i.test(combinedLookup) ||
    /invalid.*amount/i.test(combinedLookup)
  ) {
    errorMessage = `Invalid recharge amount. Minimum amount is ₹10. ${
      responseMessage || opid || ""
    }`;
    errorType = "VENDOR_INVALID_AMOUNT";
  } else if (
    /operator/i.test(combinedLookup) ||
    /invalid.*operator/i.test(combinedLookup)
  ) {
    errorMessage =
      "Invalid operator code. Please verify your operator selection and try again.";
    errorType = "VENDOR_INVALID_OPERATOR";
  } else if (
    /invalid.*ip/i.test(combinedLookup) ||
    /ip.*not.*allowed/i.test(combinedLookup) ||
    /ip.*whitelist/i.test(combinedLookup)
  ) {
    errorMessage =
      "Service temporarily unavailable. Please contact support if this issue persists.";
    errorType = "VENDOR_IP_NOT_ALLOWED";
    const ipMatch = combinedLookup.match(
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/
    );
    if (ipMatch) {
      console.error(
        `[A1Topup][IP Whitelist] Server IP ${ipMatch[0]} needs to be added to A1Topup IP whitelist in vendor dashboard.`
      );
    }
  } else if (responseMessage) {
    errorMessage = responseMessage;
  } else if (statusText) {
    errorMessage = statusText;
  }

  console.error(
    `[A1Topup][Recharge][Vendor Failure]`,
    JSON.stringify(
      {
        mobileNumber: recharge?.mobileNumber,
        amount: recharge?.amount,
        orderId: recharge?.aiTopUpOrderId,
        status: statusText,
        opid,
        errorType,
        errorMessage,
        parsedResponse: {
          ...parsedResponse,
          pwd: parsedResponse?.pwd ? "***" : undefined,
          password: parsedResponse?.password ? "***" : undefined,
        },
      },
      null,
      2
    )
  );

  return {
    success: false,
    errorCode: errorType,
    message: errorMessage,
    vendorResponse: parsedResponse,
    statusText,
  };
};

const markRechargeSuccess = async (recharge, context = {}) => {
  const now = new Date();
  const reason = context.reason || "provider_success";
  recharge.status = "success";
  recharge.rechargeCompletedAt =
    recharge.rechargeCompletedAt || context.completedAt || now;
  if (context.orderId && !recharge.aiTopUpOrderId) {
    recharge.aiTopUpOrderId = context.orderId;
  }
  if (context.transactionId && !recharge.aiTopUpTransactionId) {
    recharge.aiTopUpTransactionId = context.transactionId;
  }
  if (context.providerResponse) {
    recharge.aiTopUpResponse = context.providerResponse;
    recharge.providerResponse = context.providerResponse;
  }
  if (typeof context.providerCommission === "number") {
    recharge.providerCommission = context.providerCommission;
  }
  if (typeof context.providerBalance === "number") {
    recharge.providerBalance = context.providerBalance;
  }

  await recharge.save();

  if (!recharge.commissionDistributed) {
    await distributeCommissions(recharge);
  }

  // Send email receipt
  try {
    const user = await User.findOne({ userId: recharge.userId });
    if (user && user.email) {
      await sendMobileRechargeReceipt(
        recharge.toObject(),
        {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile,
        }
      );
    }
  } catch (emailError) {
    console.error("Error sending mobile recharge receipt email:", emailError);
    // Don't fail the recharge if email fails
  }

  console.log(
    `[Recharge][AutoSuccess] ${reason} for ${recharge.mobileNumber} (₹${recharge.amount})`
  );
  return { outcome: "success", autoResolved: true };
};

const applyProviderResponse = async (
  recharge,
  parsedResponse,
  context = {}
) => {
  const statusText = extractA1TopupStatus(parsedResponse);
  const sourceLabel = context.source || "recharge";
  const contextOrderId = context.orderId;

  if (isA1TopupSuccessStatus(statusText)) {
    const providerCommission = Number(
      parsedResponse.commission ||
        parsedResponse.commision ||
        parsedResponse.providerCommission ||
        0
    );
    const providerBalance = Number(
      parsedResponse.balance ||
        parsedResponse.walletBalance ||
        parsedResponse.wallet_balance ||
        parsedResponse.providerBalance ||
        0
    );
    await markRechargeSuccess(recharge, {
      reason: `provider_${sourceLabel}`,
      orderId:
        parsedResponse.orderid ||
        parsedResponse.orderId ||
        contextOrderId ||
        recharge.aiTopUpOrderId ||
        recharge._id?.toString(),
      transactionId:
        parsedResponse.txid ||
        parsedResponse.opid ||
        recharge.aiTopUpTransactionId ||
        "",
      providerResponse: parsedResponse,
      providerCommission,
      providerBalance,
    });
    return { outcome: "success" };
  }

  if (isA1TopupPendingStatus(statusText)) {
    recharge.status = "processing";
    recharge.aiTopUpResponse = parsedResponse;
    recharge.providerResponse = parsedResponse;
    await recharge.save();
    console.log(
      `[A1Topup][Recharge] Pending status (${sourceLabel}) for ${recharge.mobileNumber}: ${statusText}`
    );
    return {
      outcome: "pending",
      vendorResponse: parsedResponse,
      statusText,
    };
  }

  return {
    outcome: "error",
    ...buildVendorErrorResult(recharge, parsedResponse, statusText),
  };
};

const pollPendingRechargeStatus = async (recharge, options = {}) => {
  const attempts =
    typeof options.attempts === "number"
      ? options.attempts
      : RECHARGE_STATUS_POLL_ATTEMPTS;
  const delay =
    typeof options.delay === "number"
      ? options.delay
      : RECHARGE_STATUS_POLL_DELAY_MS;
  const waitBeforeFirstAttempt =
    options.waitBeforeFirstAttempt ?? RECHARGE_STATUS_POLL_WAIT_FIRST;

  if (!shouldPollStatusUpdates(attempts, delay)) {
    return { outcome: "pending" };
  }

  const orderId =
    recharge.aiTopUpOrderId || recharge.orderId || recharge._id?.toString();
  if (!orderId) {
    return { outcome: "pending" };
  }

  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (attempt === 1) {
      if (waitBeforeFirstAttempt) {
        await sleep(delay);
      }
    } else {
      await sleep(delay);
    }

    try {
      const rawStatusResponse = await callA1TopupStatusEndpoint(
        orderId,
        recharge.mobileNumber
      );
      if (!rawStatusResponse) {
        continue;
      }
      const parsedStatusResponse =
        parseA1TopupLegacyResponse(rawStatusResponse);
      const outcome = await applyProviderResponse(
        recharge,
        parsedStatusResponse,
        { source: `status_poll#${attempt}`, orderId }
      );
      if (outcome.outcome === "success" || outcome.outcome === "error") {
        return outcome;
      }
    } catch (error) {
      console.error(
        `[A1Topup][Status] Poll attempt ${attempt} failed for ${recharge.mobileNumber}:`,
        error.response?.data || error.message
      );
    }
  }

  const walletFallback = await tryPromoteRechargeUsingWallet(recharge, {
    minAgeMs: Math.max(
      options.minAgeMs || 0,
      RECHARGE_WALLET_PROMOTE_MIN_AGE_MS
    ),
  });
  if (
    walletFallback.outcome === "success" ||
    walletFallback.outcome === "error"
  ) {
    return walletFallback;
  }

  return { outcome: "pending" };
};

const maybeRefreshRechargeStatus = async (recharge, options = {}) => {
  if (!isRechargePending(recharge)) {
    return;
  }

  const minAgeMs = options.minAgeMs ?? 2000;
  if (getRechargeAgeMs(recharge) < minAgeMs) {
    return;
  }

  const pollOptions = {
    attempts: options.attempts ?? 1,
    delay: options.delay ?? 2000,
    waitBeforeFirstAttempt: options.waitBeforeFirstAttempt ?? false,
    minAgeMs: options.minAgeMs,
  };

  await pollPendingRechargeStatus(recharge, pollOptions);
};

const tryPromoteRechargeUsingWallet = async (recharge, options = {}) => {
  const minAge =
    typeof options.minAgeMs === "number" && options.minAgeMs > 0
      ? options.minAgeMs
      : RECHARGE_WALLET_PROMOTE_MIN_AGE_MS;

  if (!isRechargePending(recharge)) {
    return { outcome: recharge.status === "success" ? "success" : "pending" };
  }

  if (getRechargeAgeMs(recharge) < minAge) {
    return { outcome: "pending" };
  }

  try {
    const rechargeWallet = await RechargeWallet.getOrCreateWallet(
      recharge.userId
    );
    if (!rechargeWallet || !Array.isArray(rechargeWallet.transactions)) {
      return { outcome: "pending" };
    }

    const debitRef = `RECHARGE_WALLET_${recharge._id}`;
    const refundRef = `RECHARGE_WALLET_REFUND_${recharge._id}`;
    const debitTxn = rechargeWallet.transactions.find(
      (txn) => txn?.reference === debitRef
    );
    if (!debitTxn) {
      return { outcome: "pending" };
    }
    const refundTxn = rechargeWallet.transactions.find(
      (txn) => txn?.reference === refundRef
    );
    if (refundTxn) {
      return { outcome: "pending" };
    }

    await markRechargeSuccess(recharge, {
      reason: "wallet_confirmation",
      completedAt: debitTxn.createdAt || new Date(),
    });
    return { outcome: "success", autoResolved: true };
  } catch (error) {
    console.error(
      "[Recharge][WalletPromotion] Failed to promote via wallet evidence:",
      error.message
    );
    return { outcome: "pending" };
  }
};

const refreshOldPendingRecharges = async () => {
  try {
    if (!shouldPollStatusUpdates(1, RECHARGE_STATUS_POLL_DELAY_MS)) {
      return;
    }

    const oldestPending = await Recharge.find({
      status: { $in: Array.from(PENDING_RECHARGE_STATUSES) },
      updatedAt: {
        $lt: new Date(
          Date.now() - Math.max(BACKGROUND_STATUS_REFRESH_MIN_AGE_MS, 10000)
        ),
      },
    })
      .sort({ updatedAt: 1 })
      .limit(Math.max(BACKGROUND_STATUS_REFRESH_BATCH_SIZE, 1));

    if (oldestPending.length === 0) {
      return;
    }

    await Promise.allSettled(
      oldestPending.map((recharge) =>
        pollPendingRechargeStatus(recharge, {
          attempts: 1,
          delay: RECHARGE_STATUS_POLL_DELAY_MS,
          waitBeforeFirstAttempt: false,
        })
      )
    );
  } catch (error) {
    console.error(
      "[A1Topup][Status] Background refresh failed:",
      error.message
    );
  }
};

let backgroundStatusIntervalStarted = false;
const startBackgroundStatusRefresh = () => {
  if (
    backgroundStatusIntervalStarted ||
    BACKGROUND_STATUS_REFRESH_INTERVAL_MS <= 0 ||
    !shouldPollStatusUpdates(1, RECHARGE_STATUS_POLL_DELAY_MS)
  ) {
    return;
  }

  backgroundStatusIntervalStarted = true;
  const intervalRef = setInterval(
    refreshOldPendingRecharges,
    BACKGROUND_STATUS_REFRESH_INTERVAL_MS
  );

  if (typeof intervalRef.unref === "function") {
    intervalRef.unref();
  }
};

startBackgroundStatusRefresh();

const MINIMUM_PLAN_REQUEST_AMOUNT = "10";

const LOCAL_PREPAID_PLAN_CATALOG = {
  "RELIANCE JIO": [
    {
      amount: 19,
      validity: "1 day",
      benefits: "1GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Jio 1GB/day combo plan",
    },
    {
      amount: 209,
      validity: "28 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Jio 1.5GB/day combo plan",
    },
    {
      amount: 239,
      validity: "28 days",
      benefits: "2GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Jio 2GB/day high data pack",
    },
    {
      amount: 299,
      validity: "28 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Jio 1.5GB/day high data pack",
    },
    {
      amount: 666,
      validity: "84 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Jio long-validity combo pack",
    },
  ],
  Airtel: [
    {
      amount: 265,
      validity: "28 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Airtel 1.5GB/day combo plan",
    },
    {
      amount: 299,
      validity: "28 days",
      benefits: "2GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Airtel entertainment plan",
    },
    {
      amount: 719,
      validity: "84 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Airtel long-validity combo pack",
    },
  ],
  Vodafone: [
    {
      amount: 299,
      validity: "28 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "VI 1.5GB/day combo pack",
    },
    {
      amount: 399,
      validity: "35 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "VI 35-day validity pack",
    },
    {
      amount: 799,
      validity: "56 days",
      benefits: "2GB/day data, unlimited voice calls, 100 SMS/day",
      description: "VI weekend rollover plan",
    },
  ],
  Idea: [
    {
      amount: 299,
      validity: "28 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Idea 1.5GB/day combo pack",
    },
    {
      amount: 359,
      validity: "28 days",
      benefits: "3GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Idea high-data pack",
    },
    {
      amount: 719,
      validity: "84 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Idea long-validity combo pack",
    },
  ],
  "BSNL TOPUP": [
    {
      amount: 247,
      validity: "30 days",
      benefits: "2GB/day data, unlimited voice calls, 100 SMS/day",
      description: "BSNL STV combo plan",
    },
    {
      amount: 347,
      validity: "56 days",
      benefits: "2GB/day data, unlimited voice calls, 100 SMS/day",
      description: "BSNL data-centric pack",
    },
    {
      amount: 447,
      validity: "60 days",
      benefits: "100GB total data, unlimited voice calls, 100 SMS/day",
      description: "BSNL work-from-home pack",
    },
  ],
};

const LOCAL_POSTPAID_PLAN_CATALOG = {
  "RELIANCE JIO": [
    {
      amount: 19,
      validity: "1 day",
      benefits: "1GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Jio 1GB/day combo plan",
    },
    {
      amount: 209,
      validity: "28 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Jio 1.5GB/day combo plan",
    },
    {
      amount: 239,
      validity: "28 days",
      benefits: "2GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Jio 2GB/day high data pack",
    },
    {
      amount: 299,
      validity: "28 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Jio 1.5GB/day high data pack",
    },
    {
      amount: 666,
      validity: "84 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Jio long-validity combo pack",
    },
  ],
  Airtel: [
    {
      amount: 265,
      validity: "28 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Airtel 1.5GB/day combo plan",
    },
    {
      amount: 299,
      validity: "28 days",
      benefits: "2GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Airtel entertainment plan",
    },
    {
      amount: 719,
      validity: "84 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Airtel long-validity combo pack",
    },
  ],
  Vodafone: [
    {
      amount: 299,
      validity: "28 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "VI 1.5GB/day combo pack",
    },
    {
      amount: 399,
      validity: "35 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "VI 35-day validity pack",
    },
    {
      amount: 799,
      validity: "56 days",
      benefits: "2GB/day data, unlimited voice calls, 100 SMS/day",
      description: "VI weekend rollover plan",
    },
  ],
  Idea: [
    {
      amount: 299,
      validity: "28 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Idea 1.5GB/day combo pack",
    },
    {
      amount: 359,
      validity: "28 days",
      benefits: "3GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Idea high-data pack",
    },
    {
      amount: 719,
      validity: "84 days",
      benefits: "1.5GB/day data, unlimited voice calls, 100 SMS/day",
      description: "Idea long-validity combo pack",
    },
  ],
  "BSNL TOPUP": [
    {
      amount: 247,
      validity: "30 days",
      benefits: "2GB/day data, unlimited voice calls, 100 SMS/day",
      description: "BSNL STV combo plan",
    },
    {
      amount: 347,
      validity: "56 days",
      benefits: "2GB/day data, unlimited voice calls, 100 SMS/day",
      description: "BSNL data-centric pack",
    },
    {
      amount: 447,
      validity: "60 days",
      benefits: "100GB total data, unlimited voice calls, 100 SMS/day",
      description: "BSNL work-from-home pack",
    },
  ],
};

const getLocalPlansForOperator = (operator) => {
  if (!operator) return [];
  return LOCAL_PREPAID_PLAN_CATALOG[operator.toString().trim()] || [];
};

const getLocalPostpaidPlansForOperator = (operator) => {
  if (!operator) return [];
  return LOCAL_POSTPAID_PLAN_CATALOG[operator.toString().trim()] || [];
};

// ==================== Helper Functions ====================

/**
 * Operator code mapping for aiTopUp API
 * Separated into PREPAID and POSTPAID for clarity
 */

// PREPAID OPERATORS - Only for prepaid recharges
export const PREPAID_OPERATORS = {
  Airtel: { code: "A", apiCode: "AIRTEL", type: "prepaid" },
  Vodafone: { code: "V", apiCode: "VI", type: "prepaid" },
  "BSNL TOPUP": { code: "BT", apiCode: "BSNL", type: "prepaid" },
  "RELIANCE JIO": { code: "RC", apiCode: "JIO", type: "prepaid" },
  Idea: { code: "I", apiCode: "IDEA", type: "prepaid" },
  "BSNL STV": { code: "BR", apiCode: "BSNL", type: "prepaid" },
};

// POSTPAID OPERATORS - Only for postpaid bill payments
// Operator codes as per A1Topup API documentation
export const POSTPAID_OPERATORS = {
  "Airtel Postpaid": { code: "PAT", apiCode: "AIRTEL", type: "postpaid" },
  "Idea Postpaid": { code: "IP", apiCode: "IDEA", type: "postpaid" },
  "Vodafone Postpaid": { code: "VP", apiCode: "VI", type: "postpaid" },
  "JIO PostPaid": { code: "JPP", apiCode: "JIO", type: "postpaid" },
  "BSNL Postpaid": { code: "BP", apiCode: "BSNL", type: "postpaid" }, // Updated to "BP" as per API docs
};

// Combined mapping for backward compatibility
export const OPERATOR_CODES = {
  ...PREPAID_OPERATORS,
  ...POSTPAID_OPERATORS,
};

const getOperatorDetails = (operator) => OPERATOR_CODES[operator] || {};

const getOperatorApiCode = (operator, fallbackCode = "") => {
  const info = getOperatorDetails(operator);
  return info.apiCode || info.code || fallbackCode || operator;
};

/**
 * Calculate admin and user commission based on operator and amount
 * Commission rates:
 * - Jio: user 0%, admin 0.65%
 * - Airtel: user 0.5%, admin 2%
 * - Vodafone: user 1%, admin 3%
 * - Idea: user 1%, admin 3%
 * - BSNL: user 1%, admin 4%
 */
export const calculateCommissions = (operator, amount) => {
  // Admin commission rates
  const adminRates = {
    "RELIANCE JIO": 0.65,
    "JIO PostPaid": 0.65,
    Airtel: 2.0,
    "Airtel Postpaid": 2.0,
    Vodafone: 3.0,
    "Vodafone Postpaid": 3.0,
    Idea: 3.0,
    "Idea Postpaid": 3.0,
    "BSNL TOPUP": 4.0,
    "BSNL STV": 4.0,
    "BSNL Postpaid": 4.0,
  };

  // User commission rates
  const userRates = {
    "RELIANCE JIO": 0,
    "JIO PostPaid": 0,
    Airtel: 0.5,
    "Airtel Postpaid": 0.5,
    Vodafone: 1.0,
    "Vodafone Postpaid": 1.0,
    Idea: 1.0,
    "Idea Postpaid": 1.0,
    "BSNL TOPUP": 1.0,
    "BSNL STV": 1.0,
    "BSNL Postpaid": 1.0,
  };

  const adminRate = adminRates[operator] || 0.65;
  const userRate = userRates[operator] || 0;

  const adminCommission = (amount * adminRate) / 100;
  const userCommission = (amount * userRate) / 100;

  return {
    adminCommission: Math.round(adminCommission * 100) / 100,
    adminPercentage: adminRate,
    userCommission: Math.round(userCommission * 100) / 100,
    userPercentage: userRate,
  };
};

/**
 * Distribute commissions to admin and user wallets
 */
const distributeCommissions = async (recharge) => {
  try {
    // Distribute admin commission
    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser && recharge.adminCommission > 0) {
      let adminWallet = await Wallet.findOne({ userId: adminUser.userId });
      if (!adminWallet) {
        adminWallet = new Wallet({
          userId: adminUser.userId,
          balance: 0,
          totalEarned: 0,
        });
      }

      adminWallet.balance += recharge.adminCommission;
      adminWallet.totalEarned += recharge.adminCommission;
      adminWallet.passiveIncome += recharge.adminCommission;

      adminWallet.transactions.push({
        type: "commission",
        amount: recharge.adminCommission,
        description: `Recharge commission from ${recharge.mobileNumber} (${recharge.operator}) - ₹${recharge.amount}`,
        status: "completed",
        reference: `RECHARGE_ADMIN_COMM_${recharge._id}`,
        incomeType: "recharge_commission",
        createdAt: new Date(),
      });

      await adminWallet.save();
      console.log(
        `✅ Admin commission distributed: ₹${recharge.adminCommission}`
      );
    }

    // If discount was applied upfront, skip user commission distribution
    if (recharge.discountApplied) {
      recharge.commissionDistributed = true;
      await recharge.save();
      return true;
    }

    // Distribute user commission
    if (recharge.userCommission > 0) {
      let userWallet = await Wallet.findOne({ userId: recharge.userId });
      if (!userWallet) {
        userWallet = new Wallet({
          userId: recharge.userId,
          balance: 0,
          totalEarned: 0,
        });
      }

      userWallet.balance += recharge.userCommission;
      userWallet.totalEarned += recharge.userCommission;
      userWallet.activeIncome += recharge.userCommission;

      userWallet.transactions.push({
        type: "commission",
        amount: recharge.userCommission,
        description: `Recharge commission from your recharge - ₹${recharge.amount} (${recharge.operator})`,
        status: "completed",
        reference: `RECHARGE_USER_COMM_${recharge._id}`,
        incomeType: "recharge_commission",
        createdAt: new Date(),
      });

      await userWallet.save();
      console.log(
        `✅ User commission distributed: ₹${recharge.userCommission}`
      );
    }

    recharge.commissionDistributed = true;
    await recharge.save();

    return true;
  } catch (error) {
    console.error("Error distributing commissions:", error);
    return false;
  }
};

// ==================== API Endpoints ====================

/**
 * Fetch recharge plans from aiTopUp API
 * Note: If vendor account does not support plan-fetch endpoint, this falls back to local plans
 * Deprecated plan-fetch endpoint calls have been removed - using local catalog instead
 */
export const fetchRechargePlans = async (req, res) => {
  try {
    const {
      mobileNumber,
      operator,
      circle,
      rechargeType = "prepaid",
    } = req.query;

    // Note: A1Topup plan-fetch endpoint may not be supported by all vendor accounts
    // We use local plan catalog as fallback to ensure reliability
    if (!A1TOPUP_USERNAME || !A1TOPUP_PASSWORD) {
      return res.status(200).json({
        success: true,
        data: [],
        message:
          "Plans are not available from the provider API. Please enter the amount manually.",
      });
    }

    if (!mobileNumber || !operator || !circle) {
      return res.status(400).json({
        success: false,
        message: "Mobile number, operator, and circle are required",
      });
    }

    // Get operator code from operator name - Only allow PREPAID operators
    const operatorInfo = PREPAID_OPERATORS[operator];
    if (!operatorInfo) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid prepaid operator selected. Please select a prepaid operator.",
      });
    }

    const plansFromProvider = getLocalPlansForOperator(operator);

    if (plansFromProvider.length > 0) {
                    return res.status(200).json({
                      success: true,
        data: plansFromProvider,
                      message:
          "Plans are served from the local catalog. Please select an amount to continue.",
        source: "local_catalog",
      });
    }

                  return res.status(200).json({
      success: false,
        data: [],
        message:
        "Plans are not available. Please enter the recharge amount manually.",
      source: "manual_entry",
    });
  } catch (error) {
    console.error(
      "Error fetching recharge plans:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recharge plans",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Detect circle from mobile number and operator
 * Uses A1Topup API to detect the circle automatically
 */
export const detectCircle = async (req, res) => {
  try {
    return res.status(200).json({
      success: false,
      message:
        "Circle detection by provider has been disabled. Please select your circle manually.",
      circle: null,
    });
  } catch (error) {
    console.error("Circle detection disabled. Request details:", error.message);
    return res.status(500).json({
      success: false,
        message:
        "Circle detection is disabled. Please select your circle manually before proceeding.",
    });
  }
};

/**
 * Initiate recharge - Create payment request
 */
export const initiateRecharge = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      mobileNumber,
      operator,
      circle,
      amount,
      rechargeType = "prepaid",
      planId = "",
      planDescription = "",
      paymentMethod = "wallet",
      billDetails = {},
    } = req.body;

    // Only wallet payment is supported
    if (paymentMethod !== "wallet") {
      return res.status(400).json({
        success: false,
        message:
          "Only wallet payment is supported. Please use wallet payment method.",
        error: "INVALID_PAYMENT_METHOD",
      });
    }

    // Validate basic fields first
    if (!mobileNumber || !operator || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "All required fields must be provided and amount must be greater than 0",
      });
    }

    // Validate mobile number format (10 digits, starts with 6-9)
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid mobile number format. Must be 10 digits starting with 6-9.",
      });
    }

    // Validate minimum amount (₹10) as per A1Topup API requirements
    const MINIMUM_RECHARGE_AMOUNT = 10;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < MINIMUM_RECHARGE_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Minimum recharge amount is ₹${MINIMUM_RECHARGE_AMOUNT}. Please enter a valid amount.`,
        error: "INVALID_AMOUNT",
      });
    }

    // Get operator code and type
    // First determine recharge type, then validate operator
    let actualRechargeType = rechargeType;
    
    // Try to determine type from operator name if not explicitly set
    if (!actualRechargeType && operator) {
      if (operator.toLowerCase().includes("postpaid")) {
        actualRechargeType = "postpaid";
      } else {
        actualRechargeType = "prepaid";
      }
    }
    
    // Now check if circle is required (only for prepaid)
    const requiresCircle = actualRechargeType !== "postpaid";
    if (requiresCircle && !circle) {
      return res.status(400).json({
        success: false,
        message: "Circle is required for prepaid recharges",
        error: "CIRCLE_REQUIRED",
      });
    }
    
    // Validate operator based on recharge type
    let operatorInfo;
    if (actualRechargeType === "postpaid") {
      operatorInfo = POSTPAID_OPERATORS[operator];
      if (!operatorInfo || !operatorInfo.code) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid postpaid operator selected. Please select a valid postpaid operator.",
          error: "INVALID_OPERATOR",
        });
      }
    } else {
      operatorInfo = PREPAID_OPERATORS[operator];
      if (!operatorInfo || !operatorInfo.code) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid prepaid operator selected. Please select a valid prepaid operator.",
          error: "INVALID_OPERATOR",
        });
      }
    }

    // Sanitize and log request parameters (for debugging, without sensitive data)
    console.log(
      `[Recharge][Initiate][Request]`,
      JSON.stringify(
        {
          userId: userId.substring(0, 8) + "***", // Partially mask userId
          mobileNumber: mobileNumber,
          operator: operator,
          operatorCode: operatorInfo.code,
          amount: numericAmount,
          rechargeType: actualRechargeType,
          circle: circle || "not_provided",
          paymentMethod: paymentMethod,
        },
        null,
        2
      )
    );

    // Determine if user currently holds any paid package (active member)
    const isActiveMember = await checkActiveMemberStatus(userId);

    // Use operator type from operatorInfo if available
    actualRechargeType = operatorInfo.type || actualRechargeType;
    const normalizedCircle =
      actualRechargeType === "postpaid" ? circle || "NA" : circle;

    // Calculate commissions
    const commissionData = calculateCommissions(operator, parseFloat(amount));

    const originalAmount = Math.round(parseFloat(amount) * 100) / 100;
    const eligibleUserCommission = isActiveMember
      ? commissionData.userCommission
      : 0;
    const eligibleUserPercentage = isActiveMember
      ? commissionData.userPercentage
      : 0;
    const calculatedDiscount =
      eligibleUserCommission > 0
        ? Math.round(eligibleUserCommission * 100) / 100
        : 0;
    const discountAmount = Math.min(calculatedDiscount, originalAmount);
    const discountPercentage =
      discountAmount > 0 ? eligibleUserPercentage : 0;
    const netAmount = Math.max(
      Math.round((originalAmount - discountAmount) * 100) / 100,
      0
    );
    const discountApplied = isActiveMember && discountAmount > 0;
    const pendingUserCommission = discountApplied ? 0 : eligibleUserCommission;
    const pendingUserCommissionPercentage = discountApplied
      ? 0
      : eligibleUserPercentage;

    // Create recharge record
    const recharge = new Recharge({
      userId,
      mobileNumber,
      operator,
      operatorCode: operatorInfo.code,
      circle: normalizedCircle,
      rechargeType: actualRechargeType,
      amount: originalAmount,
      netAmount,
      discountAmount,
      discountPercentage,
      discountApplied,
      activeMemberSnapshot: isActiveMember,
      planId,
      planDescription,
      paymentMethod,
      status: "pending",
      adminCommission: commissionData.adminCommission,
      adminCommissionPercentage: commissionData.adminPercentage,
      userCommission: pendingUserCommission,
      userCommissionPercentage: pendingUserCommissionPercentage,
      paymentInitiatedAt: new Date(),
      operatorApiCode: operatorInfo.apiCode || operatorInfo.code || operator,
      billDetails,
      billFetchedAt:
        billDetails && Object.keys(billDetails).length > 0
          ? new Date()
          : undefined,
    });

    recharge.aiTopUpOrderId =
      recharge.aiTopUpOrderId ||
      `ORD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    await recharge.save();

    // If paying from wallet (manual mode)
    // Use RechargeWallet (separate from main wallet - no active/passive income)
    if (paymentMethod === "wallet") {
      const rechargeWallet = await RechargeWallet.getOrCreateWallet(userId);
      if (!rechargeWallet || (rechargeWallet.balance || 0) < netAmount) {
        recharge.status = "failed";
        recharge.failureReason = "Insufficient recharge wallet balance";
        await recharge.save();
        return res.status(400).json({
          success: false,
          message:
            "Insufficient recharge wallet balance. Please add money to your recharge wallet.",
        });
      }

      // Deduct from recharge wallet (separate from main wallet)
      const roundedAmount = Math.round(netAmount * 100) / 100;
      rechargeWallet.balance =
        Math.round((rechargeWallet.balance - roundedAmount) * 100) / 100;
      rechargeWallet.totalSpent =
        Math.round((rechargeWallet.totalSpent + roundedAmount) * 100) / 100;
      rechargeWallet.transactions.push({
        type: "recharge_payment",
        amount: roundedAmount,
        description:
          discountAmount > 0
            ? `Recharge payment for ${mobileNumber} (${operator}) - ₹${originalAmount.toFixed(
                2
              )} (-₹${discountAmount.toFixed(
                2
              )} discount, ${discountPercentage}% off)`
            : `Recharge payment for ${mobileNumber} (${operator})`,
        status: "completed",
        reference: `RECHARGE_WALLET_${recharge._id}`,
        rechargeId: recharge._id,
        createdAt: new Date(),
      });
      await rechargeWallet.save();

      // Mark as paid and process recharge with provider
      recharge.status = "payment_success";
      recharge.paymentCompletedAt = new Date();
      recharge.paymentMethod = "wallet";
      await recharge.save();

      const rechargeResult = await processRechargeWithA1Topup(recharge);

      // Check if processRechargeWithA1Topup returned an error object
      if (rechargeResult && rechargeResult.success === false) {
        // Refund recharge wallet on provider failure (separate from main wallet)
        const refundWallet = await RechargeWallet.getOrCreateWallet(userId);
        if (refundWallet) {
          refundWallet.balance =
            Math.round((refundWallet.balance + roundedAmount) * 100) / 100;
          refundWallet.totalRefunded =
            Math.round((refundWallet.totalRefunded + roundedAmount) * 100) /
            100;
          refundWallet.totalSpent = Math.max(
            0,
            Math.round((refundWallet.totalSpent - roundedAmount) * 100) / 100
          );
          refundWallet.transactions.push({
            type: "recharge_refund",
            amount: roundedAmount,
            description: `Refund for failed recharge ${mobileNumber} (${operator})`,
            status: "completed",
            reference: `RECHARGE_WALLET_REFUND_${recharge._id}`,
            rechargeId: recharge._id,
            createdAt: new Date(),
          });
          await refundWallet.save();
        }

        await handleFailedRecharge(
          recharge,
          rechargeResult.message || "Provider recharge failed"
        );

        // Return 400 for vendor errors (business errors), not 500 (server errors)
        return res.status(400).json({
          success: false,
          message: rechargeResult.message || "Recharge failed",
          error: rechargeResult.errorCode || "VENDOR_ERROR",
          vendorResponse: rechargeResult.vendorResponse || null,
        });
      }

      // Success case
      return res.status(200).json({
        success: true,
        message: "Recharge initiated successfully",
        data: {
          rechargeId: recharge._id,
          status: recharge.status,
          originalAmount,
          discountAmount,
          netAmount: roundedAmount,
          discountApplied,
        },
      });
    }

    // If we reach here, payment method is not wallet (shouldn't happen due to validation above)
      return res.status(400).json({
        success: false,
      message: "Only wallet payment is supported",
      error: "INVALID_PAYMENT_METHOD",
      });
  } catch (error) {
    console.error(
      "Error initiating recharge:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      success: false,
      message: "Failed to initiate recharge",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Process recharge with aiTopUp API
 * For postpaid: tries both REST API and legacy API sequentially
 * For prepaid: uses REST API (working)
 */
const processRechargeWithA1Topup = async (recharge) => {
  try {
    recharge.status = "processing";
    recharge.rechargeInitiatedAt = new Date();
    await recharge.save();

    const operatorDirectory =
      recharge.rechargeType === "postpaid"
      ? POSTPAID_OPERATORS
      : PREPAID_OPERATORS;
    const operatorInfo = operatorDirectory[recharge.operator] || {};
    const operatorCode = operatorInfo.code || recharge.operatorCode || null;
    const operatorApiCode =
      operatorInfo.apiCode ||
      recharge.operatorApiCode ||
      operatorInfo.code ||
      recharge.operatorCode ||
      recharge.operator;

    if (!A1TOPUP_USERNAME || !A1TOPUP_PASSWORD) {
      throw new Error("A1Topup credentials are not configured");
    }

    if (!operatorCode) {
      throw new Error("Operator code is required for provider recharge");
    }

    if (!recharge.mobileNumber || !/^[6-9]\d{9}$/.test(recharge.mobileNumber)) {
      throw new Error("Valid mobile number is required");
    }

    const numericAmount = Number(recharge.amount);
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error("Valid recharge amount is required");
    }

    // Validate minimum amount (₹10) as per A1Topup API requirements
    const MINIMUM_RECHARGE_AMOUNT = 10;
    if (numericAmount < MINIMUM_RECHARGE_AMOUNT) {
      throw new Error(
        `Minimum recharge amount is ₹${MINIMUM_RECHARGE_AMOUNT}. Please enter a valid amount.`
      );
    }

    // Resolve circle parameter - prioritize numeric code, only send if properly mapped
    const resolveCircleParam = (value) => {
      if (!value) return undefined;

      // First try to get numeric code
      const numeric =
        resolveCircleNumericCode(value) ||
        resolveCircleNumericCode(resolveCircleCode(value));

      // Only return numeric code if found (as per API requirement)
      if (numeric && /^\d+$/.test(numeric.toString())) {
        return numeric;
      }

      // If numeric code not found, don't send circlecode (fallback to API auto-detection)
      return undefined;
    };

    // Prioritize circleNumeric if explicitly provided (from frontend)
    // Then try circleCode, then circle, then circleLabel
    const circleParam =
      recharge.circleNumeric && /^\d+$/.test(recharge.circleNumeric.toString())
        ? recharge.circleNumeric.toString()
        : resolveCircleParam(recharge.circleCode) ||
          resolveCircleParam(recharge.circle) ||
          resolveCircleParam(recharge.circleLabel);

    const orderId =
      recharge.aiTopUpOrderId ||
      `ORD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    recharge.aiTopUpOrderId = orderId;

    // Build params as per A1Topup official API: username, pwd, operatorcode, number, amount, orderid, format
    // circlecode only if we have a valid numeric mapping
      const params = {
        username: A1TOPUP_USERNAME,
        pwd: A1TOPUP_PASSWORD,
      operatorcode: operatorCode,
      operator: operatorApiCode || operatorCode,
        number: recharge.mobileNumber,
      amount: numericAmount.toString(),
        orderid: orderId,
        format: "json",
      type:
        recharge.rechargeType &&
        recharge.rechargeType.toLowerCase() === "postpaid"
          ? "postpaid"
          : "prepaid",
      category:
        recharge.rechargeType &&
        recharge.rechargeType.toLowerCase() === "postpaid"
          ? "postpaid"
          : "prepaid",
    };

    if (A1TOPUP_RECHARGE_ACTION) {
      params.action = A1TOPUP_RECHARGE_ACTION;
      params.request = A1TOPUP_RECHARGE_ACTION;
      params.service = A1TOPUP_RECHARGE_ACTION;
    }

    // Only add circlecode if we have a valid numeric code (as per API requirement)
    if (circleParam && /^\d+$/.test(circleParam.toString())) {
      params.circlecode = circleParam.toString();
    }

    if (operatorApiCode && operatorApiCode !== operatorCode) {
      params.operator = operatorApiCode;
    }

    const billDetails = recharge.billDetails || {};
    const value1Candidates = [
      billDetails.value1,
      billDetails.stdCode,
      billDetails.stdcode,
      billDetails.billingUnit,
      billDetails.billGroup,
      billDetails.groupNumber,
      billDetails.cycle,
      billDetails.cycleNumber,
      billDetails.dob,
    ];
    const value2Candidates = [
      billDetails.value2,
      billDetails.accountNumber,
      billDetails.account_no,
      billDetails.processingCycle,
      billDetails.policyNumber,
    ];

    const value1 = value1Candidates.find(
      (candidate) =>
        candidate !== undefined && candidate !== null && candidate !== ""
    );
    const value2 = value2Candidates.find(
      (candidate) =>
        candidate !== undefined && candidate !== null && candidate !== ""
    );

    if (value1) {
      params.value1 = value1;
    }
    if (value2) {
      params.value2 = value2;
    }
    if (billDetails.value3) {
      params.value3 = billDetails.value3;
    }

    // Sanitize and log all parameters (hide sensitive data)
    const sanitizedParams = {
      ...params,
      pwd: "***", // Never log password
      username: params.username
        ? `${params.username.substring(0, 3)}***`
        : undefined, // Partially mask username
    };

    console.log(
      `[A1Topup][Recharge][Request]`,
      JSON.stringify(
        {
          url: new URL("/recharge/api", A1TOPUP_LEGACY_BASE_URL).toString(),
          params: sanitizedParams,
          mobileNumber: recharge.mobileNumber,
          operator: recharge.operator,
          operatorCode: operatorCode,
          amount: numericAmount,
          orderId: orderId,
          circleParam: circleParam || "not_provided",
          rechargeType: recharge.rechargeType,
        },
        null,
        2
      )
    );

    const rawProviderResponse = await callA1TopupRechargeEndpoint(params);
    const parsedResponse = parseA1TopupLegacyResponse(rawProviderResponse);
    const outcome = await applyProviderResponse(recharge, parsedResponse, {
      source: "initial",
      orderId,
    });

    if (outcome.outcome === "success") {
      return true;
    }

    if (outcome.outcome === "error") {
      const statusRecovery = await tryResolveRechargeAfterVendorError(
        recharge,
        orderId
      );

      if (statusRecovery === true) {
        return true;
      }

      if (statusRecovery?.outcome === "pending") {
        const recoveryPollOutcome = await pollPendingRechargeStatus(recharge);
        if (recoveryPollOutcome.outcome === "success") {
          return true;
        }
        if (recoveryPollOutcome.outcome === "error") {
          return {
            success: false,
            errorCode: recoveryPollOutcome.errorCode,
            message: recoveryPollOutcome.message,
            vendorResponse: recoveryPollOutcome.vendorResponse,
          };
        }
      }

      return {
        success: false,
        errorCode: outcome.errorCode,
        message: outcome.message,
        vendorResponse: outcome.vendorResponse,
      };
    }

    const pollOutcome = await pollPendingRechargeStatus(recharge);
    if (pollOutcome.outcome === "success") {
      return true;
    }
    if (pollOutcome.outcome === "error") {
      return {
        success: false,
        errorCode: pollOutcome.errorCode,
        message: pollOutcome.message,
        vendorResponse: pollOutcome.vendorResponse,
      };
    }

    return true;
  } catch (error) {
    console.error(
      "A1Topup recharge error:",
      error.response?.data || error.message
    );
    const providerError = error.response?.data;
    const errorMessage =
      providerError?.message ||
      providerError?.error_code ||
      error.message ||
      "Recharge failed";

    // Return error object for network/API errors
    return {
      success: false,
      errorCode: "VENDOR_API_ERROR",
      message: errorMessage,
      vendorResponse: providerError || null,
    };
  }
};

/**
 * Handle failed recharge and initiate refund
 */
const handleFailedRecharge = async (recharge, reason) => {
  try {
    recharge.status = "failed";
    recharge.failureReason = reason;
    recharge.rechargeCompletedAt = new Date();
    await recharge.save();

    // Note: Refunds for wallet payments are handled in initiateRecharge
    // This function just marks the recharge as failed
      console.log(
      `❌ Recharge failed: ₹${recharge.amount} for ${recharge.mobileNumber} - ${reason}`
      );
  } catch (error) {
    console.error(
      "Error handling failed recharge:",
      error.response?.data || error.message
    );
    recharge.adminNotes = `Failed to update recharge status: ${error.message}`;
    await recharge.save();
  }
};

/**
 * Check recharge status
 */
export const checkRechargeStatus = async (req, res) => {
  try {
    const { rechargeId } = req.params;
    const userId = req.user.userId;

    const recharge = await Recharge.findOne({
      _id: rechargeId,
      userId: userId,
    });

    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: "Recharge transaction not found",
      });
    }

    try {
      await maybeRefreshRechargeStatus(recharge, {
        minAgeMs: 3000,
        attempts: 1,
        delay: 1500,
        waitBeforeFirstAttempt: false,
      });
    } catch (statusError) {
      console.error(
        "[Recharge][Status Check] Failed to refresh status:",
        statusError.message
      );
    }

    return res.status(200).json({
      success: true,
      data: recharge,
    });
  } catch (error) {
    console.error("Error checking recharge status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check recharge status",
    });
  }
};

/**
 * Get user recharge history
 */
export const getRechargeHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { userId };
    if (status && status !== "all") {
      query.status = status;
    }

    const recharges = await Recharge.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const pendingRefreshTargets = recharges
      .filter((recharge) => isRechargePending(recharge))
      .filter((recharge) => getRechargeAgeMs(recharge) > 5000)
      .slice(0, 3);

    if (pendingRefreshTargets.length > 0) {
      await Promise.allSettled(
        pendingRefreshTargets.map((recharge) =>
          maybeRefreshRechargeStatus(recharge, {
            minAgeMs: 5000,
            attempts: 1,
            delay: 1500,
            waitBeforeFirstAttempt: false,
          })
        )
      );
    }

    const total = await Recharge.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        recharges,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          totalRecords: total,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching recharge history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recharge history",
    });
  }
};

export const getRechargeWalletTransactions = async (req, res) => {
  try {
    const { userId } = req.user;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 200);
    const type = (req.query.type || "all").toLowerCase();

    const rechargeWallet = await RechargeWallet.getOrCreateWallet(userId);
    const transactionsList = Array.isArray(rechargeWallet.transactions)
      ? [...rechargeWallet.transactions]
      : [];

    transactionsList.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    let filteredTransactions = transactionsList;
    if (type === "payments") {
      filteredTransactions = transactionsList.filter(
        (txn) => txn.type === "recharge_payment"
      );
    } else if (type === "topups") {
      filteredTransactions = transactionsList.filter(
        (txn) => txn.type === "topup"
      );
    } else if (type === "refunds") {
      filteredTransactions = transactionsList.filter(
        (txn) => txn.type === "recharge_refund"
      );
    }

    const totalTransactions = filteredTransactions.length;
    const totalPages = Math.max(Math.ceil(totalTransactions / limit), 1);
    const startIndex = (page - 1) * limit;
    const paginatedTransactions = filteredTransactions.slice(
      startIndex,
      startIndex + limit
    );

    return res.status(200).json({
      success: true,
      balance: rechargeWallet.balance,
      totalAdded: rechargeWallet.totalAdded,
      totalSpent: rechargeWallet.totalSpent,
      totalRefunded: rechargeWallet.totalRefunded,
      transactions: paginatedTransactions,
      page,
      totalPages,
      totalTransactions,
    });
  } catch (error) {
    console.error("Error fetching recharge wallet transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recharge wallet transactions",
      error: error.message,
    });
  }
};

// ==================== Admin Endpoints ====================

/**
 * Admin: Get all recharge transactions
 */
export const getAllRecharges = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      operator,
      startDate,
      endDate,
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (operator && operator !== "all") {
      query.operator = operator;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const recharges = await Recharge.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const adminRefreshTargets = recharges
      .filter((recharge) => isRechargePending(recharge))
      .filter((recharge) => getRechargeAgeMs(recharge) > 7000)
      .slice(0, 5);

    if (adminRefreshTargets.length > 0) {
      await Promise.allSettled(
        adminRefreshTargets.map((recharge) =>
          maybeRefreshRechargeStatus(recharge, {
            minAgeMs: 7000,
            attempts: 1,
            delay: 2000,
            waitBeforeFirstAttempt: false,
          })
        )
      );
    }

    // Get user details separately since userId is a string, not ObjectId
    const userIds = [...new Set(recharges.map((r) => r.userId))];
    const users = await User.find({ userId: { $in: userIds } });
    const userMap = users.reduce((map, user) => {
      map[user.userId] = user;
      return map;
    }, {});

    // Attach user data to recharges
    const rechargesWithUsers = recharges.map((recharge) => {
      const rechargeObj = recharge.toObject();
      return {
        ...rechargeObj,
        user: userMap[recharge.userId] || null,
      };
    });

    const total = await Recharge.countDocuments(query);

    // Calculate stats
    const totalRevenue = await Recharge.aggregate([
      { $match: { ...query, status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalCommission = await Recharge.aggregate([
      { $match: { ...query, status: "success" } }, // Removed commissionDistributed: true to include all successful recharges
      { $group: { _id: null, total: { $sum: "$adminCommission" } } },
    ]);

    const providerCommissionAgg = await Recharge.aggregate([
      { $match: { ...query, status: "success" } },
      { $group: { _id: null, total: { $sum: "$providerCommission" } } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        recharges: rechargesWithUsers,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          totalRecords: total,
        },
        stats: {
          totalRevenue: totalRevenue[0]?.total || 0,
          totalCommission: totalCommission[0]?.total || 0,
          providerCommission: providerCommissionAgg[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching all recharges:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recharge transactions",
    });
  }
};

/**
 * Admin: Get recharge statistics
 */
export const getRechargeStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const [
      totalTransactions,
      successfulRecharges,
      failedRecharges,
      totalRevenue,
      totalCommission,
      providerCommission,
      operatorStats,
    ] = await Promise.all([
      Recharge.countDocuments(dateQuery),
      Recharge.countDocuments({ ...dateQuery, status: "success" }),
      Recharge.countDocuments({ ...dateQuery, status: "failed" }),
      Recharge.aggregate([
        { $match: { ...dateQuery, status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Recharge.aggregate([
        {
          $match: {
            ...dateQuery,
            status: "success",
            // Removed commissionDistributed: true to include all successful recharges
            // Total commission should reflect all admin commissions from successful recharges
          },
        },
        { $group: { _id: null, total: { $sum: "$adminCommission" } } },
      ]),
      Recharge.aggregate([
        { $match: { ...dateQuery, status: "success" } },
        { $group: { _id: null, total: { $sum: "$providerCommission" } } },
      ]),
      Recharge.aggregate([
        { $match: { ...dateQuery, status: "success" } },
        {
          $group: {
            _id: "$operator",
            count: { $sum: 1 },
            revenue: { $sum: "$amount" },
            commission: { $sum: "$adminCommission" },
            providerCommission: { $sum: "$providerCommission" },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalTransactions,
        successfulRecharges,
        failedRecharges,
        pendingRecharges:
          totalTransactions - successfulRecharges - failedRecharges,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalCommission: totalCommission[0]?.total || 0,
        providerCommission: providerCommission[0]?.total || 0,
        operatorStats,
      },
    });
  } catch (error) {
    console.error("Error fetching recharge stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recharge statistics",
    });
  }
};

/**
 * Admin: Update recharge record
 */
export const updateRecharge = async (req, res) => {
  try {
    const { rechargeId } = req.params;
    const updateData = req.body;

    const recharge = await Recharge.findById(rechargeId);
    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: "Recharge record not found",
      });
    }

    // Recalculate commissions if amount or operator changed
    if (updateData.amount || updateData.operator) {
      const operator = updateData.operator || recharge.operator;
      const amount = parseFloat(updateData.amount || recharge.amount);
      const commissionData = calculateCommissions(operator, amount);

      updateData.adminCommission = commissionData.adminCommission;
      updateData.adminCommissionPercentage = commissionData.adminPercentage;
      updateData.userCommission = commissionData.userCommission;
      updateData.userCommissionPercentage = commissionData.userPercentage;

      // If operator changed, update operatorCode
      if (updateData.operator) {
        // Get operator info based on recharge type
        const rechargeType = updateData.rechargeType || recharge.rechargeType;
        const operatorInfo =
          rechargeType === "postpaid"
          ? POSTPAID_OPERATORS[updateData.operator]
          : PREPAID_OPERATORS[updateData.operator];
        if (operatorInfo) {
          updateData.operatorCode = operatorInfo.code;
          updateData.operatorApiCode =
            operatorInfo.apiCode || operatorInfo.code;
          updateData.rechargeType = operatorInfo.type || recharge.rechargeType;
        }
      }
    }

    // Update the recharge record
    const updatedRecharge = await Recharge.findByIdAndUpdate(
      rechargeId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Recharge record updated successfully",
      data: updatedRecharge,
    });
  } catch (error) {
    console.error("Error updating recharge:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update recharge record",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Admin: Delete recharge record
 */
export const deleteRecharge = async (req, res) => {
  try {
    const { rechargeId } = req.params;

    const recharge = await Recharge.findById(rechargeId);
    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: "Recharge record not found",
      });
    }

    // Only allow deletion if commission hasn't been distributed or if status is pending/failed
    if (recharge.commissionDistributed && recharge.status === "success") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete recharge record with distributed commissions. Please mark as cancelled instead.",
      });
    }

    await Recharge.findByIdAndDelete(rechargeId);

    return res.status(200).json({
      success: true,
      message: "Recharge record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting recharge:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete recharge record",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
