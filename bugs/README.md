# Bug scan: YesITryMe

Scanned on 2026-10-13. Whole project: `server/` and `client/src/`, about 72,000 lines.

## Totals

| Severity | Count | Meaning |
|---|---|---|
| CRITICAL | 38 | Money can be lost, created or paid twice; a login or admin check can be bypassed; one user can read or change another user's data |
| HIGH | 55 | A feature is broken or gives wrong results in normal use |
| MEDIUM | 132 | Wrong behaviour in a realistic edge case |
| LOW | 119 | Minor wrong behaviour |
| **Total** | **344** | |

Some bugs are listed twice, once at the route and once at the controller (see "Same bug in two files" below). The real number of separate bugs is lower than 344.

## How to read a report

Each bug is one line:

```
- [SEVERITY] L<line> (CONFIRMED or LIKELY) What is wrong. Impact: what goes wrong. Fix: the change to make.
```

- `L<line>` is the line in the source file named by the `##` heading above it.
- `CONFIRMED`: the whole path was traced in the code.
- `LIKELY`: it depends on live data or deployment settings that the scan could not see.

Nothing was run. Every finding comes from reading the code, so test each fix.

## Reports

| File | Area | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| [01-server-recharge-controller.md](01-server-recharge-controller.md) | Mobile and DTH recharge | 6 | 1 | 10 | 4 |
| [02-server-admin-auth-controllers.md](02-server-admin-auth-controllers.md) | Signup, login, OTP, admin actions | 5 | 7 | 9 | 9 |
| [03-server-money-controllers.md](03-server-money-controllers.md) | Payments, payouts, wallet top-up, coins, funds | 11 | 10 | 12 | 5 |
| [04-server-other-controllers.md](04-server-other-controllers.md) | Shop, orders, tasks, KYC, nominee | 5 | 3 | 15 | 7 |
| [05-server-services-middleware-utils.md](05-server-services-middleware-utils.md) | Commission services, auth middleware, OTP services | 3 | 8 | 12 | 13 |
| [06-server-routes-models-scripts.md](06-server-routes-models-scripts.md) | Routes, database models, scripts | 8 | 2 | 8 | 10 |
| [07-client-user-dashboard-wallet-recharge.md](07-client-user-dashboard-wallet-recharge.md) | User dashboard, wallet, payout, recharge pages | 0 | 7 | 13 | 10 |
| [08-client-user-referrals-kyc-forms.md](08-client-user-referrals-kyc-forms.md) | User referrals, KYC, profile, payment forms | 0 | 2 | 8 | 10 |
| [09-client-admin-a.md](09-client-admin-a.md) | Admin screens, AdminActivationTracker to KycManager | 0 | 5 | 19 | 12 |
| [10-client-admin-b.md](10-client-admin-b.md) | Admin screens, MotivationQuotes to WithdrawalRequests | 0 | 3 | 15 | 15 |
| [11-client-auth-and-pages.md](11-client-auth-and-pages.md) | Login, signup, public and shop pages | 0 | 4 | 5 | 14 |
| [12-client-core-router-store-ui.md](12-client-core-router-store-ui.md) | Router, API config, stores, navbar, shared UI | 0 | 3 | 6 | 10 |

## Fix these first

These were re-checked by hand against the code after the scan. All are real.

1. `server/controllers/authController.js` L155: signup accepts `role: "admin"` from the request body. Anyone can create an admin account.
2. `server/controllers/packageController.js` L26 and `server/routes/packages.js` L24: `POST /api/packages/purchase` gives any logged-in user a completed package and pays commission up the sponsor chain with no payment check.
3. `server/routes/nominee.js` L13, L16, L19, L22: any logged-in user can read, replace or delete another user's nominee, and list every nominee.
4. `server/routes/funds.js` L19 and `server/routes/specialIncome.js` L6: any logged-in user can read another user's funds and special income by changing the user id in the URL.
5. `server/routes/auth.js` L121, L123: the motivation quote toggle and delete routes have no login check.
6. `server/routes/auth.js` L108: `GET /api/auth/debug/otp-store` is public.
7. `server/services/otpService.js` L76-79: the signup OTP is returned in the HTTP response.
8. `server/middleware/authMiddleware.js` L31: a user with status `blocked` still passes the login check.
9. `server/controllers/adminController.js` L1808 and `server/controllers/paymentController.js` L281-302: wallet balances and approval status are read, changed in memory and saved. Two requests at the same moment can overwrite each other or approve twice. The same pattern is reported in the recharge, payout, wallet top-up, super package and commission code.

The other CRITICAL and HIGH findings were not re-checked by hand. Treat them as strong leads and confirm each one before fixing.

## Same bug in two files

These are one bug each, reported once at the route and once at the handler:

- Nominee access: `04` (nomineeController.js) and `06` (routes/nominee.js).
- Funds and special income access: `03` (fundsController.js, specialIncomeController.js) and `06` (routes/funds.js, routes/specialIncome.js).
- Motivation quote routes: `02` (authController.js) and `06` (routes/auth.js).
- Blocked users can still log in: `02` (authController.js `login`) and `05` (authMiddleware.js `protect`).
- Signup OTP not verified: `02` (authController.js `signup`) and `05` (otpService.js).
- Paid course links are public: `04` (courseContentController.js), `06` (routes/courseContent.js) and `11` (CourseDetail.jsx).
- Wallet top-up transaction id reused: `03` (walletTopUpController.js) and `06` (models/WalletTopUp.js).
- Admin page redirects to home on reload: `10` (ProtectedAdminRoute.jsx) and `12` (useAuthStore.js).
- Toast messages never shown: `12` (useToast.js), `07` (recharge pages) and `10` (admin pages using `react-hot-toast`).

## Not covered

- CSS files, images and `node_modules`.
- Anything that needs the app running: real provider responses, live database contents, deployment settings.
