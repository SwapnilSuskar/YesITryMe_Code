# Client: user referrals, KYC, profile and payment forms

Scanned: 23 files, 7539 lines. Found: 0 critical, 2 high, 8 medium, 10 low.

## client/src/components/User/AffiliateLink.jsx

- No bugs found.

## client/src/components/User/DirectReferrals.jsx

- No bugs found.

## client/src/components/User/Earnings.jsx

- [MEDIUM] L23 (CONFIRMED) `fetchTransactions` requests `/api/packages/commission/transactions?limit=1000` once and never reads further pages, and the server (`getCommissionTransactions`) returns only the newest `limit` wallet transactions. Impact: for a user whose wallet has more than 1000 transactions (an upline who receives commission from many levels), the "All Time" card sums only the newest 1000 and shows less than the user really earned. Fix: page through the endpoint until `pagination.totalPages` is reached, or add a server endpoint that returns the summed totals and use that.
- [LOW] L67-76 (CONFIRMED) `calculateEarnings` keeps a transaction for "Last 7 Days" only when `diff <= 6` days and for "Last 30 Days" only when `diff <= 29` days, where `diff` is the exact elapsed time in days. Impact: a completed transaction made 6 days and 5 hours ago is left out of the "Last 7 Days" total (the card really covers 6 x 24 hours), and the 30-day card covers only 29 x 24 hours, so both cards show less than the label says. Fix: compare against `diff < 7` and `diff < 30`, or compare calendar days from the start of today.

## client/src/components/User/IndirectReferralsModal.jsx

- [LOW] L57 (CONFIRMED) `filterAndSortReferrals` calls `filtered.sort(...)` while `filtered` is still the `indirectReferrals` prop array when `searchTerm` is empty, so it sorts the parent's state array in place on every render. Impact: opening the modal or changing the sort silently reorders the array held in `MyTeam` state, so the parent list changes order without a state update. Fix: sort a copy, `let filtered = [...referrals]`.

## client/src/components/User/InfoItem.jsx

- No bugs found.

## client/src/components/User/KycDetailForm.jsx

- [MEDIUM] L41 (CONFIRMED) `validate` only checks that `form.ifsc` and `form.accountNo` are non-empty, and the IFSC input (L409) uses the CSS class `uppercase`, so the user sees capital letters while `handleSubmit` (L102) sends the value exactly as typed. Impact: a user who types `sbin0001234` sees `SBIN0001234` on screen but the lower-case value is stored, and any text such as `abc` or an account number with spaces or letters is accepted as bank details that payouts are later sent to. Fix: upper-case and trim `ifsc` before sending, validate it against `/^[A-Z]{4}0[A-Z0-9]{6}$/`, and require `accountNo` to be 9 to 18 digits.
- [LOW] L43-45 (CONFIRMED) `validate` does not check the size of `form.aadhaar`, `form.pan` or `form.kycDoc`, although the page states "max 5MB each" (L496) and the server route aborts uploads over 10MB. Impact: a user who picks a file larger than 10MB waits for the whole upload, the server aborts it with a 413 response that has no JSON `message`, and the user only sees the generic alert "Failed to submit KYC application". Fix: reject files over the stated limit in `handleChange` or `validate` and show the reason next to the field.
- [LOW] L62-64 (CONFIRMED) `checkKycStatus` treats every error as "KYC not found": the empty `catch` handles a network error or a 500 response the same way as the expected 404. Impact: when the status request fails, a user whose KYC is already pending or approved is shown the blank submission form instead of their status, and submitting it is then rejected by the server with "KYC application already submitted". Fix: treat only `error.response?.status === 404` as "no KYC", and show an error with a retry button for any other failure.
- [HIGH] L444 (LIKELY) The three file inputs (L444, L460, L474) accept `image/*,.pdf` and the guidelines (L496) say "Supported: JPG, PNG, PDF", but the server `submitKyc` passes every uploaded buffer to `compressKycDocument`, which calls `sharp(...)`, and the standard sharp build cannot read PDF. Impact: a user who uploads any of the three documents as a PDF gets "Failed to submit KYC application" every time; on a resubmission the server has already deleted the rejected KYC record before the upload fails, so the user's earlier application disappears as well. Fix: change `accept` to image types only and remove "PDF" from the guidelines (or make the server upload PDFs without image compression), and reject non-image files in `validate`.

