# Server: routes, models and scripts

Scanned: 77 files, 6900 lines. Found: 8 critical, 2 high, 8 medium, 10 low.

## server/routes/admin.js

- No bugs found.

## server/routes/aiTools.js

- No bugs found.

## server/routes/auth.js

- [MEDIUM] L83 (CONFIRMED) The `POST /login` route calls `login` with no rate limiter; `authRateLimit` is defined in `server/middleware/rateLimiter.js` but is never imported or used anywhere. Impact: anyone can try unlimited passwords against a known `userId` or mobile number, and the handler tells the caller whether the account exists ("Invalid User ID or mobile number" versus "Invalid password"). Fix: import `authRateLimit` and add it as middleware on the `/login` route.
- [MEDIUM] L108 (CONFIRMED) The `GET /debug/otp-store` route runs `debugOtpStore` with no `protect` or `admin` middleware. Impact: any anonymous visitor receives the email address, attempt count and expiry time of every user who has a password-reset OTP record in the `EmailOtp` collection. Fix: delete the route, or put `protect, admin` in front of it.
- [CRITICAL] L121 (CONFIRMED) The `PATCH /motivation-quotes/:id/toggle` route runs `toggleMotivationQuoteStatus` from `authController.js` with no `protect` or `admin` middleware, although the handler is commented as admin only. Impact: any anonymous request with a quote id (the ids are returned by the public `GET /motivation-quotes/active`) can switch a quote on or off on the live site. Fix: remove this route, because the protected copy already exists at `/api/admin/motivation-quotes/:id/toggle`, or add `protect, admin`.
- [CRITICAL] L123 (CONFIRMED) The `DELETE /motivation-quotes/:id` route runs `deleteMotivationQuote` from `authController.js` with no `protect` or `admin` middleware. Impact: any anonymous request can permanently delete every motivation quote, using the ids returned by the public `GET /motivation-quotes/active`. Fix: remove this route, because the protected copy already exists at `/api/admin/motivation-quotes/:id`, or add `protect, admin`.

## server/routes/categories.js

- No bugs found.

## server/routes/coins.js

- No bugs found.

## server/routes/contact.js

- No bugs found.

## server/routes/courseContent.js

- [HIGH] L15 (LIKELY) The `GET /course/:courseId` route runs `getCourseContentByCourseId` with no `protect` middleware and no purchase check, and the handler returns every active lesson including its `link` field. Impact: anyone can read the lesson links of every course without logging in or buying a package; the only gate is the `hasPurchasedPackage` flag inside `client/src/components/Pages/CourseDetail.jsx`, which runs in the browser. Fix: add `protect`, and in the handler return `link` only when the user has an approved purchase (keep lesson 1 as the free preview if that is intended).

## server/routes/funds.js

- [CRITICAL] L19 (CONFIRMED) The `GET /user/:userId` route runs `getUserFunds` behind `protect` only, and the handler loads funds by `req.params.userId` without comparing it to `req.user.userId`. Impact: any logged-in user can read the mobile, laptop, bike, car, house and travel fund balances of any other user by putting that user's id in the URL, and the call also creates an empty `Funds` document for that user. Fix: in the route or handler, reject the request unless `req.params.userId === req.user.userId` or `req.user.role === "admin"`.

## server/routes/kyc.js

- No bugs found.

## server/routes/mlm.js

- No bugs found.

## server/routes/nominee.js

- [CRITICAL] L13 (CONFIRMED) The `GET /:userId` route runs `getNominee` behind `protect` only, and the handler looks up the nominee by `req.params.userId` without comparing it to `req.user.userId`. Impact: any logged-in user can read another user's nominee name, relation, mobile number and address by changing the id in the URL. Fix: reject the request unless `req.params.userId === req.user.userId` or `req.user.role === "admin"`.
- [CRITICAL] L16 (CONFIRMED) The `POST /:userId` route runs `createOrUpdateNominee` behind `protect` only, and the handler writes the nominee for `req.params.userId`. Impact: any logged-in user can replace another user's nominee with their own details, which changes who is recorded as the beneficiary of that account. Fix: reject the request unless `req.params.userId === req.user.userId` or `req.user.role === "admin"`.
- [CRITICAL] L19 (CONFIRMED) The `DELETE /:userId` route runs `deleteNominee` behind `protect` only, and the handler sets `isActive: false` on the nominee of `req.params.userId`. Impact: any logged-in user can remove another user's nominee. Fix: reject the request unless `req.params.userId === req.user.userId` or `req.user.role === "admin"`.
- [CRITICAL] L22 (CONFIRMED) The `GET /` route runs `getAllNominees` behind `protect` only, with no `admin` middleware, although it is commented as admin only and `admin` is not even imported in this file. Impact: any logged-in user receives the name, relation, mobile number and address of every active nominee on the platform. Fix: import `admin` from `authMiddleware.js` and declare the route as `router.get('/', protect, admin, getAllNominees)`.

