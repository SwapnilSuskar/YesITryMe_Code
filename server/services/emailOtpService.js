import nodemailer from "nodemailer";
import "dotenv/config";
import EmailOtp from "../models/EmailOtp.js";

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
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Valid email address is required.");
    }

    // Normalize email to ensure consistent lookup
    const normalizedEmail = email.trim().toLowerCase();

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Calculate expiration (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Upsert OTP record in MongoDB so it works reliably in serverless/production
    await EmailOtp.findOneAndUpdate(
      { email: normalizedEmail },
      { otp, expiresAt, attempts: 0 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

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
export const getOtpStoreStatus = async () => {
  try {
    const records = await EmailOtp.find().lean();
    return {
      count: records.length,
      entries: records.map((record) => ({
        email: record.email,
        attempts: record.attempts,
        expiresAt: record.expiresAt?.toISOString(),
        isExpired: record.expiresAt
          ? Date.now() > record.expiresAt.getTime()
          : null,
        createdAt: record.createdAt?.toISOString(),
      })),
    };
  } catch (error) {
    return {
      count: 0,
      entries: [],
      error: error.message,
    };
  }
};

export const verifyEmailOtp = async (email, otp) => {
  if (!email || !otp) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const record = await EmailOtp.findOne({ email: normalizedEmail });
  if (!record) {
    return false;
  }

  // Check attempts limit (max 3 attempts)
  if (record.attempts >= 3) {
    await EmailOtp.deleteOne({ _id: record._id });
    return false;
  }

  // Check expiration first
  if (!record.expiresAt || Date.now() > record.expiresAt.getTime()) {
    await EmailOtp.deleteOne({ _id: record._id });
    return false;
  }

  // Check OTP match
  if (record.otp !== otp) {
    record.attempts += 1;
    await record.save();
    return false;
  }

  // OTP is valid, remove it
  await EmailOtp.deleteOne({ _id: record._id });
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