## client/src/components/User/Leaderboard.jsx

- [MEDIUM] L57-60 (CONFIRMED) `fetchMine` computes `withdrawn` from `d.payouts` returned by `/api/payout/history`, but the server `getPayoutHistory` returns only the 10 most recent payouts, while the server's own `computedTotal` for the leaderboard sums all approved and completed payouts. Impact: a logged-in user with more than 10 payouts sees a smaller amount on their own leaderboard row than every other visitor sees for them, and the amount can be lower than the row ranked below. Fix: do not recompute the amount on the client; show `row.computedTotal` for every row, including the user's own.
- [MEDIUM] L107-108 (CONFIRMED) For the row where `row.userId === user?.userId` the component shows `myTotalIncome`, which starts at 0 and is only filled after the four requests in `fetchMine` finish; the `catch {}` at L62 leaves it at 0 when any request throws. Impact: a top earner looking at the leaderboard sees their own amount as ₹0 until the requests finish, and permanently ₹0 if one of the four requests fails (for example a network error), while the server-provided amount for that row is ignored. Fix: fall back to `row.computedTotal ?? row.totalEarned` until `fetchMine` has completed successfully, or drop the override.

## client/src/components/User/MLMLevelCard.jsx

- [LOW] L21 (CONFIRMED) `fetchMLMData` stores `response.data` in `mlmData`, but `/api/mlm/team-structure` responds with `{ success, data: teamStructure }`, so the fields the card reads (`mlmData.mlmLevel`, `mlmData.directActiveMembers`, `mlmData.requirements`) are one level deeper. Impact: wherever this card is rendered it shows an empty level badge, empty team counts and no "Next Level Requirements" block (the component is not imported anywhere at present, which is why the mistake has not been seen). Fix: use `setMlmData(response.data.data)`.

## client/src/components/User/MyServices.jsx

- No bugs found.

## client/src/components/User/Nominee.jsx

- [MEDIUM] L26 (CONFIRMED) The `bloodRelations` list offers `'Other'`, but the server `Nominee` schema enum for `bloodRelation` stops at `"Cousin"` and `createOrUpdate` runs validators. Impact: a user who selects "Other" passes the client checks in `handleSave`, the POST to `/api/nominee/:userId` fails validation, and the nominee can never be saved with that choice. Fix: remove `'Other'` from the client list, or add `"Other"` to the schema enum.
- [LOW] L73-92 (CONFIRMED) `handleSave` only checks that `formData.name` and `formData.address` are non-empty, but the server schema requires a name of at least 2 characters and an address of at least 10 characters. Impact: a one-letter name or a short address such as "Pune" passes the form and is then rejected by the server, so the user gets a server validation error instead of a clear field message. Fix: add the same minimum lengths (name 2, address 10, address maximum 500) to the client validation.

## client/src/components/User/PaymentVerificationForm.jsx

- No bugs found.

## client/src/components/User/Profile.jsx

- [MEDIUM] L36 (CONFIRMED) `shareWeLove` (L36) and `shareIdCard` (L155) build the shared link as `${window.location.origin}/profile/${user.userId}`, but `Router.jsx` defines only `/profile` with no id parameter. Impact: everyone who opens the link that a user shared from "We Love" or "Share ID card" lands on the NotFound page. Fix: share a link that exists, for example the user's referral link `/?referrer_code=${user.userId}`, or add a public `/profile/:userId` route.
- [MEDIUM] L108 (CONFIRMED) After a successful photo upload `handlePhotoChange` calls `setUser({ ...user, imageUrl: res.data.imageUrl })`, and the store's `setUser` only updates memory; it does not write `authUser` to `localStorage`, which is where the store reloads the user from on every page load. Impact: the new profile photo is shown until the page is refreshed, then the old photo (or the initials avatar) comes back everywhere and stays until the user logs out and in again. Fix: also write the updated user to `localStorage.setItem("authUser", ...)`, or make `setUser` in the store persist it.

