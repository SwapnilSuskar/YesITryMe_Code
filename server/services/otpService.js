import twilio from "twilio";

// In-memory OTP store for demo (replace with DB or cache in production)
const otpStore = {};

export const generateAndSendOtp = async (mobile) => {
  try {
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      throw new Error("Valid 10-digit mobile number is required.");
    }
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Store OTP in memory (expires in 5 min)
    otpStore[mobile] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio credentials not set in environment.");
    }
    const client = twilio(accountSid, authToken);
    const toNumber = `+91${mobile}`;
    const message = `Your YesITryMe OTP is: ${otp}. It is valid for 5 minutes.`;
    await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber,
    });
    // console.log(`OTP ${otp} sent to ${mobile}`);
    return true;
  } catch (error) {
    console.error("Failed to generate/send OTP:", error.message);
    return false;
  }
};

export const verifyOtp = (mobile, otp) => {
  const record = otpStore[mobile];
  if (!record) {
    // console.log(`No OTP record found for mobile: ${mobile}`);
    return false;
  }
  if (record.otp !== otp) {
    // console.log(`OTP mismatch for mobile: ${mobile}. Expected: ${record.otp}, Received: ${otp}`);
    return false;
  }
  if (Date.now() > record.expires) {
    // console.log(`OTP expired for mobile: ${mobile}`);
    delete otpStore[mobile];
    return false;
  }
  // OTP is valid, remove it
  // console.log(`OTP verified successfully for mobile: ${mobile}`);
  delete otpStore[mobile];
  return true;
};

export const sendSignupOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      console.log("❌ Invalid mobile number:", mobile);
      return res
        .status(400)
        .json({ message: "Valid 10-digit mobile number is required." });
    }

    // Generate OTP but don't send via SMS
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in memory (expires in 5 min)
    otpStore[mobile] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    // Return OTP in response instead of sending SMS
    res.status(200).json({
      message: "OTP generated successfully!",
      otp: otp, // Include OTP in response for frontend display
      expiresIn: "5 minutes",
    });
  } catch (error) {
    console.error("sendSignupOtp error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
    });

    res.status(500).json({
      message: "Failed to generate OTP.",
      error: error.message,
      code: error.code || "UNKNOWN",
    });
  }
};

// Verify OTP for signup
export const verifySignupOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        message: "Mobile number and OTP are required.",
      });
    }

    const isValid = verifyOtp(mobile, otp);

    if (isValid) {
      res.status(200).json({
        message: "OTP verified successfully!",
        success: true,
      });
    } else {
      res.status(400).json({
        message: "Invalid or expired OTP.",
        success: false,
      });
    }
  } catch (error) {
    console.error("verifySignupOtp error:", error);
    res.status(500).json({
      message: "Failed to verify OTP.",
      error: error.message,
    });
  }
};

// Send User ID and password to user after successful registration
export const sendUserIdAndPassword = async (mobile, userId, password) => {
  try {
    console.log("📱 Sending User ID and password to:", mobile);
    console.log("👤 User ID:", userId);
    console.log("🔑 Password:", password);

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error("❌ Twilio credentials not set in environment.");
      return false;
    }

    const client = twilio(accountSid, authToken);
    const toNumber = `+91${mobile}`;

    const message = `Welcome to Your YesITryMe digital marketing opportunity! Your login credentials:\nUser ID: ${userId}\nPassword: ${password}\n\nPlease keep these safe for login. Do not share with anyone.`;

    console.log("📨 Message to be sent:", message);

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber,
    });

    console.log(
      "✅ User ID and password sent successfully to",
      mobile,
      "SID:",
      result.sid
    );
    return true;
  } catch (error) {
    console.error("❌ Failed to send User ID and password:", error.message);
    return false;
  }
};
