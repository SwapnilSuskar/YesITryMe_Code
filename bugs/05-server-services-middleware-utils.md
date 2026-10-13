# Server: entry point, middleware, config, services and utils

Scanned: 24 files, 5114 lines. Found: 3 critical, 8 high, 12 medium, 13 low.

## server/index.js

- [HIGH] L241-250 (CONFIRMED) The global error handler always answers with status 500 and, in production, the text "Internal server error"; it never reads `err.statusCode` or `err.message` from an `ApiError`. Impact: every controller wrapped in `asyncHandler` that throws `new ApiError(400|401|404, ...)` (nominee, notification, super package, course content controllers) returns a 500 with a generic message, so for example "Mobile number must be 10 digits" or "Notification not found" reaches the user as a server crash. Fix: in the handler use `const status = err.statusCode || 500` and send `{ success: false, message: err.message, errors: err.errors }` for errors that carry a `statusCode`, keeping the generic text only for unknown errors.

## server/middleware/authMiddleware.js

- [HIGH] L31-38 (CONFIRMED) `protect` only checks that the user document exists; it never looks at `user.status`, although the User schema has the value `"blocked"`, and `login` in authController does not check it either. Impact: a user whom the admin has blocked keeps full access with an existing token and can also log in again, so they can still request payouts, recharge and place orders. Fix: after loading the user, return 403 when `user.status === "blocked"` (and add the same check in `login`).

## server/middleware/rateLimiter.js

- [MEDIUM] L4-13 (LIKELY) `otpLimiter` and every other limiter in this file use the default in-memory store of express-rate-limit, while the app is deployed as Vercel serverless functions (see the export comment in server/index.js). Impact: each function instance has its own counter and the counter is lost on every cold start, so the "5 requests per 15 minutes" limit on `/api/auth/send-otp`, `/forgot-password/send-otp` and `/admin/send-otp` is not enforced reliably and OTP emails can be requested far more often. Fix: give the limiters a shared store (MongoDB or Redis) or enforce the limit in the database per email or mobile.
- [LOW] L19 (CONFIRMED) `withdrawalRateLimit` sets `max: 5` while its own comment says "1 withdrawal request per 5 minutes" and its message tells the user to wait 5 minutes. Impact: a user can send five coin withdrawal requests in five minutes instead of one. Fix: set `max: 1`, or correct the message if five is intended.
- [MEDIUM] L64-74 (CONFIRMED) `authRateLimit` (and `generalRateLimit` at L52) is exported but never imported by any route; `POST /api/auth/login`, `/api/auth/admin/login` and `/api/auth/forgot-password/reset` have no limiter at all. Impact: passwords and OTPs can be guessed without any attempt limit per IP. Fix: apply `authRateLimit` to the login, admin login and password reset routes.

## server/config/cloudinary.js

- No bugs found.

## server/config/db.js

- [LOW] L91-95 (CONFIRMED) When the connection fails in production `connectDB` logs the error and resolves with `null` instead of rejecting. Impact: the middleware in server/index.js L119-124 then calls `next()` as if the database were connected, its `catch` branch that answers "Database connection failed" can never run in production, and each request waits for the Mongoose buffer timeout before failing with an unrelated error. Fix: rethrow the error in production (without `process.exit`) so the middleware can answer 500 immediately.

## server/services/adminOtpService.js

- [HIGH] L4 (LIKELY) `adminOtpStore` is a plain in-memory object, written at L27 and read in `verifyAdminOtp` at L79, but the server runs as serverless functions. Impact: when `/api/auth/admin/send-otp` and `/api/auth/admin/login` are served by different instances, or after a cold start, the record is missing and a correct OTP is rejected as "Invalid or expired OTP"; the `attempts` counter is also per instance, so the limit of 3 wrong tries is not reliable. Fix: store admin OTPs in MongoDB the same way emailOtpService does.
- [MEDIUM] L24 (CONFIRMED) The admin login OTP is generated with `Math.random()`, which is not a cryptographic generator. Impact: the code that grants admin access is predictable to an attacker who can observe other outputs of the same process. Fix: use `crypto.randomInt(100000, 1000000)`.
- [HIGH] L70 (CONFIRMED) `generateAndSendAdminOtp` writes the OTP itself to the log with `console.log(\`Admin OTP ${otp} sent to ${email}\`)`. Impact: anyone who can read the production logs can log in as admin, because the OTP is the only factor in `adminLoginWithOtp`. Fix: remove the OTP from the log line.
- [HIGH] L93-95 (CONFIRMED) On a wrong OTP `verifyAdminOtp` logs `Expected: ${record.otp}` together with the received value. Impact: the valid admin OTP is written to the logs every time somebody enters a wrong code, with the same result as above. Fix: log only the email and the fact that the OTP did not match.