## server/routes/notifications.js

- No bugs found.

## server/routes/packages.js

- No bugs found.

## server/routes/payment.js

- No bugs found.

## server/routes/payout.js

- No bugs found.

## server/routes/products.js

- No bugs found.

## server/routes/recharge.js

- No bugs found.

## server/routes/services.js

- No bugs found.

## server/routes/specialIncome.js

- [CRITICAL] L6 (CONFIRMED) The `GET /:userId` route runs `getSpecialIncome` behind `protect` only, and the handler returns `SpecialIncome.findOne({ userId: req.params.userId })` without comparing the id to `req.user.userId`. Impact: any logged-in user can read another user's leadership fund, royalty income and reward income balances by changing the id in the URL. Fix: reject the request unless `req.params.userId === req.user.userId` or `req.user.role === "admin"`.

## server/routes/superPackages.js

- No bugs found.

## server/routes/videoTasks.js

- No bugs found.

## server/routes/walletTopUp.js

- No bugs found.

## server/routes/productOrders.js

- No bugs found.

## server/models/AiTool.js

- No bugs found.

## server/models/Category.js

- No bugs found.

## server/models/Coin.js

- [LOW] L117 (CONFIRMED) The `deductCoins` method always adds the amount to `totalWithdrawn`, but it is called for shop orders (`"product_order"` in `productOrderController.js`) and for admin debits (`"admin_adjust"` in `coinsController.js`), which are not withdrawals. Impact: after a user pays for a shop order with coins, or an admin removes coins, `GET /api/coins/balance` reports those coins as withdrawn, so the "total withdrawn" figure shown to the user is too high. Fix: increase `totalWithdrawn` only when `type === "withdrawal"`, and make `restoreCoins` reduce it only in the same case.

## server/models/CourseContent.js

- No bugs found.

## server/models/EmailOtp.js

- No bugs found.

## server/models/EngagementVideo.js

- No bugs found.

## server/models/Funds.js

- [LOW] L5-10 (LIKELY) The `userId` field has no unique index, and the static `getOrCreateFunds` (L65-72) does a `findOne` followed by a separate `save`. Impact: when two requests for a user with no `Funds` document arrive together (for example the payout page and an admin credit), two documents are created for the same user; `findOne` then credits one of them while `getAllUsersWithFunds` builds its map from the other, so the admin list can show zero for a user who has funds. Fix: add `unique: true` to `userId` and create the document with `findOneAndUpdate({ userId }, { $setOnInsert: { userId } }, { upsert: true, new: true })`.

## server/models/GalleryImage.js

- No bugs found.

## server/models/Kyc.js

- No bugs found.

## server/models/MotivationQuote.js

- No bugs found.

## server/models/Nominee.js

- [MEDIUM] L22-36 (CONFIRMED) The `bloodRelation` enum does not contain `"Other"`, but the form in `client/src/components/User/Nominee.jsx` (L26) offers `'Other'` as an option, and `createOrUpdate` runs validators. Impact: a user who selects "Other" as the relation gets a validation error and the nominee is not saved. Fix: add `"Other"` to the enum, or remove the option from the client list.
- [MEDIUM] L85-91 (CONFIRMED) The static `createOrUpdate` updates the existing document with `{ ...nomineeData, userId }` and never sets `isActive` back to `true`. Impact: after a user deletes their nominee (`deleteNominee` sets `isActive: false`) and adds a new one, the save reports success but `getByUserId` filters on `isActive: true` and returns `null`, so the user can never have a visible nominee again. Fix: include `isActive: true` in the update object of `createOrUpdate`.

## server/models/Notification.js

- No bugs found.

## server/models/Package.js

- No bugs found.

## server/models/PaymentVerification.js

- No bugs found.

