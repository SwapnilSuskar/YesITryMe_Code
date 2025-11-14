import Recharge from "../models/Recharge.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import axios from "axios";

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
  const legacyUrl = new URL("/recharge/api", A1TOPUP_LEGACY_BASE_URL).toString();
  const formBody = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formBody.append(key, value.toString());
    }
  });

  const response = await axios.post(legacyUrl, formBody.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    timeout: 10000,
  });

  return response.data;
};

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
 */
export const fetchRechargePlans = async (req, res) => {
  try {
    const {
      mobileNumber,
      operator,
      circle,
      rechargeType = "prepaid",
    } = req.query;

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
        message: "Invalid prepaid operator selected. Please select a prepaid operator.",
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
 * Fetch postpaid bill details from A1Topup
 * Tries both new REST API and legacy API sequentially
 */
export const fetchPostpaidBill = async (req, res) => {
  try {
    const { mobileNumber, operator, circle } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const operatorInfo = operator ? POSTPAID_OPERATORS[operator] : null;
    const operatorCode = operatorInfo?.code || null;
    const operatorApiCode = operatorInfo?.apiCode || operator || null;

      return res.status(200).json({
        success: false,
        data: {},
        message:
        "Bill fetch is not available via the A1Topup recharge API. Please enter the outstanding amount manually before proceeding with payment.",
      apiUsed: "not_supported",
      circleUsed: circle || null,
      operatorUsed: operatorApiCode || operatorCode || operator || null,
    });
  } catch (error) {
    console.error(
      "Error fetching postpaid bill:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bill details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
        message: "Only wallet payment is supported. Please use wallet payment method.",
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

    // Validate mobile number format
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number format",
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
      });
    }
    
    // Validate operator based on recharge type
    let operatorInfo;
    if (actualRechargeType === "postpaid") {
      operatorInfo = POSTPAID_OPERATORS[operator];
      if (!operatorInfo) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid postpaid operator selected. Please select a postpaid operator.",
        });
      }
    } else {
      operatorInfo = PREPAID_OPERATORS[operator];
      if (!operatorInfo) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid prepaid operator selected. Please select a prepaid operator.",
        });
      }
    }

    // Use operator type from operatorInfo if available
    actualRechargeType = operatorInfo.type || actualRechargeType;
    const normalizedCircle =
      actualRechargeType === "postpaid" ? circle || "NA" : circle;

    // Calculate commissions
    const commissionData = calculateCommissions(operator, parseFloat(amount));

    const originalAmount = Math.round(parseFloat(amount) * 100) / 100;
    const calculatedDiscount =
      commissionData.userCommission > 0
        ? Math.round(commissionData.userCommission * 100) / 100
        : 0;
    const discountAmount = Math.min(calculatedDiscount, originalAmount);
    const discountPercentage =
      discountAmount > 0 ? commissionData.userPercentage : 0;
    const netAmount = Math.max(
      Math.round((originalAmount - discountAmount) * 100) / 100,
      0
    );
    const discountApplied = discountAmount > 0;

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
      planId,
      planDescription,
      paymentMethod,
      status: "pending",
      adminCommission: commissionData.adminCommission,
      adminCommissionPercentage: commissionData.adminPercentage,
      userCommission: discountApplied ? 0 : commissionData.userCommission,
      userCommissionPercentage: discountApplied
        ? 0
        : commissionData.userPercentage,
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
    if (paymentMethod === "wallet") {
      const wallet = await Wallet.findOne({ userId });
      if (!wallet || (wallet.balance || 0) < netAmount) {
        recharge.status = "failed";
        recharge.failureReason = "Insufficient wallet balance";
        await recharge.save();
        return res.status(400).json({
          success: false,
          message: "Insufficient wallet balance",
        });
      }

      // Deduct balance safely
      const roundedAmount = Math.round(netAmount * 100) / 100;
      wallet.balance = Math.round((wallet.balance - roundedAmount) * 100) / 100;
      wallet.transactions.push({
        type: "recharge_payment",
        amount: roundedAmount,
        description:
          discountAmount > 0
            ? `Recharge payment for ${mobileNumber} (${operator}) - ₹${originalAmount.toFixed(
                2
              )} (-₹${discountAmount.toFixed(2)} discount, ${discountPercentage}% off)`
            : `Recharge payment for ${mobileNumber} (${operator})`,
        status: "completed",
        reference: `RECHARGE_WALLET_${recharge._id}`,
        createdAt: new Date(),
      });
      await wallet.save();

      // Mark as paid and process recharge with provider
      recharge.status = "payment_success";
      recharge.paymentCompletedAt = new Date();
      recharge.paymentMethod = "wallet";
      await recharge.save();

      const rechargeResult = await processRechargeWithA1Topup(recharge);
      
      // Check if processRechargeWithA1Topup returned an error object
      if (rechargeResult && rechargeResult.success === false) {
        // Refund wallet on provider failure
        const refundWallet = await Wallet.findOne({ userId });
        if (refundWallet) {
          refundWallet.balance =
            Math.round((refundWallet.balance + roundedAmount) * 100) / 100;
          refundWallet.transactions.push({
            type: "recharge_refund",
            amount: roundedAmount,
            description: `Refund for failed recharge ${mobileNumber} (${operator})`,
            status: "completed",
            reference: `RECHARGE_WALLET_REFUND_${recharge._id}`,
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

    const resolveCircleParam = (value) => {
      if (!value) return undefined;
      const numeric =
        resolveCircleNumericCode(value) ||
        resolveCircleNumericCode(resolveCircleCode(value));
      if (numeric) return numeric;
      const textCode = resolveCircleCode(value);
      return textCode || value;
    };

    const circleParam =
      resolveCircleParam(recharge.circle) ||
      resolveCircleParam(recharge.circleCode) ||
      resolveCircleParam(recharge.circleLabel);

    const orderId =
      recharge.aiTopUpOrderId ||
      `ORD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    recharge.aiTopUpOrderId = orderId;

    const params = {
      username: A1TOPUP_USERNAME,
      pwd: A1TOPUP_PASSWORD,
      operatorcode: operatorCode,
      number: recharge.mobileNumber,
      amount: numericAmount.toString(),
      orderid: orderId,
      format: "json",
    };

    if (circleParam) {
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

    try {
      console.log(
        `[A1Topup][Recharge][Legacy][Request]`,
        JSON.stringify(
          {
            url: new URL("/recharge/api", A1TOPUP_LEGACY_BASE_URL).toString(),
            params: {
              ...params,
              pwd: "***",
            },
          },
          null,
          2
        )
      );
    } catch (_) {}

    const rawProviderResponse = await callA1TopupRechargeEndpoint(params);
    const parsedResponse = parseA1TopupLegacyResponse(rawProviderResponse);
    const statusText = extractA1TopupStatus(parsedResponse);

    if (!isA1TopupSuccessStatus(statusText)) {
      if (isA1TopupPendingStatus(statusText)) {
        recharge.status = "processing";
        recharge.aiTopUpResponse = parsedResponse;
        recharge.providerResponse = parsedResponse;
        await recharge.save();
        console.log(
          `[A1Topup][Recharge] Pending status received for ${recharge.mobileNumber}: ${statusText}`
        );
        return true;
      }

      // Handle vendor failure responses gracefully
      const opid = parsedResponse.opid || parsedResponse.opId || "";
      const errorCode = opid.toString().trim();
      
      // Map vendor error codes to user-friendly messages
      let errorMessage = "Recharge failed";
      let errorType = "VENDOR_ERROR";
      
      if (/low\s*balance/i.test(errorCode)) {
        errorMessage = "Service temporarily unavailable. Our recharge service is currently experiencing high demand. Please try again in a few minutes.";
        errorType = "VENDOR_LOW_BALANCE";
      } else if (/parameter/i.test(errorCode) || /missing/i.test(errorCode)) {
        errorMessage = "Invalid request parameters. Please verify your recharge details and try again.";
        errorType = "VENDOR_INVALID_PARAMS";
      } else if (/minimum/i.test(errorCode) || /amount/i.test(errorCode)) {
        errorMessage = `Invalid recharge amount. ${parsedResponse.message || errorCode}`;
        errorType = "VENDOR_INVALID_AMOUNT";
      } else if (parsedResponse.message || parsedResponse.msg) {
        errorMessage = parsedResponse.message || parsedResponse.msg;
      } else if (statusText) {
        errorMessage = statusText;
      }
      
      // Log vendor error for debugging
        console.error(
        `[A1Topup][Recharge][Vendor Failure]`,
        JSON.stringify({
          mobileNumber: recharge.mobileNumber,
          amount: recharge.amount,
          orderId: orderId,
          status: statusText,
          opid: errorCode,
          parsedResponse: parsedResponse,
        }, null, 2)
      );
      
      // Return error object instead of throwing
      return {
        success: false,
        errorCode: errorType,
        message: errorMessage,
        vendorResponse: parsedResponse,
      };
    }

    recharge.status = "success";
    recharge.rechargeCompletedAt = new Date();

    recharge.aiTopUpOrderId =
      parsedResponse.orderid ||
      parsedResponse.orderId ||
      recharge.aiTopUpOrderId ||
      orderId;
    recharge.aiTopUpTransactionId =
      parsedResponse.txid ||
      parsedResponse.opid ||
      recharge.aiTopUpTransactionId ||
      "";

    recharge.aiTopUpResponse = parsedResponse;
    recharge.providerResponse = parsedResponse;
    recharge.providerCommission = Number(
      parsedResponse.commission ||
        parsedResponse.commision ||
        parsedResponse.providerCommission ||
        0
    );
    recharge.providerBalance = Number(
      parsedResponse.balance ||
        parsedResponse.walletBalance ||
        parsedResponse.wallet_balance ||
        parsedResponse.providerBalance ||
        0
    );

    await recharge.save();
    await distributeCommissions(recharge);

    console.log(
      `✅ A1Topup recharge successful via legacy API: ${recharge.mobileNumber}, Amount: ₹${recharge.amount}`
    );
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
      { $match: { ...query, status: "success", commissionDistributed: true } },
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
            commissionDistributed: true,
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
