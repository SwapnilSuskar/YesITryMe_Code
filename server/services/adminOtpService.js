import nodemailer from "nodemailer";

// In-memory OTP store for admin (replace with DB or cache in production)
const adminOtpStore = {};

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export const generateAndSendAdminOtp = async (email) => {
  try {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Valid email address is required.");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in memory (expires in 10 min for admin)
    adminOtpStore[email] = {
      otp,
      expires: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    };

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Admin Login OTP - YesITryMe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 10px;">Admin Login Verification</h2>
              <p style="color: #666; margin: 0;">Your OTP for admin login</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px; font-weight: bold;">${otp}</h1>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                This OTP is valid for 10 minutes.<br>
                If you didn't request this OTP, please ignore this email.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                YesITryMe Admin Panel<br>
                Secure access for authorized personnel only
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Admin OTP ${otp} sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Failed to generate/send admin OTP:", error.message);
    return false;
  }
};

export const verifyAdminOtp = (email, otp) => {
  const record = adminOtpStore[email];
  if (!record) {
    console.log(`No admin OTP record found for email: ${email}`);
    return false;
  }

  if (record.attempts >= 3) {
    console.log(`Too many attempts for email: ${email}`);
    delete adminOtpStore[email];
    return false;
  }

  if (record.otp !== otp) {
    record.attempts += 1;
    console.log(
      `Admin OTP mismatch for email: ${email}. Expected: ${record.otp}, Received: ${otp}`
    );
    return false;
  }

  if (Date.now() > record.expires) {
    console.log(`Admin OTP expired for email: ${email}`);
    delete adminOtpStore[email];
    return false;
  }

  // OTP is valid, remove it
  console.log(`Admin OTP verified successfully for email: ${email}`);
  delete adminOtpStore[email];
  return true;
};

export const sendAdminOtp = async (req, res) => {
  try {
    console.log("📧 sendAdminOtp called for email:", req.body.email);

    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log("❌ Invalid email address:", email);
      return res
        .status(400)
        .json({ message: "Valid email address is required." });
    }

    const success = await generateAndSendAdminOtp(email);

    if (success) {
      res.status(200).json({
        message: "Admin OTP sent successfully!",
        expiresIn: "10 minutes",
      });
    } else {
      res.status(500).json({
        message: "Failed to send admin OTP.",
      });
    }
  } catch (error) {
    console.error("sendAdminOtp error:", error);
    res.status(500).json({
      message: "Failed to send admin OTP.",
      error: error.message,
    });
  }
};