## server/models/Payout.js

- No bugs found.

## server/models/Purchase.js

- No bugs found.

## server/models/Recharge.js

- No bugs found.

## server/models/RechargeWallet.js

- No bugs found.

## server/models/ServiceConfig.js

- No bugs found.

## server/models/ServiceRequest.js

- No bugs found.

## server/models/SocialAction.js

- No bugs found.

## server/models/SocialTask.js

- No bugs found.

## server/models/SpecialIncome.js

- No bugs found.

## server/models/SuperPackage.js

- No bugs found.

## server/models/SuperPackagePaymentVerification.js

- No bugs found.

## server/models/SuperPackagePurchase.js

- No bugs found.

## server/models/User.js

- [MEDIUM] L93-96 (CONFIRMED) The `email` validator regex `/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/` only accepts a final domain label of 2 or 3 characters and does not allow `+` in the local part. Impact: signup, and any later `user.save()`, fails with "Please enter a valid email address" for real addresses such as `name@company.info`, `name@shop.online` or `name+tag@gmail.com`. Fix: replace the regex with a looser one such as `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`.

## server/models/VideoEngagement.js

- No bugs found.

## server/models/WalletTopUp.js

- [HIGH] L20-24 (CONFIRMED) The `transactionId` field has no unique index (unlike `PaymentVerification` and `SuperPackagePaymentVerification`), and `submitWalletTopUp` only rejects a repeat when the same user has a `pending` request with that id. Impact: the same bank or UPI transaction id can be submitted again after the first request is approved, or by a different user, and each approval credits `paymentAmount` to a `RechargeWallet`, so one real payment can be turned into wallet balance more than once. Fix: add `walletTopUpSchema.index({ transactionId: 1 }, { unique: true })` (clean existing duplicates first) and make the controller reject any existing `pending` or `approved` record with the same id.

## server/models/WithdrawalRequest.js

- No bugs found.

## server/models/Product.js

- No bugs found.

## server/models/ProductOrder.js

- No bugs found.

## server/models/Wallet.js

- No bugs found.

## server/scripts/checkAllSuperPackages.js

- [LOW] L1-2 (CONFIRMED) The script loads its modules with `require(...)`, but `server/package.json` sets `"type": "module"` and `SuperPackage.js` is an ES module, and the script also never loads dotenv before reading `process.env.MONGO_URI`. Impact: the script stops at line 1 with "require is not defined" and checks nothing, so the operator gets no report on the super package commission totals. Fix: change both lines to `import` statements and add `import "dotenv/config"`.

## server/scripts/checkCommissionDistributionStatus.js

- No bugs found.

## server/scripts/checkMissingCommissions.js

- No bugs found.

## server/scripts/checkProductionPaymentVerifications.js

- No bugs found.

## server/scripts/createTestReferralChain.js

- [MEDIUM] L113-139 (CONFIRMED) The "simulate" loop adds each `distribution.amount` to `wallet.balance`, `totalEarned` and `activeIncome` or `passiveIncome` of the `TEST_LEVEL1` to `TEST_LEVEL6` wallets and saves them in whatever database `MONGO_URI` points to, and it does this again on every run because only user and wallet creation are guarded by an existence check. Impact: running the script against production creates seven fake users (L37-55, with a plain-text `password` that is never hashed) and puts real, withdrawable-looking commission balances into their wallets, growing with each run and showing up in admin totals and statistics. Fix: refuse to run unless the connection string is a local or test database, and remove the test users and wallets at the end of the run.

## server/scripts/debugCommissionDistribution.js

- No bugs found.

## server/scripts/debugPaymentVerifications.js

- No bugs found.

## server/scripts/fixGoldPackageDistribution.js

- [LOW] L42 (LIKELY) The script connects with `process.env.MONGODB_URI`, while `server/config/db.js` and the other scripts use `MONGO_URI_PROD` or `MONGO_URI`. Impact: when only the usual variables are set, `mongoose.connect(undefined)` throws, the error is caught and logged, and the Gold package is never updated. Fix: use `process.env.MONGO_URI_PROD || process.env.MONGO_URI` like the other scripts.

## server/scripts/fixMissingPurchaseIds.js

- No bugs found.

## server/scripts/fixProductionMissingPurchaseIds.js

- No bugs found.

## server/scripts/insertSuperPackages.js

- No bugs found.

