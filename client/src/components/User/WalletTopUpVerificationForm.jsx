import {
    AlertCircle,
    CheckCircle, FileText,
    Loader2,
    Mail,
    Phone,
    QrCode,
    Send,
    Upload,
    User,
    XCircle,
    Wallet
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import PackagePaymentScanner from "../../assets/PackagePayment/PackagePaymentScanner.jpg";
import api, { API_ENDPOINTS } from "../../config/api";
import { useAuthStore } from "../../store/useAuthStore";

const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

/**
 * variant "topup" — Add money to Smart Wallet (wallet top-up API).
 * variant "productOrder" — Pay for a product order (same QR + steps + proof → product-orders payment API).
 */
const WalletTopUpVerificationForm = ({
    onClose,
    onSuccess,
    variant = "topup",
    productOrderId,
    fixedAmount,
    orderNumber,
    initialPayer,
    embed = false,
}) => {
    const { user } = useAuthStore();
    const fileInputRef = useRef(null);

    // TODO: Replace with actual QR code image URL from admin
    const qrCodeUrl = PackagePaymentScanner; // Using the imported image for now

    const [formData, setFormData] = useState({
        paymentAmount: "",
        paymentMethod: "UPI",
        transactionId: "",
        payerName: user?.firstName + " " + user?.lastName || "",
        payerMobile: user?.mobile || "",
        payerEmail: user?.email || "",
        additionalNotes: ""
    });

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    const [paymentProof, setPaymentProof] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const isProductOrder = variant === "productOrder";

    useEffect(() => {
        if (!isProductOrder || fixedAmount == null || Number.isNaN(Number(fixedAmount))) return;
        setFormData((prev) => ({
            ...prev,
            paymentAmount: String(roundMoney(fixedAmount)),
            payerName: initialPayer?.name ?? prev.payerName,
            payerMobile: initialPayer?.mobile ?? prev.payerMobile,
            payerEmail: initialPayer?.email ?? prev.payerEmail,
        }));
    }, [isProductOrder, fixedAmount, initialPayer?.name, initialPayer?.mobile, initialPayer?.email]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                setError("File size should be less than 10MB");
                return;
            }
            setPaymentProof(file);
            setError("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!paymentProof) {
            setError("Please upload payment proof");
            return;
        }

        const amount = parseFloat(formData.paymentAmount);
        if (!formData.paymentAmount || amount <= 0 || isNaN(amount)) {
            setError("Please enter a valid amount");
            return;
        }

        if (isProductOrder) {
            if (!productOrderId) {
                setError("Missing order. Please refresh and try again.");
                return;
            }
        } else {
            const MINIMUM_TOPUP_AMOUNT = 300;
            if (amount < MINIMUM_TOPUP_AMOUNT) {
                setError(`Minimum top-up amount is ₹${MINIMUM_TOPUP_AMOUNT}. Please enter a valid amount.`);
                return;
            }
        }

        setLoading(true);
        setError("");

        try {
            if (isProductOrder) {
                const fd = new FormData();
                fd.append("paymentProof", paymentProof);
                fd.append("paymentMethod", formData.paymentMethod);
                fd.append("transactionId", String(formData.transactionId || "").trim());
                const payerNotes = [
                    formData.additionalNotes?.trim(),
                    `Order: ${orderNumber || ""} | Pay ₹${roundMoney(amount)}`,
                    `Payer: ${formData.payerName} | ${formData.payerMobile} | ${formData.payerEmail}`,
                ]
                    .filter(Boolean)
                    .join("\n");
                fd.append("payerNotes", payerNotes);

                const response = await api.post(
                    API_ENDPOINTS.productOrders.paymentProof(productOrderId),
                    fd
                );

                if (response.data.success) {
                    if (onSuccess) onSuccess(response.data.data);
                    if (embed) {
                        return;
                    }
                    setSuccess(true);
                }
            } else {
                const formDataToSend = new FormData();
                formDataToSend.append("paymentProof", paymentProof);

                Object.keys(formData).forEach(key => {
                    if (key === 'paymentAmount') {
                        const amt = parseFloat(formData[key]);
                        const roundedAmount = Math.round(amt * 100) / 100;
                        formDataToSend.append(key, roundedAmount.toString());
                    } else {
                        formDataToSend.append(key, formData[key]);
                    }
                });

                const response = await api.post(API_ENDPOINTS.walletTopUp.submit, formDataToSend, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                if (response.data.success) {
                    setSuccess(true);
                    if (onSuccess) onSuccess(response.data.data);
                }
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    (isProductOrder
                        ? "Failed to submit payment proof"
                        : "Failed to submit wallet top-up request")
            );
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const canProceedToNext = () => {
        switch (currentStep) {
            case 1: // QR Code & Payment
                return true; // Always can proceed from step 1
            case 2: // Payment Details
                if (isProductOrder) {
                    return !!(
                        formData.paymentMethod &&
                        formData.transactionId?.trim() &&
                        parseFloat(formData.paymentAmount) > 0
                    );
                }
                return (
                    formData.paymentMethod &&
                    formData.transactionId &&
                    formData.paymentAmount &&
                    parseFloat(formData.paymentAmount) >= 300
                );
            case 3: // Personal Details
                return formData.payerName && formData.payerMobile && formData.payerEmail;
            case 4: // Payment Proof
                return paymentProof;
            default:
                return false;
        }
    };

    if (success && !embed) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
                <div className="bg-white rounded-2xl p-4 sm:p-8 max-w-md w-full text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Wallet Top-Up Request Submitted!</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                        We have received your wallet top-up request. Our team will review it and credit your Smart Wallet Balance within 24-48 hours.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white py-2 sm:py-3 rounded-xl font-semibold hover:shadow-lg transition-all text-sm sm:text-base"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const shellClass = embed
        ? "w-full"
        : "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4";

    const panelClass = embed
        ? "bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-orange-100 shadow-xl"
        : "bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto";

    return (
        <div className={shellClass}>
            <div className={panelClass}>
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                            {isProductOrder
                                ? "Pay for your order (Smart Wallet)"
                                : "Add Money to Smart Wallet"}
                        </h2>
                        {onClose && !(embed && isProductOrder) && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        )}
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">
                        {isProductOrder
                            ? "Use the same Smart Wallet payment QR and verification steps as when you add money. Pay the exact amount shown, then submit your transaction details and proof."
                            : "Complete your payment and submit proof for verification"}
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-4">
                            {[1, 2, 3, 4].map((step) => (
                                <div key={step} className="flex items-center">
                                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${currentStep >= step
                                        ? "bg-orange-500 text-white"
                                        : "bg-gray-200 text-gray-600"
                                        }`}>
                                        {step}
                                    </div>
                                    {step < 4 && (
                                        <div className={`w-6 sm:w-12 h-1 mx-1 sm:mx-2 ${currentStep > step ? "bg-orange-500" : "bg-gray-200"
                                            }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-right">
                            Step {currentStep} of {totalSteps}
                        </div>
                    </div>

                    {/* Step Titles */}
                    <div className="mt-4 flex flex-wrap justify-center sm:justify-between text-xs text-gray-500 gap-2">
                        <span className={currentStep >= 1 ? "text-orange-600 font-medium" : ""}>QR Code & Payment</span>
                        <span className={currentStep >= 2 ? "text-orange-600 font-medium" : ""}>Payment Details</span>
                        <span className={currentStep >= 3 ? "text-orange-600 font-medium" : ""}>Personal Details</span>
                        <span className={currentStep >= 4 ? "text-orange-600 font-medium" : ""}>Payment Proof</span>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 sm:p-6">
                        {/* Step 1: QR Code & Payment */}
                        {currentStep === 1 && (
                            <div className="text-center space-y-4 sm:space-y-6">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-blue-200">
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center gap-2">
                                        <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                        Step 1: Scan QR Code to Pay
                                    </h3>

                                    <div className="space-y-4 sm:space-y-6">
                                        <div className="bg-white rounded-xl p-3 sm:p-6 inline-block shadow-lg">
                                            <img
                                                src={qrCodeUrl}
                                                alt="Payment QR Code"
                                                className="w-48 h-48 sm:w-64 sm:h-64 mx-auto rounded-lg"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-sm sm:text-base text-gray-600">
                                                Scan this QR code with your payment app
                                            </p>
                                            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 max-w-xs mx-auto">
                                                {isProductOrder ? (
                                                    <>
                                                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Pay exactly (order #{orderNumber})</p>
                                                        <p className="text-lg sm:text-xl font-bold text-gray-800">
                                                            ₹{roundMoney(parseFloat(formData.paymentAmount) || fixedAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Enter amount in next step</p>
                                                        <p className="text-lg sm:text-xl font-bold text-gray-800">Wallet Top-Up</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Instructions */}
                                <div className="bg-yellow-50 rounded-xl p-4 sm:p-6 border border-yellow-200 max-w-2xl mx-auto">
                                    <h4 className="font-semibold text-yellow-800 mb-3 sm:mb-4 flex items-center justify-center gap-2 text-sm sm:text-base">
                                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                        Important Instructions
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-yellow-700">
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-yellow-600 rounded-full flex-shrink-0"></span>
                                                Complete the payment using the QR code above
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-yellow-600 rounded-full flex-shrink-0"></span>
                                                Take a screenshot of the payment confirmation
                                            </li>
                                        </ul>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-yellow-600 rounded-full flex-shrink-0"></span>
                                                Fill in the transaction details in next step
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-yellow-600 rounded-full flex-shrink-0"></span>
                                                Upload the payment proof screenshot
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Payment Details */}
                        {currentStep === 2 && (
                            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 text-center mb-4 sm:mb-6">
                                    Step 2: Payment Details
                                </h3>

                                <div className="space-y-3 sm:space-y-4">
                                    {/* Payment Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payment Amount (₹)
                                        </label>
                                        {isProductOrder ? (
                                            <>
                                                <div className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm sm:text-base font-bold text-emerald-900">
                                                    ₹{roundMoney(parseFloat(formData.paymentAmount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                                                    <span className="font-normal text-emerald-700 text-xs">(fixed for this order)</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <input
                                                    type="number"
                                                    name="paymentAmount"
                                                    value={formData.paymentAmount}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base ${formData.paymentAmount && parseFloat(formData.paymentAmount) < 300
                                                        ? 'border-red-300 bg-red-50'
                                                        : 'border-gray-300'
                                                        }`}
                                                    placeholder="Enter amount (minimum ₹300)"
                                                    min="300"
                                                    step="0.01"
                                                    required
                                                />
                                                <p className="mt-1.5 text-xs text-gray-600">
                                                    <span className="font-semibold text-orange-600">Minimum amount: ₹300</span>
                                                </p>
                                                {formData.paymentAmount && parseFloat(formData.paymentAmount) < 300 && (
                                                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Please enter at least ₹300 to proceed
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Payment Method */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payment Method
                                        </label>
                                        <select
                                            name="paymentMethod"
                                            value={formData.paymentMethod}
                                            onChange={handleInputChange}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                                            required
                                        >
                                            <option value="UPI">UPI</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Paytm">Paytm</option>
                                            <option value="PhonePe">PhonePe</option>
                                            <option value="Google Pay">Google Pay</option>
                                        </select>
                                    </div>

                                    {/* Transaction ID */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Transaction ID / UTR / Reference Number
                                        </label>
                                        <input
                                            type="text"
                                            name="transactionId"
                                            value={formData.transactionId}
                                            onChange={handleInputChange}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                                            placeholder="Enter transaction ID from your payment app"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Personal Details */}
                        {currentStep === 3 && (
                            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 text-center mb-4 sm:mb-6">
                                    Step 3: Personal Details
                                </h3>

                                <div className="space-y-3 sm:space-y-4">
                                    {/* Payer Details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <User className="w-4 h-4 inline mr-1" />
                                                Payer Name
                                            </label>
                                            <input
                                                type="text"
                                                name="payerName"
                                                value={formData.payerName}
                                                onChange={handleInputChange}
                                                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                                                placeholder="Your full name"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Phone className="w-4 h-4 inline mr-1" />
                                                Mobile Number
                                            </label>
                                            <input
                                                type="tel"
                                                name="payerMobile"
                                                value={formData.payerMobile}
                                                onChange={handleInputChange}
                                                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                                                placeholder="Your mobile number"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Mail className="w-4 h-4 inline mr-1" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="payerEmail"
                                            value={formData.payerEmail}
                                            onChange={handleInputChange}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                                            placeholder="Your email address"
                                            required
                                        />
                                    </div>

                                    {/* Additional Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <FileText className="w-4 h-4 inline mr-1" />
                                            Additional Notes (Optional)
                                        </label>
                                        <textarea
                                            name="additionalNotes"
                                            value={formData.additionalNotes}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                                            placeholder="Any additional information about your payment..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Payment Proof */}
                        {currentStep === 4 && (
                            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 text-center mb-4 sm:mb-6">
                                    Step 4: Upload Payment Proof
                                </h3>

                                <div className="space-y-3 sm:space-y-4">
                                    {/* Payment Proof Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Upload className="w-4 h-4 inline mr-1" />
                                            Payment Proof (Screenshot)
                                        </label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed  rounded-xl p-4 sm:p-8 text-center cursor-pointer border-orange-400 bg-orange-50 transition-all"
                                        >
                                            {paymentProof ? (
                                                <div className="space-y-3">
                                                    <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-green-500 mx-auto" />
                                                    <p className="text-xs sm:text-sm text-gray-600 font-medium">{paymentProof.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Click to change file
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto" />
                                                    <p className="text-xs sm:text-sm text-gray-600 font-medium">
                                                        Click to upload payment screenshot
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        PNG, JPG, JPEG up to 10MB
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                                            <p className="text-red-600 text-xs sm:text-sm flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                {error}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 sm:pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
                            >
                                Previous
                            </button>

                            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                                {currentStep < totalSteps ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        disabled={!canProceedToNext()}
                                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
                                    >
                                        Next Step
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading || !canProceedToNext()}
                                        className="flex-1 sm:flex-none px-4 sm:px-8 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                                                {isProductOrder ? "Submit payment proof" : "Submit Top-Up Request"}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WalletTopUpVerificationForm;

