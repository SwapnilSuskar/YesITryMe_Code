import Recharge from "../models/Recharge.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import axios from "axios";
import crypto from "crypto";

const A1TOPUP_BASE_URL =
  process.env.AITOPUP_BASE_URL ||
  process.env.AITOPUP_BASE_URL_V1 ||
  "https://a1topup.com";

const A1TOPUP_PLANS_ENDPOINT =
  process.env.AITOPUP_PLANS_ENDPOINT || "/recharge/api";
const A1TOPUP_PLANS_METHOD =
  (process.env.AITOPUP_PLANS_METHOD || "post").toLowerCase();
const A1TOPUP_PLAN_ACTION =
  process.env.AITOPUP_PLAN_ACTION || process.env.AITOPUP_ACTION_FETCH_PLANS || "plans";
const A1TOPUP_POSTPAID_FETCH_ENDPOINT =
  process.env.AITOPUP_POSTPAID_FETCH_ENDPOINT || "/recharge/api";
const A1TOPUP_POSTPAID_FETCH_METHOD =
  (process.env.AITOPUP_POSTPAID_FETCH_METHOD || "post").toLowerCase();
const A1TOPUP_POSTPAID_FETCH_ACTION =
  process.env.AITOPUP_POSTPAID_FETCH_ACTION ||
  process.env.AITOPUP_ACTION_POSTPAID_FETCH ||
  "postpaid_fetch_bill";
const A1TOPUP_POSTPAID_PAY_ENDPOINT =
  process.env.AITOPUP_POSTPAID_PAY_ENDPOINT || "/recharge/api";
const A1TOPUP_POSTPAID_PAY_METHOD =
  (process.env.AITOPUP_POSTPAID_PAY_METHOD || "post").toLowerCase();
const A1TOPUP_POSTPAID_PAY_ACTION =
  process.env.AITOPUP_POSTPAID_PAY_ACTION ||
  process.env.AITOPUP_ACTION_POSTPAID_PAY ||
  "postpaid_pay_bill";
const A1TOPUP_RECHARGE_ENDPOINT =
  process.env.AITOPUP_RECHARGE_ENDPOINT || "/recharge/api";
const A1TOPUP_RECHARGE_METHOD =
  (process.env.AITOPUP_RECHARGE_METHOD || "post").toLowerCase();
const A1TOPUP_RECHARGE_ACTION =
  process.env.AITOPUP_RECHARGE_ACTION ||
  process.env.AITOPUP_ACTION_RECHARGE ||
  "prepaid_recharge";

const CIRCLE_CODE_MAP = {
  "ANDHRA_PRADESH": "AP",
  "ANDHRA_PRADESH_TELANGANA": "AP",
  "ARUNACHAL_PRADESH": "NE",
  "ASSAM": "AS",
  "BIHAR": "BH",
  "CHATTISGARH": "CG",
  "DELHI_NCR": "DL",
  "DELHI": "DL",
  "GOA": "GA",
  "GUJARAT": "GJ",
  "HARYANA": "HR",
  "HIMACHAL_PRADESH": "HP",
  "JAMMU_AND_KASHMIR": "JK",
  "JHARKHAND": "JH",
  "KARNATAKA": "KA",
  "KERALA": "KL",
  "KOLKATA": "KO",
  "MADHYA_PRADESH": "MP",
  "MAHARASHTRA": "MH",
  "MAHARASHTRA_MUMBAI": "MH",
  "MAHARASHTRA_MUMBAI_CITY": "MH",
  "MAHARASHTRA_MUMBAI_METRO": "MH",
  "MUMBAI": "MB",
  "NORTH_EAST": "NE",
  "ODISHA": "OR",
  "ORISSA": "OR",
  "PUNJAB": "PB",
  "RAJASTHAN": "RJ",
  "TAMIL_NADU": "TN",
  "CHENNAI": "CH",
  "TELANGANA": "TS",
  "UTTAR_PRADESH_EAST": "UPE",
  "UTTAR_PRADESH_WEST": "UPW",
  "UTTARAKHAND": "UK",
  "WEST_BENGAL": "WB",
  "BIHAR_JHARKHAND": "BH",
  "MADHYA_PRADESH_CHHATTISGARH": "MP",
  "HARYANA_PUNJAB": "PB",
  "HARYANA_DELHI": "DL",
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
};

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
  const upperKey = normalized.replace(/\s+/g, "_").toUpperCase();
  return CIRCLE_NUMERIC_CODE_MAP[upperKey];
};

const A1TOPUP_USERNAME =
  process.env.AITOPUP_USERNAME ||
  process.env.AITOPUP_USER_ID ||
  process.env.AITOPUP_ACCOUNT_ID ||
  process.env.AITOPUP_ACCOUNT ||
  "";