## server/scripts/insertSuperPackagesProd.js

- No bugs found.

## server/scripts/makeAdmin.js

- [LOW] L8 (LIKELY) The script connects with `process.env.MONGODB_URI || "mongodb://localhost:27017/itryme"`, while the app uses `MONGO_URI_PROD` or `MONGO_URI`, and the "user not found" message on L29 is commented out. Impact: when only the usual variables are set, the script connects to a local database (or fails to connect), does not find the user and exits with code 1 and no message, so the intended account is never made admin and the operator is not told why. Fix: use `process.env.MONGO_URI_PROD || process.env.MONGO_URI`, remove the localhost fallback and restore the log lines.

## server/scripts/seedAiTools.js

- [MEDIUM] L939-953 (CONFIRMED) The `run` function first deletes every document with `AiTool.deleteMany({})` and then calls `AiTool.insertMany(sortedTools)`, but the `tools` array contains the name `"Remove.bg"` twice (L195 and L321) and `AiTool.name` has a unique index. Impact: the ordered insert stops at the second "Remove.bg", which sorts to position 10 in the popularity order, so only about nine tools are inserted, the remaining tools in the list are not, and every tool an admin had added through the panel is already deleted. Fix: remove or rename one of the two "Remove.bg" entries, and upsert by `name` instead of deleting the whole collection.

## server/scripts/seedSuperPackages.js

- [MEDIUM] L84-88 (CONFIRMED) The script runs `SuperPackage.deleteMany({})` and then `insertMany` of five hardcoded packages, which gives every package a new `_id`. Impact: when run against the live database, every existing `SuperPackagePurchase.superPackageId` and `SuperPackagePaymentVerification.superPackageId` points to a deleted document, pending verifications fail at `SuperPackage.findById` when an admin approves them, and any price, commission or extra package set through the admin panel is lost. Fix: upsert by `name` with `findOneAndUpdate` as `insertSuperPackages.js` does, and never delete the collection.

## server/scripts/testCommissionDistribution.js

- No bugs found.

## server/scripts/updateActiveIncomeField.js

- [LOW] L25 (CONFIRMED) The loop skips a wallet when `wallet.activeIncome !== undefined`, but the `CoinWallet` schema gives `activeIncome` a default of `0`, so Mongoose fills the field in on every loaded document. Impact: every wallet is skipped, the summary prints "Updated: 0", and no active income is ever back-filled from the old transactions. Fix: load the wallets with `.lean()` (or query `{ activeIncome: { $exists: false } }`) and write the result with `CoinWallet.updateOne`.
- [LOW] L73 (CONFIRMED) The run guard compares `import.meta.url` with `` `file://${process.argv[1]}` ``, which is never equal on Windows (`file:///C:/...` versus `C:\...`) or for any path that contains a space, such as this repository's folder. Impact: `node scripts/updateActiveIncomeField.js` exits immediately without connecting or doing anything, and prints nothing. Fix: compare with `pathToFileURL(process.argv[1]).href` from `node:url`.

## server/scripts/updateCoinWalletActiveIncome.js

- [LOW] L25 (CONFIRMED) The loop skips a wallet when `wallet.activeIncome !== undefined`, but the `CoinWallet` schema default of `0` means the field is never `undefined` on a loaded document. Impact: every wallet is skipped and the migration changes nothing while reporting that it completed. Fix: load the wallets with `.lean()` (or query `{ activeIncome: { $exists: false } }`) and write the result with `CoinWallet.updateOne`.
- [LOW] L70 (CONFIRMED) The run guard compares `import.meta.url` with `` `file://${process.argv[1]}` ``, which is never equal on Windows or for a path that contains a space. Impact: running the file with node does nothing and prints nothing. Fix: compare with `pathToFileURL(process.argv[1]).href` from `node:url`.

## server/scripts/updateSocialTaskCoins.js

- [LOW] L71 (CONFIRMED) The run guard compares `import.meta.url` with `` `file://${process.argv[1]}` ``, which is never equal on Windows or for a path that contains a space. Impact: running the file with node does nothing, so the social task coin rewards are not changed and the operator sees no output. Fix: compare with `pathToFileURL(process.argv[1]).href` from `node:url`.

## server/scripts/insertPackages.js

- No bugs found.

## server/scripts/updateDaimondCommission.js

- No bugs found.