## server/services/emailOtpService.js

- [MEDIUM] L26 (CONFIRMED) The password reset OTP is generated with `Math.random()`. Impact: the code that allows a password change is produced by a predictable generator. Fix: use `crypto.randomInt(100000, 1000000)`.
- [HIGH] L123-144 (LIKELY) `verifyEmailOtp` enforces the limit of 3 attempts by reading the record, comparing, then doing `record.attempts += 1` and `record.save()`; this is a read-then-write and `/api/auth/forgot-password/reset` has no rate limiter. Impact: many reset requests sent at the same moment all read `attempts` below 3 and each one gets a guess, so the 6-digit OTP of any account can be brute-forced and its password changed. Fix: count the attempt atomically first with `EmailOtp.findOneAndUpdate({ email, attempts: { $lt: 3 } }, { $inc: { attempts: 1 } })` and compare the OTP only when that update matched.

## server/services/emailReceiptService.js

- [MEDIUM] L44-49 (CONFIRMED) `calculateGstBreakdown` computes `gstAmount = total * 0.18` and `subtotal = total - gstAmount`, treating 18% of the GST-inclusive total as the tax. Impact: package and super package receipts show wrong tax figures, for example a price of 1180 shows GST 212.40 and subtotal 967.60 instead of GST 180.00 and subtotal 1000.00, and the printed subtotal plus 18% does not equal the total. Fix: compute `subtotal = total / 1.18` and `gstAmount = total - subtotal`, both rounded to 2 decimals.

## server/services/mlmService.js

- [MEDIUM] L137-149 (CONFIRMED) `getUsersByLevelAndRank` starts its queue with the user being evaluated at level 0 and pushes that user into `users` when `user.mlmLevel === rank`. Impact: a user counts themself, so a Team Leader with only 6 Team Leaders below gets `teamLeaders = 7` and is promoted to Assistant Manager by `calculateAndUpdateMLMLevel`; on the next calculation they no longer match and are demoted again, so the rank flips on every run (same for the Assistant Manager and Manager counts). Fix: do not add the node when `level === 0`.
- [MEDIUM] L147 (CONFIRMED) `getUsersByLevelAndRank` and `getZonalHeadsCount` (L124) count only members whose `mlmLevel` is exactly equal to the rank asked for. Impact: when one of a user's 7 Team Leaders is promoted to Assistant Manager the count drops to 6 and the user is demoted from Assistant Manager to Team Leader, so a downline member's promotion lowers the upline's rank. Fix: count members whose rank is equal to or higher than the requested rank, using an ordered list of ranks.
- [MEDIUM] L214-223 (CONFIRMED) `calculateAndUpdateMLMLevel` writes `directActiveMembers`, `teamLeaders`, `assistantManagers`, `managers` and `zonalHeads` only inside `if (newLevel !== currentLevel)`. Impact: these stored counters stay frozen at the value from the last rank change, so `getUserTeamStructure` (L259-263) shows users an outdated team count, for example 10 direct active members when they now have 25. Fix: update the counters on every calculation and keep only `mlmLevel`, `mlmLevelDate` and the upline update inside the condition.
- [MEDIUM] L298-308 (CONFIRMED) `calculateWithdrawalCharges` rounds `adminCharge`, `tds` and `netAmount` separately. Impact: the three parts do not always add up to the gross amount stored on the Payout; for `amount = 125` it returns adminCharge 13, tds 3 and netAmount 110, a total of 126. Fix: round `adminCharge` and `tds` first and compute `netAmount = amount - adminCharge - tds` from the rounded values.

## server/services/notificationService.js

- No bugs found.

## server/services/otpService.js

- [HIGH] L4 (LIKELY) `otpStore` is an in-memory object, written by `sendSignupOtp` at L73 and read by `verifyOtp` at L39, but the server runs as serverless functions. Impact: when `/api/auth/send-otp` and `/api/auth/verify-otp` reach different instances, or after a cold start, a correct signup OTP is rejected as "Invalid or expired OTP". Fix: store signup OTPs in MongoDB with an expiry, as emailOtpService does.
- [HIGH] L76-80 (CONFIRMED) `sendSignupOtp` does not send the OTP to the phone; it returns it in the JSON response as `otp`, and `signup` in authController never calls `verifyOtp`. Impact: the mobile verification proves nothing, so anyone can register an account with any mobile number, including one that belongs to another person, by reading the OTP from the response or by calling `/api/auth/signup` directly. Fix: deliver the OTP by SMS, remove it from the response, and make `signup` require a verified OTP for the mobile number.
- [LOW] L134-136 (CONFIRMED) `sendUserIdAndPassword` logs the user's plain-text password at L136 and again inside the full SMS text at L152; the function is imported by authController but is not called at present. Impact: as soon as it is called, every new user's password is written to the production logs. Fix: remove the password and the message body from the log lines.