const A1TOPUP_PASSWORD = process.env.AITOPUP_PASSWORD || process.env.AITOPUP_PWD || "";

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

  const mobile = baseParams.mobile || baseParams.number || baseParams.mobileNumber;
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
    baseParams.circle ||
    baseParams.circle_code ||
    baseParams.circlecode;
  if (circle) {
    setValue("circle", circle);
    setValue("circle_code", circle);
    setValue("state", circle);
    setValue("circlecode", circle);
  }

  const typeValue = baseParams.type || baseParams.recharge_type || baseParams.category;
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

  const orderId = baseParams.orderId || baseParams.orderid || baseParams.reference;
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
    Object.entries(baseParams.extra).forEach(([key, value]) => setValue(key, value));
  }

  return params;
};

// ==================== Helper Functions ====================

/**
 * Generate PhonePe payment signature
 */
const generatePhonePeSignature = (payload, saltKey, saltIndex) => {
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  const stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
  const sha256Hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
  const finalString = sha256Hash + saltKey;
  const signature = crypto.createHash("sha256").update(finalString).digest("hex") + "###" + saltIndex;
  return { base64Payload, signature };
};

/**
 * Verify PhonePe callback signature
 */
const verifyPhonePeSignature = (response, saltKey, saltIndex) => {
  try {
    const xVerify = response.headers["x-verify"] || "";
    const [receivedSignature] = xVerify.split("###");
    
    const stringToHash = response.body.response + "/pg/v1/status/" + 
      process.env.PHONEPE_MERCHANT_ID + saltKey;
    const sha256Hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const finalString = sha256Hash + saltKey;
    const calculatedSignature = crypto.createHash("sha256").update(finalString).digest("hex");
    
    return calculatedSignature === receivedSignature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
};

/**
 * Operator code mapping for aiTopUp API
 */
export const OPERATOR_CODES = {
  // Prepaid/Topup
  Airtel: { code: "A", apiCode: "AIRTEL", type: "prepaid" },
  Vodafone: { code: "V", apiCode: "VI", type: "prepaid" },
  "BSNL TOPUP": { code: "BT", apiCode: "BSNL", type: "prepaid" },
  "RELIANCE JIO": { code: "RC", apiCode: "JIO", type: "prepaid" },
  Idea: { code: "I", apiCode: "IDEA", type: "prepaid" },
  "BSNL STV": { code: "BR", apiCode: "BSNL", type: "prepaid" },
  // Postpaid
  "Airtel Postpaid": { code: "PAT", apiCode: "AIRTEL", type: "postpaid" },
  "Idea Postpaid": { code: "IP", apiCode: "IDEA", type: "postpaid" },
  "Vodafone Postpaid": { code: "VP", apiCode: "VI", type: "postpaid" },
  "JIO PostPaid": { code: "JPP", apiCode: "JIO", type: "postpaid" },
  "BSNL Postpaid": { code: "BSNL", apiCode: "BSNL", type: "postpaid" },
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
    "Airtel": 2.0,
    "Airtel Postpaid": 2.0,
    "Vodafone": 3.0,
    "Vodafone Postpaid": 3.0,
    "Idea": 3.0,
    "Idea Postpaid": 3.0,
    "BSNL TOPUP": 4.0,
    "BSNL STV": 4.0,
    "BSNL Postpaid": 4.0,
  };

  // User commission rates
  const userRates = {
    "RELIANCE JIO": 0,
    "JIO PostPaid": 0,
    "Airtel": 0.5,
    "Airtel Postpaid": 0.5,
    "Vodafone": 1.0,
    "Vodafone Postpaid": 1.0,
    "Idea": 1.0,
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
      console.log(`✅ Admin commission distributed: ₹${recharge.adminCommission}`);
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
      console.log(`✅ User commission distributed: ₹${recharge.userCommission}`);
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
    const { mobileNumber, operator, circle, rechargeType = "prepaid" } = req.query;

    if (!mobileNumber || !operator || !circle) {
      return res.status(400).json({
        success: false,
        message: "Mobile number, operator, and circle are required",
      });
    }

    // Get operator code from operator name
    const operatorInfo = OPERATOR_CODES[operator];
    if (!operatorInfo) {
      return res.status(400).json({
        success: false,
        message: "Invalid operator selected",
      });
    }

    // Call aiTopUp API to fetch plans using operator code
    const rawCircle = circle && operatorInfo.type !== "postpaid" ? circle : undefined;
    const providerCircle = resolveCircleCode(rawCircle);

    const operatorVariants = Array.from(
      new Set(
        [
          operatorInfo.code,
          operatorInfo.apiCode,
          operator.toUpperCase(),
          operator.toUpperCase().replace(/\s+/g, "_"),
        ].filter(Boolean)
      )
    );

  const circleNumeric = resolveCircleNumericCode(providerCircle || circle || rawCircle);
  const circleVariants = providerCircle
      ? Array.from(
          new Set([
            providerCircle,
            circleNumeric,
            resolveCircleCode(circle),
            resolveCircleCode(rawCircle),
            rawCircle,
            circleNumeric ? String(circleNumeric) : undefined,
            undefined,
          ])
        )
      : [undefined];

    const primaryPlansUrl = new URL(A1TOPUP_PLANS_ENDPOINT, A1TOPUP_BASE_URL).toString();
    const planCandidates = [
      {
        url: primaryPlansUrl,
        method: A1TOPUP_PLANS_METHOD,
        includeAction: !!A1TOPUP_PLAN_ACTION,
        format: "json",
      },
      {
        url: primaryPlansUrl,
        method: A1TOPUP_PLANS_METHOD === "post" ? "get" : "post",
        includeAction: !!A1TOPUP_PLAN_ACTION,
        format: "json",
      },
      {
        url: primaryPlansUrl,
        method: A1TOPUP_PLANS_METHOD,
        includeAction: !!A1TOPUP_PLAN_ACTION,
        format: "form",
      },
      {
        url: primaryPlansUrl,
        method: A1TOPUP_PLANS_METHOD === "post" ? "get" : "post",
        includeAction: !!A1TOPUP_PLAN_ACTION,
        format: "form",
      },
    ].filter(
      (candidate, index, self) =>
        self.findIndex(
          (item) =>
            item.url === candidate.url &&
            item.method === candidate.method &&
            item.format === candidate.format
        ) === index
    );

    const fetchPlansFromProvider = async (candidate, opCode, circleParam, actionValue) => {
      const circleKey =
        typeof circleParam === "string"
          ? circleParam.replace(/\s+/g, "_").toUpperCase()
          : typeof circleParam === "number"
          ? String(circleParam)
          : undefined;
      let circleNumeric =
        circleKey && CIRCLE_NUMERIC_CODE_MAP[circleKey]
          ? CIRCLE_NUMERIC_CODE_MAP[circleKey]
          : undefined;
      if (!circleNumeric && typeof circleParam === "string" && /^\d+$/.test(circleParam)) {
        circleNumeric = circleParam;
      }
      const circleValueForPayload = circleNumeric || circleParam;

      // Build a minimal payload per A1Topup docs for plans:
      // username, pwd, operatorcode, circlecode (optional), format=json, action=plan|plans
      const minimalPayload = {
        action: candidate.includeAction ? actionValue : undefined,
        operatorcode: opCode,
        circlecode: circleValueForPayload,
        number: mobileNumber,
        format: "json",
      };
      // Merge credentials and allow provider param synonyms just in case
      const params = buildProviderParams(minimalPayload);

      const config = {
        headers: {
          Authorization: `Bearer ${process.env.AITOPUP_API_KEY}`,
        },
        timeout: 8000,
      };

      // Debug: log outgoing request details
      try {
        console.log(
          "[A1Topup][Plans][Request]",
          JSON.stringify(
            {
              url: candidate.url,
              method: candidate.method,
              action: actionValue,
              operatorcode: opCode,
              circlecode: circleParam,
              headers: Object.keys(config.headers || {}),
              sendingKeys: Object.keys(params),
            },
            null,
            2
          )
        );
      } catch (_) {}

      if (candidate.method === "post") {
        let body = params;
        if (candidate.format === "form") {
          const formBody = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formBody.append(key, value.toString());
            }
          });
          body = formBody.toString();
          config.headers["Content-Type"] = "application/x-www-form-urlencoded";
        } else {
          config.headers["Content-Type"] = "application/json";
        }
        const resp = await axios.post(candidate.url, body, config);
        // Debug: log short response info
        try {
          const snippet =
            typeof resp.data === "string"
              ? resp.data.substring(0, 300)
              : JSON.stringify(resp.data).substring(0, 300);
          console.log(
            "[A1Topup][Plans][Response][POST]",
            JSON.stringify({ status: resp.status, snippet }, null, 2)
          );
        } catch (_) {}
        return resp;
      }

      config.headers["Content-Type"] = "application/json";
      config.params = params;
      const resp = await axios.get(candidate.url, config);
      try {
        const snippet =
          typeof resp.data === "string"
            ? resp.data.substring(0, 300)
            : JSON.stringify(resp.data).substring(0, 300);
        console.log(
          "[A1Topup][Plans][Response][GET]",
          JSON.stringify({ status: resp.status, snippet }, null, 2)
        );
      } catch (_) {}
      return resp;
    };

    let lastError;
    let lastCandidate;
    // Try common action names that providers use
    const actionVariants = Array.from(
      new Set([A1TOPUP_PLAN_ACTION, "plan", "plans"].filter(Boolean))
    );

    // Expand operator variants for common provider codes (helps when mapping is unknown)
    const extraVariants = [];
    if (/JIO/i.test(operator)) {
      extraVariants.push("J", "JIO");
    }
    if (/AIRTEL/i.test(operator)) {
      extraVariants.push("A", "AIRTEL");
    }
    if (/(VODAFONE|VI)/i.test(operator)) {
      extraVariants.push("V", "VI");
    }
    if (/IDEA/i.test(operator)) {
      extraVariants.push("I", "IDEA");
    }
    if (/BSNL/i.test(operator)) {
      extraVariants.push("B", "BSNL");
    }
    const operatorVariantsWithExtras = Array.from(new Set([...operatorVariants, ...extraVariants]));

    for (const candidate of planCandidates) {
      for (const opCode of operatorVariantsWithExtras) {
        for (const circleVariant of circleVariants) {
          for (const actionValue of actionVariants) {
            try {
              lastCandidate = candidate;
              const response = await fetchPlansFromProvider(
                candidate,
                opCode,
                circleVariant,
                actionValue
              );
            let payload = response.data;

            if (typeof payload === "string") {
              try {
                payload = JSON.parse(payload);
              } catch (parseError) {
                // If provider returns known message, degrade gracefully with empty plans
                const raw = typeof payload === "string" ? payload : String(payload || "");
                try {
                  console.error(
                    "A1Topup plan raw response:",
                    raw.substring(0, 1000)
                  );
                } catch (_) {}
                if (/parament(er|ar)\s+is\s+missing/i.test(raw)) {
                  return res.status(200).json({
                    success: true,
                    data: [],
                    message:
                      "Plans are not available from provider for this selection. Please enter amount manually.",
                    provider: {
                      endpoint: candidate.url,
                      method: candidate.method,
                      operatorTried: opCode,
                      circleTried: circleVariant,
                    },
                  });
                }
                lastError = new Error(
                  `Provider returned non-JSON response for operator ${opCode} (${candidate.method.toUpperCase()})`
                );
                continue;
              }
            }

            if (payload && typeof payload === "object") {
              const plans =
                Array.isArray(payload.data) && payload.data.length
                  ? payload.data
                  : Array.isArray(payload.plans) && payload.plans.length
                  ? payload.plans
                  : Array.isArray(payload.result) && payload.result.length
                  ? payload.result
                  : [];

              if (
                plans.length > 0 ||
                payload.success === true ||
                (typeof payload.status === "string" && payload.status.toLowerCase() === "success")
              ) {
                const resolvedPlans = plans.length > 0 ? plans : payload.data || payload.plans || [];
              return res.status(200).json({
                success: true,
                data: resolvedPlans,
                message: "Plans fetched successfully",
                resolvedOperator: opCode,
                resolvedCircle: circleVariant,
                resolvedEndpoint: candidate.url,
                resolvedMethod: candidate.method,
                resolvedAction: actionValue,
              });
            }
            }

            // If the provider returned HTML or unexpected structure, treat as failure
            lastError = new Error(
              `Unexpected response structure while fetching plans for operator ${opCode}`
            );
              try {
                console.error(
                  "A1Topup unexpected plan payload:",
                  typeof payload === "string"
                    ? payload.substring(0, 1000)
                    : JSON.stringify(payload).substring(0, 1000)
                );
              } catch (_) {}
            } catch (error) {
              lastError = error;
              // Dump as much error context as possible
              try {
                console.error(
                  "[A1Topup][Plans][Error]",
                  JSON.stringify(
                    {
                      message: error.message,
                      status: error.response?.status,
                      statusText: error.response?.statusText,
                      data:
                        typeof error.response?.data === "string"
                          ? error.response?.data.substring(0, 1000)
                          : JSON.stringify(error.response?.data).substring(0, 1000),
                    },
                    null,
                    2
                  )
                );
              } catch (_) {}
              continue;
            }
          }
        }
      }
    }

    if (lastError?.response?.status === 404) {
      // Provider doesn't support plans endpoint; return empty list so UI can proceed with manual amount
      return res.status(200).json({
        success: true,
        data: [],
        message:
          "Plans are not available for this operator/circle. Please enter amount manually.",
        provider: {
          baseUrl: A1TOPUP_BASE_URL,
          endpointTried: lastCandidate?.url,
          method: lastCandidate?.method,
        },
      });
    }

    if (lastError) {
      throw lastError;
    }

    throw new Error("Failed to fetch recharge plans");
  } catch (error) {
    console.error("Error fetching recharge plans:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recharge plans",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Fetch postpaid bill details from A1Topup
 */
export const fetchPostpaidBill = async (req, res) => {
  try {
    const { mobileNumber, operator } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const operatorInfo = operator ? getOperatorDetails(operator) : null;
    const basePayload = {
      mobile: mobileNumber,
      operator: operatorInfo?.apiCode || operator || "",
      type: "postpaid",
    };

    const primaryEndpoint = new URL(A1TOPUP_POSTPAID_FETCH_ENDPOINT, A1TOPUP_BASE_URL).toString();
    const candidateEndpoints = [
      {
        url: primaryEndpoint,
        method: A1TOPUP_POSTPAID_FETCH_METHOD,
        includeAction: false,
        format: "json",
      },
      {
        url: primaryEndpoint,
        method: A1TOPUP_POSTPAID_FETCH_METHOD === "post" ? "get" : "post",
        includeAction: false,
        format: "json",
      },
      {
        url: primaryEndpoint,
        method: A1TOPUP_POSTPAID_FETCH_METHOD,
        includeAction: false,
        format: "form",
      },
      {
        url: primaryEndpoint,
        method: A1TOPUP_POSTPAID_FETCH_METHOD === "post" ? "get" : "post",
        includeAction: false,
        format: "form",
      },
    ].filter(
      (candidate, index, self) =>
        self.findIndex(
          (item) =>
            item.url === candidate.url &&
            item.method === candidate.method &&
            item.format === candidate.format
        ) === index
    );

    let lastError;
    let lastCandidate;

    for (const candidate of candidateEndpoints) {
      try {
        lastCandidate = candidate;
        const operatorInfo = operator ? getOperatorDetails(operator) : null;
        const providerOperatorCode =
          operatorInfo?.code || operatorInfo?.apiCode || operator || basePayload.operator;
        const circleKey =
          basePayload.circle && typeof basePayload.circle === "string"
            ? basePayload.circle.replace(/\s+/g, "_").toUpperCase()
            : undefined;
        const circleNumeric =
          circleKey && CIRCLE_NUMERIC_CODE_MAP[circleKey]
            ? CIRCLE_NUMERIC_CODE_MAP[circleKey]
            : undefined;
        const circleValueForPayload = circleNumeric || resolveCircleCode(basePayload.circle);

        // Minimal payload for postpaid inquiry (provider specifics vary; send core fields only)
        const minimalPayload = {
          operatorcode: providerOperatorCode,
          number: mobileNumber,
          format: "json",
          circlecode: circleValueForPayload,
        };
        const payload = buildProviderParams(minimalPayload);
        const config = {
          headers: {},
          timeout: 8000,
        };

        let response;
        if (candidate.method === "get") {
          config.params = payload;
          config.headers["Content-Type"] = "application/json";
          response = await axios.get(candidate.url, config);
        } else {
          if (candidate.format === "form") {
            const formBody = new URLSearchParams();
            Object.entries(payload).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                formBody.append(key, value.toString());
              }
            });
            config.headers["Content-Type"] = "application/x-www-form-urlencoded";
            response = await axios.post(candidate.url, formBody.toString(), config);
          } else {
            config.headers["Content-Type"] = "application/json";
            response = await axios.post(candidate.url, payload, config);
          }
        }

        let data = response.data;

        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch (parseError) {
            console.error("A1Topup postpaid bill raw response:", data.substring(0, 500));
            // Graceful degrade on provider non-JSON message like "Paramenter is missing"
            return res.status(200).json({
              success: true,
              data: { note: "Bill fetch not available. Please enter amount manually." },
              message: "Postpaid bill fetch unavailable from provider",
              provider: {
                baseUrl: A1TOPUP_BASE_URL,
                endpointTried: candidate.url,
                method: candidate.method,
                raw: data.substring(0, 200),
              },
            });
          }
        }

        const isSuccess =
          data &&
          (data.success === true ||
            (typeof data.status === "string" && data.status.toLowerCase() === "success"));

        if (isSuccess) {
          return res.status(200).json({
            success: true,
            data,
            message: "Bill fetched successfully",
            resolvedEndpoint: candidate.url,
            resolvedMethod: candidate.method,
          });
        }

        const errorMessage = data?.message || "Failed to fetch bill details";
        const errorCode = data?.error_code ? ` (Code: ${data.error_code})` : "";
        lastError = new Error(`${errorMessage}${errorCode}`);
      } catch (error) {
        lastError = error;
        console.error(
          "A1Topup postpaid bill error:",
          error.response?.data || error.message || error.toString()
        );
      }
    }

    if (lastError?.response?.status === 404) {
      // Gracefully degrade: allow manual postpaid payment without fetched bill
      return res.status(200).json({
        success: true,
        data: { note: "Bill fetch not available. Proceed by entering amount manually." },
        message: "Postpaid bill fetch unavailable from provider",
        provider: {
          baseUrl: A1TOPUP_BASE_URL,
          endpointTried: lastCandidate?.url,
          method: lastCandidate?.method,
        },
      });
    }

    throw lastError || new Error("Failed to fetch bill details");
  } catch (error) {
    console.error("Error fetching postpaid bill:", error.response?.data || error.message);
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

    // Validation
    const tentativeRechargeType = operatorInfo?.type || rechargeType;
    const requiresCircle = tentativeRechargeType !== "postpaid";

    if (!mobileNumber || !operator || (requiresCircle && !circle) || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided and amount must be greater than 0",
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
    const operatorInfo = OPERATOR_CODES[operator];
    if (!operatorInfo) {
      return res.status(400).json({
        success: false,
        message: "Invalid operator selected",
      });
    }

    // Calculate commissions
    const commissionData = calculateCommissions(operator, parseFloat(amount));

    // Determine recharge type from operator
    const actualRechargeType = operatorInfo.type || rechargeType;
    const normalizedCircle = actualRechargeType === "postpaid" ? circle || "NA" : circle;

    // Create recharge record
    const recharge = new Recharge({
      userId,
      mobileNumber,
      operator,
      operatorCode: operatorInfo.code,
      circle: normalizedCircle,
      rechargeType: actualRechargeType,
      amount: parseFloat(amount),
      planId,
      planDescription,
      paymentMethod,
      status: "pending",
      adminCommission: commissionData.adminCommission,
      adminCommissionPercentage: commissionData.adminPercentage,
      userCommission: commissionData.userCommission,
      userCommissionPercentage: commissionData.userPercentage,
      paymentInitiatedAt: new Date(),
      operatorApiCode: operatorInfo.apiCode || operatorInfo.code || operator,
      billDetails,
      billFetchedAt: billDetails && Object.keys(billDetails).length > 0 ? new Date() : undefined,
    });

    recharge.aiTopUpOrderId =
      recharge.aiTopUpOrderId ||
      `ORD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    await recharge.save();

    // If paying from wallet (manual mode)
    if (paymentMethod === "wallet") {
      const wallet = await Wallet.findOne({ userId });
      if (!wallet || (wallet.balance || 0) < amount) {
        recharge.status = "failed";
        recharge.failureReason = "Insufficient wallet balance";
        await recharge.save();
        return res.status(400).json({
          success: false,
          message: "Insufficient wallet balance",
        });
      }

      // Deduct balance safely
      const roundedAmount = Math.round(parseFloat(amount) * 100) / 100;
      wallet.balance = Math.round((wallet.balance - roundedAmount) * 100) / 100;
      wallet.transactions.push({
        type: "debit",
        amount: roundedAmount,
        description: `Recharge payment for ${mobileNumber} (${operator})`,
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

      try {
        await processRechargeWithA1Topup(recharge);
        return res.status(200).json({
          success: true,
          message: "Recharge initiated successfully",
          data: { rechargeId: recharge._id, status: recharge.status },
        });
      } catch (rechargeError) {
        // Refund wallet on provider failure
        const refundWallet = await Wallet.findOne({ userId });
        if (refundWallet) {
          refundWallet.balance = Math.round((refundWallet.balance + roundedAmount) * 100) / 100;
          refundWallet.transactions.push({
            type: "credit",
            amount: roundedAmount,
            description: `Refund for failed recharge ${mobileNumber} (${operator})`,
            status: "completed",
            reference: `RECHARGE_WALLET_REFUND_${recharge._id}`,
            createdAt: new Date(),
          });
          await refundWallet.save();
        }
        await handleFailedRecharge(recharge, rechargeError.message || "Provider recharge failed");
        return res.status(500).json({
          success: false,
          message: "Recharge failed",
          error: rechargeError.message || "Provider error",
        });
      }
    }

    // Generate PhonePe payment request
    const merchantTransactionId = `RECHARGE_${recharge._id}_${Date.now()}`;
    const phonePePayload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      amount: Math.round(amount * 100), // Amount in paise
      merchantUserId: userId,
      redirectUrl: `${process.env.FRONTEND_URL}/recharge/callback`,
      redirectMode: "REDIRECT",
      callbackUrl: `${process.env.BACKEND_URL || process.env.FRONTEND_URL}/api/recharge/payment-callback`,
      mobileNumber: mobileNumber,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const { base64Payload, signature } = generatePhonePeSignature(
      phonePePayload,
      process.env.PHONEPE_SALT_KEY,
      process.env.PHONEPE_SALT_INDEX
    );

    // Store PhonePe details
    recharge.phonePeOrderId = merchantTransactionId;
    await recharge.save();

    // Make PhonePe API call
    const phonePeResponse = await axios.post(
      `${process.env.PHONEPE_BASE_URL}/pg/v1/pay`,
      { request: base64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": signature,
          accept: "application/json",
        },
      }
    );

    if (phonePeResponse.data && phonePeResponse.data.success) {
      recharge.phonePeResponse = phonePeResponse.data;
      recharge.phonePeTransactionId = phonePeResponse.data.data?.transactionId || "";
      await recharge.save();

      return res.status(200).json({
        success: true,
        message: "Payment initiated successfully",
        data: {
          rechargeId: recharge._id,
          paymentUrl: phonePeResponse.data.data?.instrumentResponse?.redirectInfo?.url,
          merchantTransactionId: merchantTransactionId,
        },
      });
    } else {
      recharge.status = "failed";
      recharge.failureReason = phonePeResponse.data?.message || "Payment initiation failed";
      await recharge.save();

      return res.status(400).json({
        success: false,
        message: "Failed to initiate payment",
        error: phonePeResponse.data?.message || "Payment gateway error",
      });
    }
  } catch (error) {
    console.error("Error initiating recharge:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to initiate recharge",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * PhonePe payment callback handler
 */
export const phonePeCallback = async (req, res) => {
  try {
    const { transactionId, merchantTransactionId } = req.body;

    // Find recharge record
    const recharge = await Recharge.findOne({
      phonePeOrderId: merchantTransactionId,
    });

    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: "Recharge transaction not found",
      });
    }

    // Verify payment status with PhonePe
    const statusResponse = await axios.get(
      `${process.env.PHONEPE_BASE_URL}/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          "X-VERIFY": `${crypto
            .createHash("sha256")
            .update(
              `/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}${process.env.PHONEPE_SALT_KEY}`
            )
            .digest("hex")}###${process.env.PHONEPE_SALT_INDEX}`,
          "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID,
        },
      }
    );

    if (statusResponse.data && statusResponse.data.success) {
      const paymentStatus = statusResponse.data.data?.state;

      if (paymentStatus === "COMPLETED") {
        // Payment successful, initiate recharge with aiTopUp
        recharge.status = "payment_success";
        recharge.paymentCompletedAt = new Date();
        recharge.phonePeTransactionId = transactionId || statusResponse.data.data?.transactionId || "";
        recharge.phonePeResponse = statusResponse.data.data;
        await recharge.save();

        // Process recharge with aiTopUp (A1TopUp handles wallet internally)
        try {
          await processRechargeWithA1Topup(recharge);
        } catch (rechargeError) {
          console.error("Recharge processing error:", rechargeError);
          // Handle failure and initiate refund
          await handleFailedRecharge(recharge, rechargeError.message);
        }
      } else if (paymentStatus === "FAILED") {
        recharge.status = "failed";
        recharge.failureReason = statusResponse.data.data?.responseCode || "Payment failed";
        await recharge.save();
      }
    }

    // Redirect to frontend
    return res.redirect(
      `${process.env.FRONTEND_URL}/recharge/status?rechargeId=${recharge._id}&status=${recharge.status}`
    );
  } catch (error) {
    console.error("Payment callback error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Payment callback processing failed",
    });
  }
};

