import {
    AlertCircle,
    CheckCircle,
    Clock,
    CreditCard,
    FileText,
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
import { useRef, useState } from "react";
import PackagePaymentScanner from "../../assets/PackagePayment/PackagePaymentScanner.jpg";
import api, { API_ENDPOINTS } from "../../config/api";
import { useAuthStore } from "../../store/useAuthStore";

const WalletTopUpVerificationForm = ({ onClose, onSuccess }) => {
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

        if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("paymentProof", paymentProof);

            // Append all form fields, ensuring paymentAmount is properly rounded
            Object.keys(formData).forEach(key => {
                if (key === 'paymentAmount') {
                    // Round to 2 decimal places to avoid floating-point precision issues
                    const amount = parseFloat(formData[key]);
                    const roundedAmount = Math.round(amount * 100) / 100;
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
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit wallet top-up request");
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
                return formData.paymentMethod && formData.transactionId && formData.paymentAmount && parseFloat(formData.paymentAmount) > 0;
            case 3: // Personal Details
                return formData.payerName && formData.payerMobile && formData.payerEmail;
            case 4: // Payment Proof
                return paymentProof;
            default:
                return false;
        }
    };

    if (success) {
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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                            Add Money to Wallet
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">
                        Complete your payment and submit proof for verification
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
                                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Enter amount in next step</p>
                                                <p className="text-lg sm:text-xl font-bold text-gray-800">Wallet Top-Up</p>
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
                                        <input
                                            type="number"
                                            name="paymentAmount"
                                            value={formData.paymentAmount}
                                            onChange={handleInputChange}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                                            placeholder="Enter amount"
                                            min="1"
                                            step="0.01"
                                            required
                                        />
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
                                            className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all"
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
                                                Submit Top-Up Request
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