## server/services/productOrderCommissionService.js

- [CRITICAL] L35 (CONFIRMED) `distributeProductOrderWalletCommissions` protects against a second run only with the in-memory flag `orderDoc.productCommissionsDistributed`, which is set at L236 after all wallets have been credited and is saved by the caller afterwards. Impact: if any step throws part way (a wallet save error, a database error, or the serverless function timing out during up to 119 sequential wallet saves), `adminVerifyProductOrder` returns 500 without saving, the order stays `payment_submitted`, and the admin's retry credits the buyer and every upline level that was already paid a second time; two verify requests arriving together also both pay in full. Fix: claim the order atomically before paying, with `ProductOrder.findOneAndUpdate({ _id, productCommissionsDistributed: { $ne: true } }, { $set: { productCommissionsDistributed: true } })`, and run the wallet credits in a MongoDB transaction or record each paid level so a retry skips it.
- [CRITICAL] L70-141 (CONFIRMED) The buyer wallet (L70-92) and each sponsor wallet (L119-141) are updated by reading the document, computing `wallet.balance + amt` in JavaScript and calling `save()`, which writes the absolute balance. Impact: a payout approval, recharge, or other commission that changes the same wallet between the read and the save is overwritten, so a withdrawal deduction can be undone (money created) or a commission lost; two concurrent first credits for a user without a wallet also fail with a duplicate key error and abort the distribution. Fix: use one atomic `Wallet.updateOne({ userId }, { $inc: { balance: amt, totalEarned: amt }, $push: { transactions: ... } }, { upsert: true })` per credit.

## server/services/referralService.js

- [LOW] L76-96 (LIKELY) `getGenealogyTree` walks `sponsorId` upward without a set of visited users, unlike `getSponsorGenealogy`. Impact: for a user whose sponsor chain contains a loop (the comment at L29-30 says such data exists) `getUserGenealogy` returns the same sponsors repeated up to 120 times, including the user as their own sponsor. Fix: stop the loop when `currentUserId` has already been visited.
- [MEDIUM] L260-262 (CONFIRMED) In `getUserReferralTree`, `tree.totalReferrals` is set to `User.countDocuments({ sponsorId: { $exists: true, $ne: null, $ne: "" } })`, which has no filter on this user (and the duplicate `$ne` key keeps only the last one). Impact: every user receives the number of all users in the whole system as their own total referrals, which is a wrong figure and reveals the platform's user count. Fix: count the nodes actually attached to this user's tree, or use `getTotalDownlineCount(userId)`.
- [LOW] L453-477 (CONFIRMED) `getSponsorGenealogy` counts the purchaser as iteration 1 of `level <= 120`, so it returns sponsors for commission levels 1 to 119 only. Impact: the sponsor at level 120 never receives the level 120 amount defined in the package commission structure; it is sent to the admin as unassigned. Fix: loop while `level <= 121`, or count sponsors separately from the purchaser.
- [MEDIUM] L633-635 (LIKELY) `getCommissionStructure` returns `packageData.commissionStructure` whenever it is truthy, and an empty Mongoose array is truthy. Impact: for a package saved without a commission structure the hardcoded fallback at L638-692 is never used, so `calculateCommissionDistribution` produces no distributions, `calculateTotalPossibleCommission` returns 0, and a paid purchase gives no commission to any sponsor or to the admin. Fix: use the database value only when `commissionStructure.length > 0`.
- [LOW] L740-741 (CONFIRMED) `unassignedCommission` is the difference of two floating point sums of amounts such as 0.2, 0.1 and 0.05 and is not rounded. Impact: values like 320.00000000000006 are added to the admin wallet's `totalEarned` and `passiveIncome` and stored as the transaction amount, and a tiny positive remainder can create a meaningless admin commission entry. Fix: round the difference to 2 decimals and compare it against 0.01.
- [CRITICAL] L826-859 (CONFIRMED) `distributeCommissions` credits each sponsor by reading the wallet, doing `wallet.balance += distribution.amount` in JavaScript and calling `save()`, which writes the absolute values of `balance`, `totalEarned`, `activeIncome` and `passiveIncome`. Impact: when two purchases under the same upline are verified at the same time, or a payout approval or recharge changes the wallet between the read and the save, one update overwrites the other, so a sponsor loses a commission or a withdrawal deduction is undone and the money can be withdrawn again. Fix: credit with a single atomic `Wallet.updateOne({ userId }, { $inc: {...}, $push: { transactions: ... } }, { upsert: true })`.
- [MEDIUM] L883-890 (CONFIRMED) When crediting one sponsor throws, `distributeCommissions` only marks that distribution `"failed"` and continues; nothing retries it and the amount is not included in `unassignedCommission`, which was computed earlier at L740. Impact: that sponsor is never paid for the purchase (for example after a duplicate key error when two requests create the same wallet together), the purchase still returns `success: true`, and `totalCommissionDistributed` on the Purchase still includes the unpaid amount. Fix: retry the failed credit, and if it still fails return the failure to the caller and store the purchase total without that amount so it can be paid later.
- [LOW] L919 (LIKELY) `getCommissionSummary` returns `wallet.transactions.slice(0, 10)`; transactions are appended with `push`, so this is the ten oldest entries. Impact: the commission summary shows a user's first ten transactions ever and never their recent ones. Fix: return `wallet.transactions.slice(-10).reverse()`.
- [LOW] L955-956 (CONFIRMED) `getDirectReferralsLast7Days` and all the `...ByPeriod` functions (L987, L1126, L1203, L1282, L1462, L1538, L1616) build the day buckets with `setUTCHours(0, 0, 0, 0)` and `toISOString().slice(0, 10)`. Impact: for users in India a signup or purchase made between 00:00 and 05:30 IST is counted on the previous day, and "today" stays empty until 05:30. Fix: build the day boundaries and labels in the Asia/Kolkata time zone.
- [LOW] L1146-1148 (CONFIRMED) For `period = "alltime"` the `...ByPeriod` functions set `days = 365` (also at L1223, L1302, L1482, L1558, L1636). Impact: the "all time" charts leave out every purchase older than one year. Fix: for "alltime" start the range at the user's first downline purchase, or return totals without a date limit.