/**
 * Process recharge with aiTopUp API
 */
const processRechargeWithA1Topup = async (recharge) => {
  try {
    recharge.status = "processing";
    recharge.rechargeInitiatedAt = new Date();
    await recharge.save();

    const isPostpaid = recharge.rechargeType === "postpaid";
    const operatorApiCode =
      recharge.operatorApiCode || getOperatorApiCode(recharge.operator, recharge.operatorCode);

    const primaryEndpoint = new URL(
      isPostpaid ? A1TOPUP_POSTPAID_PAY_ENDPOINT : A1TOPUP_RECHARGE_ENDPOINT,
      A1TOPUP_BASE_URL
    ).toString();

    const candidateEndpoints = [
      {
        url: primaryEndpoint,
        method: isPostpaid ? A1TOPUP_POSTPAID_PAY_METHOD : A1TOPUP_RECHARGE_METHOD,
        includeAction: false,
        format: "json",
      },
      {
        url: primaryEndpoint,
        method:
          (isPostpaid ? A1TOPUP_POSTPAID_PAY_METHOD : A1TOPUP_RECHARGE_METHOD) === "post"
            ? "get"
            : "post",
        includeAction: false,
        format: "json",
      },
      {
        url: primaryEndpoint,
        method: isPostpaid ? A1TOPUP_POSTPAID_PAY_METHOD : A1TOPUP_RECHARGE_METHOD,
        includeAction: false,
        format: "form",
      },
      {
        url: primaryEndpoint,
        method:
          (isPostpaid ? A1TOPUP_POSTPAID_PAY_METHOD : A1TOPUP_RECHARGE_METHOD) === "post"
            ? "get"
            : "post",
        includeAction: false,
        format: "form",
      },
    ].filter(
      (candidate, index, self) =>
        self.findIndex(
          (item) =>
            item.url === candidate.url &&
            item.method === candidate.method &&
            item.format === candidate.format
        ) === index
    );

    const operatorDetails = OPERATOR_CODES[recharge.operator] || {};
    const providerOperatorCode =
      recharge.operatorCode || operatorDetails.code || operatorDetails.apiCode || operatorApiCode;

    const circleKey =
      recharge.circle && typeof recharge.circle === "string"
        ? recharge.circle.replace(/\s+/g, "_").toUpperCase()
        : undefined;
    const circleNumeric =
      circleKey && CIRCLE_NUMERIC_CODE_MAP[circleKey] ? CIRCLE_NUMERIC_CODE_MAP[circleKey] : undefined;
    const resolvedCircle = !isPostpaid
      ? circleNumeric || resolveCircleCode(recharge.circle)
      : undefined;

    const basePayload = {
      mobile: recharge.mobileNumber,
      operator: providerOperatorCode,
      amount: recharge.amount,
      circle: resolvedCircle,
      type: isPostpaid ? "postpaid" : "prepaid",
      orderId:
        recharge.phonePeOrderId ||
        recharge.aiTopUpOrderId ||
        `ORD-${recharge._id}-${Date.now()}`,
    };

    let lastError;
    let lastCandidate;

    for (const candidate of candidateEndpoints) {
      try {
        lastCandidate = candidate;
        // Build minimal payload exactly as provider docs:
        // username, pwd, operatorcode, number, amount, orderid, format=json, optional circlecode
        const minimalPayload = {
          operatorcode: providerOperatorCode,
          number: recharge.mobileNumber,
          amount: recharge.amount,
          orderid:
            recharge.phonePeOrderId ||
            recharge.aiTopUpOrderId ||
            `ORD-${recharge._id}-${Date.now()}`,
          circlecode: resolvedCircle,
          format: "json",
        };
        const payload = buildProviderParams(minimalPayload);

        const config = {
          headers: {},
          timeout: 8000,
        };

        let providerResponse;
        if (candidate.method === "get") {
          config.params = payload;
          config.headers["Content-Type"] = "application/json";
          providerResponse = await axios.get(candidate.url, config);
        } else {
          if (candidate.format === "form") {
            const formBody = new URLSearchParams();
            Object.entries(payload).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                formBody.append(key, value.toString());
              }
            });
            config.headers["Content-Type"] = "application/x-www-form-urlencoded";
            providerResponse = await axios.post(candidate.url, formBody.toString(), config);
          } else {
            config.headers["Content-Type"] = "application/json";
            providerResponse = await axios.post(candidate.url, payload, config);
          }
        }

        let responseData = providerResponse.data;

        if (typeof responseData === "string") {
          try {
            responseData = JSON.parse(responseData);
          } catch (parseError) {
            lastError = new Error(
              `Provider returned non-JSON response for recharge action (${candidate.method.toUpperCase()})`
            );
            console.error("A1Topup recharge raw response:", responseData.substring(0, 500));
            continue;
          }
        }

        if (responseData && responseData.status?.toLowerCase() === "success") {
          recharge.status = "success";
          recharge.rechargeCompletedAt = new Date();
          recharge.aiTopUpOrderId = responseData.transaction_id || recharge.aiTopUpOrderId || "";
          recharge.aiTopUpTransactionId =
            responseData.transaction_id || recharge.aiTopUpTransactionId || "";
          recharge.aiTopUpResponse = responseData;
          recharge.providerResponse = responseData;
          recharge.providerCommission = Number(responseData.commission || 0);
          recharge.providerBalance = Number(responseData.balance || 0);
          recharge.providerReceiptUrl = responseData.receipt_url || recharge.providerReceiptUrl;

          if (isPostpaid) {
            recharge.billDetails = {
              ...(recharge.billDetails || {}),
              paymentConfirmation: responseData,
            };
          }

          await recharge.save();

          await distributeCommissions(recharge);

          console.log(
            `✅ ${isPostpaid ? "Bill payment" : "Recharge"} successful: ${recharge.mobileNumber}, Amount: ₹${recharge.amount}`
          );

          return true;
        }

        const errorMessage = responseData?.message || "Recharge failed";
        const errorCode = responseData?.error_code ? ` (Code: ${responseData.error_code})` : "";
        lastError = new Error(`${errorMessage}${errorCode}`);
      } catch (error) {
        lastError = error;
        console.error(
          "A1Topup recharge error:",
          error.response?.data || error.message || error.toString()
        );
      }
    }

    if (lastError?.response?.status === 404) {
      throw new Error(
        `Recharge endpoint not found on provider (tried ${lastCandidate?.url} with method ${lastCandidate?.method})`
      );
    }

    throw lastError || new Error("Recharge failed");
  } catch (error) {
    console.error("A1Topup recharge error:", error.response?.data || error.message);
    const providerError = error.response?.data;
    const errorMessage =
      providerError?.message ||
      providerError?.error_code ||
      error.message ||
      "Recharge failed";
    throw new Error(errorMessage);
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

    // Initiate PhonePe refund
    const refundPayload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      transactionId: recharge.phonePeTransactionId,
      amount: Math.round(recharge.amount * 100),
    };

    const refundResponse = await axios.post(
      `${process.env.PHONEPE_BASE_URL}/pg/v1/refund`,
      refundPayload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          "X-VERIFY": `${crypto
            .createHash("sha256")
            .update(
              `/pg/v1/refund${JSON.stringify(refundPayload)}${process.env.PHONEPE_SALT_KEY}`
            )
            .digest("hex")}###${process.env.PHONEPE_SALT_INDEX}`,
          "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID,
        },
      }
    );

    if (refundResponse.data && refundResponse.data.success) {
      recharge.status = "refunded";
      recharge.refundReason = reason;
      recharge.refundedAt = new Date();
      recharge.refundTransactionId = refundResponse.data.data?.refundId || "";
      await recharge.save();

      console.log(`💰 Refund processed: ₹${recharge.amount} for ${recharge.mobileNumber}`);
    }
  } catch (error) {
    console.error("Refund processing error:", error.response?.data || error.message);
    recharge.adminNotes = `Refund initiation failed: ${error.message}`;
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
    const { page = 1, limit = 20, status, operator, startDate, endDate } = req.query;
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
    const userIds = [...new Set(recharges.map(r => r.userId))];
    const users = await User.find({ userId: { $in: userIds } });
    const userMap = users.reduce((map, user) => {
      map[user.userId] = user;
      return map;
    }, {});

    // Attach user data to recharges
    const rechargesWithUsers = recharges.map(recharge => {
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
        { $match: { ...dateQuery, status: "success", commissionDistributed: true } },
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
        pendingRecharges: totalTransactions - successfulRecharges - failedRecharges,
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
        const operatorInfo = OPERATOR_CODES[updateData.operator];
        if (operatorInfo) {
          updateData.operatorCode = operatorInfo.code;
          updateData.operatorApiCode = operatorInfo.apiCode || operatorInfo.code;
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
        message: "Cannot delete recharge record with distributed commissions. Please mark as cancelled instead.",
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

