import nodemailer from "nodemailer";
import "dotenv/config";
import User from "../models/User.js";

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

const COMPANY_ADDRESS =
  "395, MAHADEV NAGAR, BEHIND DEVAKATE HOSPITAL ARVI, AT PO ARVI TAL SHIRUR KASAR DIST BEED PINCODE-413249, INDIA";
const COMPANY_LOGO_URL =
  process.env.COMPANY_LOGO_URL ||
  "https://www.yesitryme.com/static/media/Logo.211b2574d435f37a9145.png";
const COMPANY_GSTIN = "27AADFY7945F1ZR";
const GST_RATE = 0.18;

// Helper function to format date
const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

// Helper function to format currency
const formatCurrency = (amount) => {
  return `₹${parseFloat(amount || 0).toFixed(2)}`;
};

const calculateGstBreakdown = (totalAmount) => {
  const total = parseFloat(totalAmount || 0);
  const gstAmount = Math.round(total * GST_RATE * 100) / 100;
  const subtotal = Math.round((total - gstAmount) * 100) / 100;
  return { subtotal, gstAmount };
};

const buildReceiptNotes = ({
  totalAmount,
  amountReceived,
  customerName,
  description,
}) => {
  const baseNotes = [
    "Thank you for choosing YesITryMe. This receipt includes 18% GST as per regulations.",
    "Please keep this receipt for your records. For any questions, reach us on +91 7066916324 or YesITryMeofficial@gmail.com.",
  ];

  if (description) {
    baseNotes.unshift(`Item Description: ${description}`);
  }

  baseNotes.unshift("Payment Status: Paid in full.");

  if (customerName) {
    baseNotes.unshift(`Customer: ${customerName}`);
  }

  const noteItems = baseNotes
    .map((note) => `<li style="margin-bottom: 6px; color: #555;">${note}</li>`)
    .join("");

  return `
    <div style="margin-top: 20px; background: #fdf8ef; border: 1px solid #fde3c8; border-radius: 8px; padding: 16px;">
      <h4 style="margin: 0 0 10px 0; color: #c77400;">Notes</h4>
      <ul style="margin: 0; padding-left: 18px;">${noteItems}</ul>
    </div>
  `;
};

// Common email footer
const getEmailFooter = () => {
  return `
    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee;">
      <p style="color: #666; font-size: 14px; margin: 10px 0;">
        <strong>YesITryMe</strong> - Try krega india 🇮🇳
      </p>
      <p style="color: #999; font-size: 12px; margin: 5px 0;">
        This is an automated receipt. Please do not reply to this email.
      </p>
      <p style="color: #999; font-size: 12px; margin: 5px 0;">
        For support, please contact us through your dashboard or on this number <strong>+91 7066916324</strong>.
      </p>
      <p style="color: #999; font-size: 12px; margin: 5px 0;">
        or email us at <strong>YesITryMeofficial@gmail.com</strong>.
      </p>
    </div>
  `;
};

/**
 * Send Smart Wallet Top-Up Receipt (when approved)
 */