## client/src/components/User/RankRequirements.jsx

- No bugs found.

## client/src/components/User/SocialEarning.jsx

- No bugs found.

## client/src/components/User/SubReferralsModal.jsx

- [LOW] L58 (CONFIRMED) `filterAndSortReferrals` calls `filtered.sort(...)` on the `subReferrals` prop itself when `searchTerm` is empty, and that array is the `subReferrals` array of a node inside the referral tree held in `MyTeam` state. Impact: opening this modal or changing its sort order reorders the sub-referrals inside the parent's referral tree in place, so the team view shows a different order afterwards without any state update. Fix: sort a copy, `let filtered = [...referrals]`.
- [LOW] L168-238 (CONFIRMED) The expanded section of `renderSubReferralCard` renders only `user.subReferrals.slice(0, 2)` and then prints "Expand to see all N sub-referrals", but there is no control that shows the rest. Impact: for any member with more than two sub-referrals, the third and later ones can never be seen in this modal, although the text tells the user to expand. Fix: add a "show all" toggle that renders the full `user.subReferrals` list, or remove the misleading text.

## client/src/components/User/SuccessfulDownline.jsx

- [LOW] L166 (LIKELY) `totalCount` takes `uniqueSuccessfulDownlineCount` from the API (direct buyers of regular and super packages) whenever it is above 0, while the table rows come from `regularDirects`, which `isSuccessfulBuyer` filters by `activationDate` or `status === 'active'`. Impact: when a direct referral counts as a buyer on the server but has no `activationDate` and a status other than `active`, the header shows "Total: N" with fewer rows listed, and if no row matches, the "No successful downline yet" message at L259 is skipped and an empty table with only headers is shown. Fix: base the empty-state check on `rows.length`, and show the API count and the listed count with separate labels.

## client/src/components/User/SuperPackagePaymentVerificationForm.jsx

- No bugs found.

## client/src/components/User/SuperPackages.jsx

- [MEDIUM] L4 (CONFIRMED) The component imports `toast` from `react-hot-toast`, but no `<Toaster />` from that library is mounted anywhere in the client (the rest of the user pages use `react-toastify`), so `toast.error` at L126 and `toast.success` at L224 render nothing; `handlePaymentSuccess` also closes the payment form at L222, which removes the form's own success screen. Impact: after a user submits a super package payment proof the modal simply disappears with no confirmation, and a failure to load the packages shows no error, so users cannot tell whether their payment proof was received. Fix: use `react-toastify` here like the other user pages (or mount `<Toaster />`), and let the form show its success screen before closing.
- [HIGH] L213 (CONFIRMED) `hasPendingPayment`, `getSuperPackagePurchaseCount` (L166) and `getSuperPackagePurchaseDetails` (L186) compute `String(verification.superPackageId || verification.superPackageId?._id || '')`, but the server populates `superPackageId` on payment verifications as an object `{ _id, name, price }`, so the string is always `"[object Object]"` and never equals `pkg._id`. Impact: a pending verification is never detected, so the "PENDING" badge and the disabled "Payment Pending" button never appear and the user can submit payment proofs for the same super package again and again while the first is still under review; verified payments are also never counted from the verification list. Fix: read the id as `String(verification.superPackageId?._id || verification.superPackageId || '')` in all three functions.

## client/src/components/User/TDSHistory.jsx

- No bugs found.

## client/src/components/User/Team.jsx

- [LOW] L23 (CONFIRMED) `loading` starts as `true` and is only set to `false` inside `fetchTree`, which runs only when both `user` and `token` exist; the component has no login check. Impact: a visitor who opens `/team` without being logged in (or after the token was cleared) sees "Loading..." forever instead of a login prompt. Fix: return `<LoginPrompt />` when `user` is missing, and set `loading` to `false` when the fetch is skipped.

## client/src/components/User/TopDownlinePerformers.jsx

- No bugs found.

## client/src/components/User/VideoTaskDetail.jsx

- No bugs found.

## client/src/components/User/WalletTopUpVerificationForm.jsx

- No bugs found.
