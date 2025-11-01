# Recharge Portal Setup Guide

## ✅ Implementation Complete

The recharge portal has been fully implemented with the following features:

### 📁 Files Created

1. **`server/models/Recharge.js`** - Database model for recharge transactions
2. **`server/controllers/rechargeController.js`** - Main controller with:
   - aiTopUp API integration (fetch plans, process recharges)
   - PhonePe payment gateway integration
   - Admin commission system
   - Automatic refund handling
3. **`server/routes/recharge.js`** - API routes
4. **Updated `server/index.js`** - Added recharge routes
5. **Updated `server/package.json`** - Added axios dependency

### 🔑 Environment Variables Required

Update your `.env` file with the following credentials:

```env
# aiTopUp API Configuration
AITOPUP_BASE_URL=https://api.aitopup.com
AITOPUP_API_KEY=your_aitopup_api_key_here

# PhonePe Payment Gateway Configuration
PHONEPE_MERCHANT_ID=your_phonepe_merchant_id_here
PHONEPE_SALT_KEY=your_phonepe_salt_key_here
PHONEPE_SALT_INDEX=1
PHONEPE_BASE_URL=https://api.phonepe.com/apis/hermes
PHONEPE_MODE=production

# Backend URL for callbacks (update in production)
BACKEND_URL=http://localhost:5000
```

### 📡 API Endpoints

#### User Endpoints (Protected - requires authentication)
- `GET /api/recharge/plans` - Fetch recharge plans from aiTopUp
  - Query params: `mobileNumber`, `operator`, `circle`, `rechargeType`
- `POST /api/recharge/initiate` - Initiate recharge and payment
  - Body: `mobileNumber`, `operator`, `circle`, `amount`, `rechargeType`, `planId`, `planDescription`, `paymentMethod`
- `GET /api/recharge/status/:rechargeId` - Check recharge status
- `GET /api/recharge/history` - Get user's recharge history
  - Query params: `page`, `limit`, `status`

#### Public Endpoints
- `POST /api/recharge/payment-callback` - PhonePe payment callback handler

#### Admin Endpoints (Protected - requires admin role)
- `GET /api/recharge/admin/all` - Get all recharge transactions
  - Query params: `page`, `limit`, `status`, `operator`, `startDate`, `endDate`
- `GET /api/recharge/admin/stats` - Get recharge statistics
  - Query params: `startDate`, `endDate`

### 🔄 Recharge Flow

1. **User initiates recharge** → `POST /api/recharge/initiate`
   - Creates recharge record with status `pending`
   - Calculates admin commission
   - Initiates PhonePe payment

2. **Payment callback** → `POST /api/recharge/payment-callback`
   - Verifies payment status
   - If successful, calls aiTopUp API to process recharge
   - Updates recharge status accordingly

3. **Recharge processing** → aiTopUp API
   - Processes recharge with operator
   - Returns success/failure status

4. **On success**:
   - Status updated to `success`
   - Admin commission distributed to admin wallet
   - Transaction complete

5. **On failure**:
   - Status updated to `failed`
   - Automatic refund initiated via PhonePe
   - Status updated to `refunded` when refund completes

### 💰 Admin Commission System

Commission is calculated based on operator and plan type:
- **Mobile (Prepaid/Postpaid)**: 0.5% (regular plans) or 1.0% (special plans)
- **DTH**: 1.0% (regular) or 1.5% (special)

Commission is automatically:
1. Calculated on recharge initiation
2. Stored in recharge record
3. Distributed to admin wallet on successful recharge
4. Tracked in admin wallet transactions

### 🛡️ Error Handling

- **Payment failures**: Automatically refunded
- **Recharge failures**: Payment refunded, transaction marked as failed
- **API failures**: Logged, user notified, transaction status updated
- **Idempotency**: Transaction IDs prevent duplicate processing

### 📦 Dependencies

Run `npm install` to install new dependencies:
- `axios` - For API calls to aiTopUp and PhonePe

### 🔧 Next Steps

1. **Get API credentials**:
   - Register with aiTopUp and get API key
   - Register with PhonePe and get merchant ID, salt key, salt index

2. **Update environment variables** in `.env` file

3. **Install dependencies**: `npm install` (if not already installed)

4. **Test the integration**:
   - Test plan fetching
   - Test payment flow (use PhonePe test mode initially)
   - Test recharge processing
   - Verify commission distribution

5. **Update frontend** to integrate with these API endpoints

### 📝 Notes

- All amounts are stored in rupees (not paise)
- PhonePe requires amounts in paise (handled automatically)
- Admin commission is added to `passiveIncome` in wallet
- Failed recharges automatically trigger refunds
- All transactions are logged with timestamps

### 🐛 Troubleshooting

1. **Plans not loading**: Check aiTopUp API key and base URL
2. **Payment not initiating**: Check PhonePe credentials and callback URL
3. **Recharge failing**: Check aiTopUp API response and logs
4. **Commission not distributing**: Verify admin user exists in databas