export const sendWalletTopUpReceipt = async (
  topUpData,
  userData,
  newBalance
) => {
  try {
    if (!userData?.email) {
      console.error("User email not found for wallet top-up receipt");
      return false;
    }

    const transporter = createTransporter();
    const formattedDate = formatDate(
      topUpData.approvedAt || topUpData.submittedAt
    );
    const formattedAmount = formatCurrency(topUpData.paymentAmount);

    const mailOptions = {
      from: `"YesITryMe" <${process.env.EMAIL_USER}>`,
      to: userData.email,
      subject: `Smart Wallet Top-Up Receipt - ${topUpData.transactionId} - YesITryMe`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 32px;">🚀 YesITryMe</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Smart Wallet Top-Up Receipt</p>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; font-size: 13px; color: #555;">
                <div>
                  <p style="margin: 0;"><strong>Receipt Number:</strong> ${topUpData.transactionId || `TOPUP-${Date.now()}`}</p>
                  <p style="margin: 5px 0 0 0;"><strong>Receipt Date:</strong> ${formattedDate}</p>
                  <p style="margin: 5px 0 0 0;"><strong>GSTIN:</strong> ${COMPANY_GSTIN}</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0;"><strong>YesITryMe</strong></p>
                  <p style="margin: 5px 0 0 0;">${COMPANY_ADDRESS}</p>
                  <p style="margin: 5px 0 0 0;"><strong>GSTIN:</strong> ${COMPANY_GSTIN}</p>
                </div>
              </div>
              <h2 style="color: #155724; margin: 0;">Top-Up Approved!</h2>
              <p style="color: #666; margin: 10px 0 0 0;">Your Smart Wallet has been credited successfully</p>
            </div>
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">Customer Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Name:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    userData.firstName
                  } ${userData.lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">User ID:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    userData.userId
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">${
                    userData.email
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Mobile:</td>
                  <td style="padding: 8px 0; color: #333;">${
                    userData.mobile
                  }</td>
                </tr>
              </table>
            </div>
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">Transaction Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Transaction ID:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; font-family: monospace;">${
                    topUpData.transactionId
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Payment Method:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    topUpData.paymentMethod
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Amount Added:</td>
                  <td style="padding: 8px 0; color: #155724; font-weight: bold; font-size: 18px;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Wallet Type:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">Smart Wallet (Recharge Wallet)</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">New Balance:</td>
                  <td style="padding: 8px 0; color: #155724; font-weight: bold; font-size: 18px;">${formatCurrency(
                    newBalance
                  )}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Approved Date:</td>
                  <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
                </tr>
              </table>
            </div>

            ${
              topUpData.adminNotes
                ? `
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>Admin Notes:</strong> ${topUpData.adminNotes}
              </p>
            </div>
            `
                : ""
            }

            ${getEmailFooter()}
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Wallet top-up receipt sent to ${userData.email}`);
    return true;
  } catch (error) {
    console.error("Failed to send wallet top-up receipt:", error.message);
    return false;
  }
};

/**
 * Send Package Purchase Receipt (when payment verified)
 */
export const sendPackagePurchaseReceipt = async (
  purchaseData,
  verificationData,
  userData
) => {
  try {
    if (!userData?.email) {
      console.error("User email not found for package purchase receipt");
      return false;
    }

    const transporter = createTransporter();
    const formattedDate = formatDate(purchaseData.purchaseDate);
    const formattedAmount = formatCurrency(purchaseData.packagePrice);
    const { subtotal, gstAmount } = calculateGstBreakdown(
      purchaseData.packagePrice
    );
    const formattedSubtotal = formatCurrency(subtotal);
    const formattedGst = formatCurrency(gstAmount);
    const amountReceived =
      verificationData?.paymentAmount || purchaseData.packagePrice;
    const receiptNumber =
      purchaseData.purchaseId ||
      verificationData?.transactionId ||
      `PKG-${Date.now()}`;
    const receiptDate = formatDate(purchaseData.purchaseDate || new Date());
    const packageDescription =
      purchaseData.description ||
      verificationData?.additionalNotes ||
      "Package purchase";
    const notesSection = buildReceiptNotes({
      totalAmount: purchaseData.packagePrice,
      amountReceived,
      customerName: `${userData.firstName} ${userData.lastName}`,
      description: packageDescription,
    });

    const mailOptions = {
      from: `"YesITryMe" <${process.env.EMAIL_USER}>`,
      to: userData.email,
      subject: `Package Purchase Receipt - ${purchaseData.purchaseId} - YesITryMe`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${COMPANY_LOGO_URL}" alt="YesITryMe Logo" style="max-width: 140px; height: auto;" />
          </div>
          <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 32px;">🚀 YesITryMe</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Package Purchase Receipt</p>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; font-size: 13px; color: #555;">
              <div>
                <p style="margin: 0;"><strong>Receipt Number:</strong> ${receiptNumber}</p>
                <p style="margin: 5px 0 0 0;"><strong>Receiption Date:</strong> ${receiptDate}</p>
                <p style="margin: 5px 0 0 0;"><strong>GSTIN:</strong> ${COMPANY_GSTIN}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0;"><strong>YesITryMe</strong></p>
                <p style="margin: 5px 0 0 0;">${COMPANY_ADDRESS}</p>
                <p style="margin: 5px 0 0 0;"><strong>GSTIN:</strong> ${COMPANY_GSTIN}</p>
              </div>
            </div>
            <h2 style="color: #155724; margin: 0;">Purchase Successful!</h2>
            <p style="color: #666; margin: 10px 0 0 0;">Your package has been activated</p>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">Customer Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Name:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    userData.firstName
                  } ${userData.lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">User ID:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    userData.userId
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">${
                    userData.email
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Mobile:</td>
                  <td style="padding: 8px 0; color: #333;">${
                    userData.mobile
                  }</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">Package Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Package Name:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    purchaseData.packageName
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Purchase ID:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; font-family: monospace;">${
                    purchaseData.purchaseId
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Package Price:</td>
                  <td style="padding: 8px 0; color: #155724; font-weight: bold; font-size: 18px;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Payment Method:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    purchaseData.paymentMethod
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Payment Status:</td>
                  <td style="padding: 8px 0; color: #155724; font-weight: bold;">${
                    purchaseData.paymentStatus
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Package Status:</td>
                  <td style="padding: 8px 0; color: #155724; font-weight: bold;">${
                    purchaseData.status
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Purchase Date:</td>
                  <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
                </tr>
                ${
                  verificationData?.transactionId
                    ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Transaction ID:</td>
                  <td style="padding: 8px 0; color: #333; font-family: monospace;">${verificationData.transactionId}</td>
                </tr>
                `
                    : ""
                }
              </table>
            </div>

            <div style="margin-bottom: 25px;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 10px;">Item & Description</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <th style="text-align: left; padding: 8px; background-color: #f5f5f5;">Item</th>
                  <th style="text-align: left; padding: 8px; background-color: #f5f5f5;">Description</th>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${
                    purchaseData.packageName
                  }</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${packageDescription}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Subtotal</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right;">${formattedSubtotal}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">GST (18%)</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right;">${formattedGst}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Total</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Amount Received</td>
                  <td style="padding: 8px 0; color: #155724; font-weight: bold; text-align: right;">${formatCurrency(
                    amountReceived
                  )}</td>
                </tr>
              </table>
            </div>

            ${notesSection}
            ${getEmailFooter()}
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Package purchase receipt sent to ${userData.email}`);
    return true;
  } catch (error) {
    console.error("Failed to send package purchase receipt:", error.message);
    return false;
  }
};

/**
 * Send Super Package Purchase Receipt (when payment verified)
 */
export const sendSuperPackagePurchaseReceipt = async (
  purchaseData,
  verificationData,
  userData
) => {
  try {
    if (!userData?.email) {
      console.error("User email not found for super package purchase receipt");
      return false;
    }

    const transporter = createTransporter();
    const formattedDate = formatDate(purchaseData.purchaseDate);
    const formattedAmount = formatCurrency(purchaseData.superPackagePrice);
    const { subtotal, gstAmount } = calculateGstBreakdown(
      purchaseData.superPackagePrice
    );
    const formattedSubtotal = formatCurrency(subtotal);
    const formattedGst = formatCurrency(gstAmount);
    const amountReceived =
      verificationData?.paymentAmount || purchaseData.superPackagePrice;
    const receiptNumber =
      purchaseData.purchaseId ||
      verificationData?.transactionId ||
      `SPP-${Date.now()}`;
    const receiptDate = formatDate(purchaseData.purchaseDate || new Date());
    const packageDescription =
      purchaseData.description ||
      verificationData?.additionalNotes ||
      "Super package purchase";
    const notesSection = buildReceiptNotes({
      totalAmount: purchaseData.superPackagePrice,
      amountReceived,
      customerName: `${userData.firstName} ${userData.lastName}`,
      description: packageDescription,
    });

    const mailOptions = {
      from: `"YesITryMe" <${process.env.EMAIL_USER}>`,
      to: userData.email,
      subject: `Super Package Purchase Receipt - ${purchaseData.purchaseId} - YesITryMe`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${COMPANY_LOGO_URL}" alt="YesITryMe Logo" style="max-width: 140px; height: auto;" />
          </div>
          <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 32px;">🚀 YesITryMe</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Super Package Purchase Receipt</p>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; font-size: 13px; color: #555;">
              <div>
                <p style="margin: 0;"><strong>Receipt Number:</strong> ${receiptNumber}</p>
                <p style="margin: 5px 0 0 0;"><strong>Receiption Date:</strong> ${receiptDate}</p>
                <p style="margin: 5px 0 0 0;"><strong>GSTIN:</strong> ${COMPANY_GSTIN}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0;"><strong>YesITryMe</strong></p>
                <p style="margin: 5px 0 0 0;">${COMPANY_ADDRESS}</p>
                <p style="margin: 5px 0 0 0;"><strong>GSTIN:</strong> ${COMPANY_GSTIN}</p>
              </div>
            </div>
            <h2 style="color: #155724; margin: 0;">Super Package Activated!</h2>
            <p style="color: #666; margin: 10px 0 0 0;">Your super package has been successfully activated</p>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">Customer Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Name:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    userData.firstName
                  } ${userData.lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">User ID:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    userData.userId
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">${
                    userData.email
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Mobile:</td>
                  <td style="padding: 8px 0; color: #333;">${
                    userData.mobile
                  }</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">Super Package Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Super Package Name:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    purchaseData.superPackageName
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Purchase ID:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; font-family: monospace;">${
                    purchaseData.purchaseId
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Super Package Price:</td>
                  <td style="padding: 8px 0; color: #155724; font-weight: bold; font-size: 18px;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Payment Method:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    purchaseData.paymentMethod
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Payment Status:</td>
                  <td style="padding: 8px 0; color: #155724; font-weight: bold;">${
                    purchaseData.paymentStatus
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Package Status:</td>
                  <td style="padding: 8px 0; color: #155724; font-weight: bold;">${
                    purchaseData.status
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Purchase Date:</td>
                  <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
                </tr>
                ${
                  purchaseData.expiresAt
                    ? `<tr><td style="padding: 8px 0; color: #666;">Expires At:</td><td style="padding: 8px 0; color: #333;">${formatDate(
                        purchaseData.expiresAt
                      )}</td></tr>`
                    : ""
                }
                ${
                  verificationData?.transactionId
                    ? `<tr><td style="padding: 8px 0; color: #666;">Transaction ID:</td><td style="padding: 8px 0; color: #333; font-family: monospace;">${verificationData.transactionId}</td></tr>`
                    : ""
                }
              </table>
            </div>

            <div style="margin-bottom: 25px;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 10px;">Item & Description</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <th style="text-align: left; padding: 8px; background-color: #f5f5f5;">Item</th>
                  <th style="text-align: left; padding: 8px; background-color: #f5f5f5;">Description</th>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${
                    purchaseData.superPackageName
                  }</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${packageDescription}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Subtotal</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right;">${formattedSubtotal}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">GST (18%)</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; text-align:right;">${formattedGst}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Total</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; text-align:right;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Amount Received</td>
                  <td style="padding: 8px 0; color: #155724; font-weight: bold; text-align:right;">${formatCurrency(
                    amountReceived
                  )}</td>
                </tr>
              </table>
            </div>
            ${notesSection}
            ${getEmailFooter()}
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Super package purchase receipt sent to ${userData.email}`);
    return true;
  } catch (error) {
    console.error(
      "Failed to send super package purchase receipt:",
      error.message
    );
    return false;
  }
};

