# Client: auth screens and public / shop pages

Scanned: 24 files, 8636 lines. Found: 0 critical, 4 high, 5 medium, 14 low.

## client/src/components/Auth/AdminLogin.jsx

- [LOW] L122-127 (CONFIRMED) The page renders the shared `error` value from `useAuthStore`, and nothing clears it when the page mounts, so an error left by an earlier call to `login` or `adminLogin` is still shown. Impact: a user who fails a normal login on `/login` (for example "Invalid password.") and then opens `/admin/login` sees that old message above the empty admin email form before doing anything. Fix: clear the store `error` and `success` in a `useEffect` on mount (add a `clearMessages` action to the store), or keep admin login errors in local component state.

## client/src/components/Auth/ForgotPassword.jsx

- [LOW] L51-58 (CONFIRMED) `handleVerifyOtp` is labelled "Verify OTP" but only checks that `formData.otp` is not empty and then calls `setStep(3)`; it never asks the server whether the code is right. Impact: a user who mistypes the 6-digit code is taken to the "Reset Password" step, types a new password twice, and only then gets "Invalid or expired OTP." from `/api/auth/forgot-password/reset`, with the OTP field no longer on screen (they must press Back to fix it). Fix: either add a server endpoint that checks the OTP without consuming it and call it here, or merge the OTP field and the new password fields into one step so the error appears next to the OTP input.

## client/src/components/Auth/Login.jsx