## server/utils/ApiError.js

- No bugs found.

## server/utils/ApiResponse.js

- No bugs found.

## server/utils/asyncHandler.js

- No bugs found.

## server/utils/buildUpiPayUri.js

- No bugs found.

## server/utils/fixUserIdSequence.js

- [LOW] L29-41 (CONFIRMED) `fixUserIdSequence` computes `highestNumber` and then ends without writing or returning anything, and `connectDB` at L10 reads `process.env.MONGODB_URI` while the server uses `MONGO_URI_PROD` / `MONGO_URI`. Impact: the script named as a fix changes nothing, and it connects to a different (or undefined) database variable than the application; `run()` at L54 also executes as soon as the file is imported. Fix: delete the file, or make it use the application's connection settings and perform the intended correction.

## server/utils/imageCompression.js

- No bugs found.

## server/utils/purchaseIdGenerator.js

- No bugs found.

## server/utils/scaleStandardCommissionPool.js

- No bugs found.

## server/utils/updateMlmLevels.js

- [LOW] L7 (LIKELY) The file calls `mongoose.connect(process.env.MONGODB_URI)` at import time, without loading dotenv and with a variable name different from the `MONGO_URI_PROD` / `MONGO_URI` used by server/config/db.js. Impact: importing or running the migration either fails with an unhandled rejection because the URI is undefined, or connects to a different database than the application. Fix: reuse `connectDB` from server/config/db.js and connect inside `updateMlmLevels`.
- [LOW] L32-36 (CONFIRMED) The migration compares and writes `mlmLevel: "free"` in lower case, but the User schema enum and mlmService use `"Free"`, and `findByIdAndUpdate` does not run validators. Impact: every user without purchases is counted and logged as changed on each run, and if the following `calculateAndUpdateMLMLevel` call fails the user is left with an `mlmLevel` value that is not in the enum, which makes later `user.save()` calls fail validation. Fix: use `"Free"` in both places.
- [LOW] L65 (CONFIRMED) The direct-run check compares `import.meta.url` with `file://${process.argv[1]}`, which never matches on Windows (backslashes, drive letter, three slashes) or for paths with spaces. Impact: running the file directly does nothing while leaving the database connection from L7 open. Fix: compare with `pathToFileURL(process.argv[1]).href`.

## server/utils/userIdGenerator.js

- No bugs found.

## server/utils/shopDistribution.js

- No bugs found.