/**
 * Send Mobile Recharge Receipt (when successful)
 */
export const sendMobileRechargeReceipt = async (rechargeData, userData) => {
  try {
    if (!userData?.email) {
      console.error("User email not found for mobile recharge receipt");
      return false;
    }

    const transporter = createTransporter();
    const formattedDate = formatDate(
      rechargeData.rechargeCompletedAt || rechargeData.createdAt
    );
    const formattedAmount = formatCurrency(rechargeData.amount);
    const formattedNetAmount = formatCurrency(
      rechargeData.netAmount || rechargeData.amount
    );
    const formattedDiscount = formatCurrency(rechargeData.discountAmount || 0);

    const mailOptions = {
      from: `"YesITryMe" <${process.env.EMAIL_USER}>`,
      to: userData.email,
      subject: `Mobile Recharge Receipt - ${
        rechargeData.aiTopUpOrderId || rechargeData._id
      } - YesITryMe`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 32px;">🚀 YesITryMe</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Mobile Recharge Receipt</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; font-size: 13px; color: #555;">
              <div>
                <p style="margin: 0;"><strong>Receipt Number:</strong> ${rechargeData.aiTopUpOrderId || rechargeData._id}</p>
                <p style="margin: 5px 0 0 0;"><strong>Receiption Date:</strong> ${formattedDate}</p>
                <p style="margin: 5px 0 0 0;"><strong>GSTIN:</strong> ${COMPANY_GSTIN}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0;"><strong>YesITryMe</strong></p>
                <p style="margin: 5px 0 0 0;">${COMPANY_ADDRESS}</p>
                <p style="margin: 5px 0 0 0;"><strong>GSTIN:</strong> ${COMPANY_GSTIN}</p>
              </div>
            </div>
            <h2 style="color: #155724; margin: 0;">Recharge Successful!</h2>
            <p style="color: #666; margin: 10px 0 0 0;">Your mobile recharge has been completed</p>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">Customer Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Name:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    userData.firstName
                  } ${userData.lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">User ID:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    userData.userId
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">${
                    userData.email
                  }</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">Recharge Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Mobile Number:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">+91 ${
                    rechargeData.mobileNumber
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Operator:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    rechargeData.operator
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Circle:</td>
                  <td style="padding: 8px 0; color: #333;">${
                    rechargeData.circle || "N/A"
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Recharge Type:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    rechargeData.rechargeType || "prepaid"
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Recharge Amount:</td>
                  <td style="padding: 8px 0; color: #155724; font-weight: bold; font-size: 18px;">${formattedAmount}</td>
                </tr>
                ${
                  rechargeData.discountAmount > 0
                    ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Discount:</td>
                  <td style="padding: 8px 0; color: #28a745; font-weight: bold;">- ${formattedDiscount} (${
                        rechargeData.discountPercentage || 0
                      }%)</td>
                </tr>
                `
                    : ""
                }
                <tr>
                  <td style="padding: 8px 0; color: #666;">Net Amount Paid:</td>
                  <td style="padding: 8px 0; color: #155724; font-weight: bold; font-size: 18px;">${formattedNetAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Payment Method:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${
                    rechargeData.paymentMethod || "Wallet"
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Transaction ID:</td>
                  <td style="padding: 8px 0; color: #333; font-family: monospace;">${
                    rechargeData.aiTopUpOrderId || rechargeData._id
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Recharge Date:</td>
                  <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Status:</td>
                  <td style="padding: 8px 0; color: #155724; font-weight: bold;">${
                    rechargeData.status || "success"
                  }</td>
                </tr>
              </table>
            </div>

            ${
              rechargeData.planDescription
                ? `
            <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #004085; margin: 0; font-size: 14px;">
                <strong>Plan Details:</strong> ${rechargeData.planDescription}
              </p>
            </div>
            `
                : ""
            }

            ${getEmailFooter()}
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Mobile recharge receipt sent to ${userData.email}`);
    return true;
  } catch (error) {
    console.error("Failed to send mobile recharge receipt:", error.message);
    return false;
  }
};