- [LOW] L33 (CONFIRMED) `handleSubmit` sends `userId: rawIdentifier` exactly as typed (only trimmed), while the server looks the user up with an exact, case-sensitive match on IDs of the form `YITM00000012`. Impact: a user who types their ID in lower case (`yitm00000012`) gets "Invalid User ID or mobile number." even though the ID and password are correct. Fix: send `rawIdentifier.toUpperCase()` as `userId`.
- [LOW] L35 (CONFIRMED) `handleSubmit` calls `login(payload, navigate)` and never reads `location.state.from`, although `ProductCart.jsx` (L46), `ProductCheckout.jsx` (L53) and `ProductDetail.jsx` (L228) all navigate to `/login` with `state: { from: ... }`. Impact: a shopper sent to login from the cart or a product page always lands on `/dashboard` after logging in and has to find the cart or product again. Fix: read `useLocation().state?.from` in `Login` and navigate there after a successful login (pass the target to the store's `login` action or navigate in the component once login succeeds).

## client/src/components/Auth/ReferralHandler.jsx

- [LOW] L28-31 (CONFIRMED) When the `referrer_code` in the URL changes, the effect stores the new code and calls `fetchSponsorInfo`, but `fetchSponsorInfo` (L36-56) never clears the previous `sponsorInfo`, and a failed lookup only sets `error`. Impact: after opening a valid referral link and then, in the same browser session without a reload, a link with a different code that is invalid, `Signup` keeps the first sponsor auto-filled and marked as validated in its form, so the account is created under the first sponsor while the page shows an "invalid referral code" error; two lookups in flight can also finish out of order and leave the older sponsor in place. Fix: call `setSponsorInfo(null)` at the start of `fetchSponsorInfo`, and ignore a response whose code is no longer the current `referralCode`.

## client/src/components/Auth/Signup.jsx

- [MEDIUM] L82-101 (CONFIRMED) `handleChange` does not reset `otpSent`, `otpVerified` or `formData.otp` when the `mobile` field is edited, and the mobile input (L710-721) stays enabled after the OTP is verified. Impact: a user can verify the OTP for number A, change the field to number B and press "Create account"; `validateForm` passes because `otpVerified` is still true, the `check-mobile` call is skipped for B, and the server `signup` handler does not check any OTP, so the account is created with a mobile number that was never verified. Fix: in `handleChange`, when `e.target.name === 'mobile'`, set `otpSent` and `otpVerified` to false and clear `formData.otp`, or disable the mobile input once `otpVerified` is true.
- [LOW] L225-236 (CONFIRMED) The `catch` block of `handleNomineeSubmit` tests for `error.name === 'AbortError'`, `TypeError` and `SyntaxError`, which are `fetch` errors, but the request is made with axios, which throws `CanceledError` on abort and an `AxiosError` on any non-2xx status; the `else` branch at L215-224 that reads `data.message` and increments `retryCount` can therefore never run. Impact: every failure (the 10 second timeout, a 400 such as "Mobile number must be 10 digits", a 401, a 500) shows only "An unexpected error occurred. Please try again.", the server's message is lost, and the "Retry (n/2)" button never appears. Fix: in the `catch`, show `error.response?.data?.message` when present, treat `error.code === 'ERR_CANCELED'` as the timeout case, and move the `retryCount` increment into the `catch` for `error.response?.status >= 500`.
- [LOW] L212-214 (CONFIRMED) The `setTimeout` that calls `navigate('/login')` two seconds after the nominee is saved is never stored or cleared, and the cleanup effect at L255-261 does nothing useful (it passes DOM elements matching `[data-timeout]`, of which there are none, to `clearTimeout`). Impact: a user who clicks any other link within two seconds of saving the nominee is pulled away from that page to `/login`. Fix: keep the timer id in a `useRef` and call `clearTimeout` on it in the unmount cleanup, and delete the `document.querySelectorAll('[data-timeout]')` code.
- [MEDIUM] L448-467 (CONFIRMED) After a successful `signup`, `handleSubmit` always calls `login(identifier, null)` for the new account, which overwrites `authUser` and `authToken` in localStorage and switches the cart owner, without checking whether somebody is already logged in. Impact: a logged-in member who registers a new downline member on their own phone or computer (the normal way sponsors enrol people) is silently switched to the new member's account; everything they do next (package payment, cart, profile, nominee) is done as the new member until they notice and log in again. Fix: only do the silent login when no user was logged in before signup, or use the returned token just for the nominee request without storing it, and otherwise ask the person to log in as the new user to add the nominee.

## client/src/components/Pages/About.jsx

- No bugs found.

## client/src/components/Pages/AiTools.jsx

- [LOW] L73-76 (LIKELY) `openToolDetail` builds the URL slug with `tool.name.toLowerCase().replace(/[^a-z0-9]/g, '')`, which removes every character that is not a Latin letter or digit. Impact: for a tool whose name is written only in Hindi or other non-Latin characters (the page itself is titled in Hindi) the slug is an empty string, `navigate('/ai-tools/')` resolves to the list page again and "Quick View" appears to do nothing; two tools whose names differ only by punctuation or spaces also get the same slug. Fix: navigate with the tool's `_id` (for example `/ai-tools/${tool._id}`) and look the tool up by id in `AiToolsDetailer`.

## client/src/components/Pages/AiToolsDetailer.jsx

- [MEDIUM] L39 (LIKELY) Inside the `find` callback of `fetchTool`, step 4 accepts a tool when `toolNameLower.includes(urlNameLower) || urlNameLower.includes(toolNameLower)`, and `find` returns the first tool in the list that passes any step, not the best match. Impact: when one tool's name contains another's (for example "Canva" and "Canva Magic Studio", or "Jasper" and "Jasper Art") and the longer or shorter one comes first in the API list, opening `/ai-tools/canva` shows the details and the "Launch Tool" link of the wrong tool. Fix: remove the partial-match step, or first search the whole list for an exact or cleaned match and fall back to a partial match only if none is found; better, match by `_id`.

## client/src/components/Pages/ContactUs.jsx

- [LOW] L121 (CONFIRMED) The contact card shows the email address as the literal text `yesitrymeofficial@gmail`, without `.com`. Impact: visitors who copy the address from the Contact page get an invalid email address (every other page shows `YesITryMeofficial@gmail.com`). Fix: change the text to `yesitrymeofficial@gmail.com`.

## client/src/components/Pages/Course.jsx

- No bugs found.

## client/src/components/Pages/CourseDetail.jsx

- [HIGH] L227-243 (CONFIRMED) `fetchCourseData` loads every lesson of the course, including each lesson's `link`, from `GET /api/course-content/course/:courseId`, which the server exposes with no authentication, and the paywall is only the browser-side `canAccessLecture` check at L351-356 (which also trusts `user.status` read from localStorage at L328). Impact: anyone, even without an account, can open that URL or the browser network tab on a course page and read the content links of all paid lessons without buying a package. Fix: enforce access on the server: return `link` only for the preview lesson unless the request carries a valid token for a user with an active package or super package purchase, and have this page call a protected endpoint for the full lesson list.
- [LOW] L322-323 (CONFIRMED) `hasVerifiedPayment` reads `verificationsResponse.data.data?.verifications`, but `GET /api/payment/status` returns the array itself in `data` (`{ success, data: [...] }`), so `.verifications` is always `undefined`. Impact: `hasVerifiedPayment` is always false, so this check never unlocks a course; access depends only on the purchases lists and the cached `user.status`. Fix: read the array from `verificationsResponse.data.data` (for example `const list = Array.isArray(d) ? d : d?.verifications || []`).

## client/src/components/Pages/Ebooks.jsx

- [HIGH] L15-60 (CONFIRMED) The Google Drive folder URLs for all six paid ebook collections are hard-coded in this component (`driveUrl` of `businessBooks`, `stockMarketBooks`, `motivationalBooks`, `parentingBooks`, `spiritualBooks`, `otherUsefulBooks`), so they are shipped in the public JavaScript bundle, and the package check in `getAvailableFolders` (L188-200) only decides which cards are drawn. Impact: any visitor, logged in or not, can read all six folder links from the site's JavaScript and open the paid ebooks without buying a package. Fix: remove the URLs from the client, store them on the server, and return only the folders the logged-in user is entitled to from a protected endpoint that checks their active purchases; also restrict sharing on the Drive folders themselves.
- [LOW] L139 (CONFIRMED) `fetchUserData` reads `verificationsResponse.data.data?.verifications`, but `GET /api/payment/status` returns the array directly in `data`, so `verificationsData` is always `[]`. Impact: `paymentVerifications` is always empty, so the "verified payment" branches of `getApprovedPackages` (L154-156 and L172-176) never match and a buyer's library depends only on the purchases list, which the server limits to the 10 most recent records. Fix: read the array from `verificationsResponse.data.data`.

## client/src/components/Pages/FAQ.jsx

- No bugs found.

## client/src/components/Pages/Gallery.jsx

- No bugs found.

## client/src/components/Pages/NotFound.jsx

- No bugs found.

## client/src/components/Pages/Package.jsx

- [HIGH] L126 (CONFIRMED) `fetchPaymentVerifications` calls `setPaymentVerifications(response.data.data.verifications || [])`, but `GET /api/payment/status` returns the list directly in `data` (`{ success: true, data: [...] }`), so `.verifications` is `undefined` and the state is always `[]`. Impact: `hasPendingPayment` (L191-195) is always false, so after a user submits payment proof the package card never shows the "PENDING" badge or the disabled "Payment Pending" button; it still shows "Purchase Now", the user fills in and uploads the payment form again, and only then the server rejects it with "You already have a pending payment verification for this package"; the verified-payment count in `getPackagePurchaseCount` and the "Last purchased on" date from `verifiedAt` are also never used. Fix: set the state from `response.data.data` (for example `Array.isArray(d) ? d : d?.verifications || []`).

## client/src/components/Pages/PrivacyPolicy.jsx

- [LOW] L202 (LIKELY) The contact phone number is shown as `+91 77569 16324`, while `ContactUs.jsx` (L127), `FAQ.jsx` (L60 and L130) and the `tel:` link in `NotFound.jsx` (L106) all use `+91 7066916324`. Impact: users reading the Privacy Policy are given a different support number from the rest of the site, so one of the two is wrong and some users will call a number that is not the company's. Fix: confirm the correct support number and use the same value on every page.

## client/src/components/Pages/ProductCart.jsx

- [LOW] L45-46 (CONFIRMED) `goCheckout` calls `toast.info("Please log in to checkout.")` (and `toast.info("Your cart is empty.")` at L41), but this page does not render a `ToastContainer` and the app has no global one (only `ProductCheckout`, `ProductDetail` and a few other pages mount their own). Impact: a logged-out shopper who presses "Proceed to checkout" is sent to the login page with no explanation, and the queued message can pop up later on an unrelated page that does mount a `ToastContainer`. Fix: render `<ToastContainer />` in `ProductCart`, or mount one `ToastContainer` once in `App.js` and remove the per-page ones.

## client/src/components/Pages/ProductCheckout.jsx

- [MEDIUM] L50-55 (CONFIRMED) The redirect effect runs on mount with `isAuthenticated` from `useAuthStore`, which starts as `false` and is only set to `true` by `initializeAuth()` in the `useEffect` of `App.js`; React runs this child effect before the parent's, so on a fresh page load the effect sees `false` and calls `navigate("/login")`. Impact: a logged-in user who reloads `/checkout/products` or opens it directly (very common on phones, where the browser reloads the tab after the user switches to a UPI app to pay) is thrown to the login page, and the delivery form or the payment step for the order just created is lost. Fix: base the check on `user && token` from the store (these are read from localStorage when the store is created), or add an "auth initialised" flag to the store and wait for it before redirecting.

## client/src/components/Pages/ProductDetail.jsx

- No bugs found.

## client/src/components/Pages/ProductOrders.jsx

- [HIGH] L94-106 (CONFIRMED) An order with status `awaiting_payment` is shown only as an "Awaiting payment" label; the list offers no way to open the payment step, and the payment form (`WalletTopUpVerificationForm` with `variant="productOrder"`) is rendered only by `ProductCheckout.jsx` from its in-memory `order` state, after the cart has already been cleared. Impact: a shopper who places an order and then leaves, reloads or is redirected away from the checkout page before submitting payment proof (including after actually paying by UPI) can never submit the proof; the order stays in "Awaiting payment" forever, any wallet coins applied to it stay reserved on the server and reduce the coins they can use on later orders, and they must place a second order. Fix: for orders in `awaiting_payment` with `amountPayable >= 0.01`, add a "Complete payment" button here that opens `WalletTopUpVerificationForm` with `productOrderId={o._id}`, `fixedAmount={o.amountPayable}` and `orderNumber={o.orderNumber}`, and refresh the list on success.

## client/src/components/Pages/Products.jsx

- [MEDIUM] L86-113 (CONFIRMED) `fetchProducts` has no cancellation or request-order check, and on every response it writes both `products` and `pagination.currentPage` (L102-108) from that response. Impact: when two requests overlap (clicking page 2 then page 3 quickly, or changing category or sort while a page is still loading) and the older response arrives last, the grid shows the older results and `currentPage` is set back to the older page, which changes the effect dependencies and triggers another fetch, so the user ends up on a page or filter they did not choose. Fix: keep a request counter in a `useRef` (or use an `AbortController`), ignore any response that is not from the latest request, and do not overwrite `currentPage` from the response.

## client/src/components/Pages/PublicTask.jsx

- No bugs found.

## client/src/components/Pages/TermsAndConditions.jsx

- [LOW] L367 (LIKELY) The contact phone number is shown as `+91 77569 16324`, while `ContactUs.jsx` (L127), `FAQ.jsx` (L60 and L130) and the `tel:` link in `NotFound.jsx` (L106) all use `+91 7066916324`. Impact: users reading the Terms and Conditions are given a different support number from the rest of the site, so one of the two is wrong and some users will call a number that is not the company's. Fix: confirm the correct support number and use the same value on every page.
