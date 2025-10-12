import nodemailer from "nodemailer";
import "dotenv/config";

// In-memory OTP store for demo (replace with DB or cache in production)
const emailOtpStore = {};

// Add a simple persistence check
let storeInitialized = false;
const initializeStore = () => {
  if (!storeInitialized) {
    storeInitialized = true;
  }
};

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

export const generateAndSendEmailOtp = async (email) => {
  try {
    initializeStore();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Valid email address is required.");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in memory (expires in 10 min)
    emailOtpStore[email] = {
      otp,
      expires: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    };
    
    // Verify the OTP was actually stored
    const storedRecord = emailOtpStore[email];
    if (!storedRecord || storedRecord.otp !== otp) {
      throw new Error("Failed to store OTP");
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP - YesITryMe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ff6b35; margin: 0;">🚀 YesITryMe</h1>
            <p style="color: #666; margin: 5px 0;">Multi-Level Marketing Platform</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              We received a request to reset your password. Use the OTP below to complete the password reset process.
            </p>
            
            <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
              <h3 style="color: white; margin: 0; font-size: 24px; letter-spacing: 5px;">${otp}</h3>
              <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">Your OTP Code</p>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⚠️ Important:</strong> This OTP is valid for 10 minutes only. Do not share this OTP with anyone.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to generate/send email OTP:", error.message);
    return false;
  }
};

// Function to check OTP store status
export const getOtpStoreStatus = () => {
  return {
    keys: Object.keys(emailOtpStore),
    count: Object.keys(emailOtpStore).length,
    entries: Object.entries(emailOtpStore).map(([email, data]) => ({
      email,
      attempts: data.attempts,
      expires: new Date(data.expires).toISOString(),
      isExpired: Date.now() > data.expires
    }))
  };
};

export const verifyEmailOtp = (email, otp) => {
  initializeStore();
  
  const record = emailOtpStore[email];
  if (!record) {
    return false;
  }
  
  // Check attempts limit (max 3 attempts)
  if (record.attempts >= 3) {
    delete emailOtpStore[email];
    return false;
  }
  
  // Check expiration first
  if (Date.now() > record.expires) {
    delete emailOtpStore[email];
    return false;
  }
  
  // Check OTP match
  if (record.otp !== otp) {
    // Increment attempts only on mismatch
    record.attempts++;
    return false;
  }
  
  // OTP is valid, remove it
  delete emailOtpStore[email];
  return true;
};

// Send password reset confirmation email
export const sendPasswordResetConfirmation = async (email, userId) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Successful - YesITryMe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ff6b35; margin: 0;">🚀 YesITryMe</h1>
            <p style="color: #666; margin: 5px 0;">Multi-Level Marketing Platform</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 25px;">
              <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <span style="font-size: 30px; color: #155724;">✓</span>
              </div>
              <h2 style="color: #155724; margin: 0;">Password Reset Successful!</h2>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Your password has been successfully reset. You can now log in to your account using your new password.
            </p>
            
            <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #004085; margin: 0; font-size: 14px;">
                <strong>User ID:</strong> ${userId}<br>
                <strong>Email:</strong> ${email}
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If you didn't perform this action, please contact our support team immediately.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Thank you for using YesITryMe!
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send password reset confirmation:", error.message);
    return false;
  }
};
