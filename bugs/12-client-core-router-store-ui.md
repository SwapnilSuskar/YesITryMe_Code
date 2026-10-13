# Client: router, API config, stores, hooks, navbar and shared UI

Scanned: 50 files, 6300 lines. Found: 0 critical, 3 high, 6 medium, 10 low.

## client/src/index.js

- No bugs found.

## client/src/App.js

- No bugs found.

## client/src/Router/Router.jsx

- [LOW] L136 (CONFIRMED) `HomeOrReferral` builds the redirect as `/signup?referrer_code=${referrerCode}` without `encodeURIComponent`, after `URLSearchParams.get` has already decoded the value. Impact: a referral code that contains `&`, `#`, `+` or a space (for example `/?referrer_code=AB%26x=1`) reaches the signup page truncated or split into extra query parameters, so the sponsor is lost or wrong. Fix: use `encodeURIComponent(referrerCode)` when building the `Navigate` target.
- [MEDIUM] L192-202 (LIKELY) The routes `/affiliate-link`, `/leaderboard`, `/team`, `/recharge/mobile`, `/recharge/dth`, `/recharge/plan-confirmation` and `/recharge/success` have no login guard in `Router.jsx`, and unlike the other user pages their components (`AffiliateLink`, `Leaderboard`, `Team`, `MobileRecharge`, `DTHRecharge`, `PlanConfirmation`, `RechargeSuccess`) never read `isAuthenticated` or render `LoginPrompt`. Impact: a logged-out visitor who opens one of these URLs gets the page shell with `user` equal to `null` and authenticated API calls that fail, instead of a login prompt. Fix: wrap all logged-in user routes in one `ProtectedRoute` element that waits for auth to initialise and then renders `LoginPrompt` or redirects to `/login`.

## client/src/config/api.js

- [MEDIUM] L35-43 (CONFIRMED) The request interceptor, on finding an expired token in `localStorage`, removes `authUser` and `authToken` and rejects with `new Error("Token expired")`, but it never calls `useAuthStore.logout()` and never redirects. Impact: in a tab left open past token expiry the next request (even a public one) fails with an error that has no `response`, so the page shows a generic failure, while the zustand store still has `isAuthenticated: true` and the Navbar still shows the user as logged in; code that reads `token` from the store (the `fetch` calls in `Dashboard.jsx`, `Leaderboard.jsx`) keeps sending the dead token. Fix: on expiry clear the store as well (call the store's `logout`) and redirect to `/login`, the same way the 401 response handler does.
- [LOW] L147-149 (CONFIRMED) `API_ENDPOINTS.superPackages.genealogy`, `.referrals` and `.referralTree` point to `/api/super-packages/genealogy`, `/referrals` and `/referral-tree`, which `server/routes/superPackages.js` does not define. Impact: a GET to any of them falls through to `router.get("/:id", getSuperPackageById)` with the id `genealogy`, `referrals` or `referral-tree` and returns an error instead of data; no client file uses them today, so they only fail when someone wires them up. Fix: delete these three entries or add the routes on the server.
- [LOW] L229-241 (CONFIRMED) Every `API_ENDPOINTS.courses.*` entry points under `/api/courses`, but `server/index.js` mounts no router at `/api/courses` (only `/api/course-content`). Impact: any call to these eleven endpoints returns the server's 404 "Route not found"; no client file uses them today. Fix: delete the `courses` block or mount a courses router on the server.

## client/src/store/useAuthStore.js

- [HIGH] L40 (CONFIRMED) The store starts with `isAuthenticated: false` even when a valid `authUser` and `authToken` are in `localStorage`, and it only becomes `true` when `initializeAuth` runs inside the `useEffect` in `App.js` L11-13, which is after the first render and after the child effects. Impact: when an admin reloads, bookmarks or directly opens any `/admin/...` URL, `ProtectedAdminRoute` sees `isAuthenticated === false` on the first render and renders `<Navigate to="/" replace />`, whose effect runs before `App`'s effect, so the admin is always thrown to the home page; logged-in users who reload a user page also get a flash of `LoginPrompt`. Fix: compute the initial `isAuthenticated` synchronously in the store (`Boolean(storedUser && storedToken && !isTokenExpired(storedToken))`), or add an `authInitialized` flag and make guards render nothing until it is true.
- [MEDIUM] L160-178 (LIKELY) `syncUserStatus` sets `newStatus` to `"free"` whenever neither purchase list contains an item with `status === "active"`, and then overwrites the stored `user.status` unless it is `kyc_verified` or `blocked`. Impact: a user whose real server status is `active` for another reason (activated by an admin through `PATCH /api/admin/users/:id/activate`, or whose purchases carry a different status value) is rewritten to `free` in the store and in `localStorage` 500 ms after login, so the Navbar status dot turns red and pages that read `user.status === 'active'` (`MobileRecharge`, `DTHRecharge`, `PlanConfirmation`) treat the member as inactive. Fix: do not derive the status on the client; fetch the user's status from the server, or only ever upgrade `free` to `active` and never downgrade.
- [LOW] L272-286 (CONFIRMED) `adminLogin` stores the user and token but, unlike `login` (L243-247), never calls `useCartStore.getState().setCartOwner(...)`. Impact: after an admin login the cart store keeps the previous `ownerKey` (normally `guest`), so the admin sees and edits the guest cart until the page is reloaded, at which point the cart switches to the `user:<id>` cart and the items appear to vanish. Fix: call `setCartOwner` with the admin's id in `adminLogin`, the same way `login` does.

## client/src/store/useCartStore.js

- No bugs found.

## client/src/hooks/useNotifications.js

- [MEDIUM] L225-249 (CONFIRMED) The SSE/polling effect increments `activeComponentsCount` at L225 and then, when `now - lastConnectionAttemptRef.current < 2000`, returns at L248 with no cleanup function, no polling interval and no initial fetch. Impact: when the effect's dependencies change within 2 seconds of its previous run (for example `user` changes when `syncUserStatus` rewrites the status 500 ms after login), the previous cleanup has already cleared `globalPollingInterval`, the new run sets nothing up, and `activeComponentsCount` is never decremented, so the unread badge stops updating for the rest of the session and later cleanups never reach zero. Fix: do the debounce check before incrementing the counter, or return a cleanup that decrements it, and still start polling (delay it instead of skipping it).
- [LOW] L279-285 (CONFIRMED) On a `new_notification` SSE message the handler calls `addNotification(data.notification)`, which already does `setUnreadCount(prev => prev + 1)` for an unread notification (L217-219), and then increments `unreadCount` a second time at L281-285. Impact: each real-time notification raises the unread badge by 2 instead of 1 (this branch only runs when the hostname is `localhost` or `127.0.0.1`, because production uses polling). Fix: remove the second `setUnreadCount` and update `globalUnreadCountCache` inside `addNotification`.
- [MEDIUM] L326-333 (CONFIRMED) `globalPollingInterval` is a single module-level interval, and every hook instance clears it and replaces it with an interval that calls its own `fetchUnreadCount`, which only sets that instance's `unreadCount` state. Impact: `Navbar.jsx` always mounts two `NotificationBell` components (desktop at L153 and the mobile menu at L371), so the mobile instance, whose effect runs last, owns the interval and the desktop bell's unread badge is fetched once on mount and never refreshed by polling. Fix: keep the unread count in a shared store (zustand) that one interval updates and all bells read, or keep a set of subscriber callbacks that the single interval notifies.

## client/src/hooks/useToast.js

- [HIGH] L4-13 (CONFIRMED) `useToast` keeps `toasts` in component-local `useState` and nothing ever renders them: `components/UI/ToastContainer.jsx` is not imported anywhere, and every caller (`Recharge.jsx`, `MobileRecharge.jsx`, `DTHRecharge.jsx`, `PlanConfirmation.jsx`, `RechargeSuccess.jsx`, `WithdrawalRequests.jsx`) only takes `showSuccess`/`showError` and renders no container for `toasts` (`WithdrawalRequests.jsx` renders the unrelated `react-toastify` container). Impact: every message sent through `showError` or `showSuccess` is invisible, so in the recharge flow the user sees nothing for "Insufficient wallet balance", "KYC verification required", "Please enter a valid amount", "Recharge failed. Your payment has been refunded." or "Recharge successful", and the admin sees no result after approving or rejecting a coin withdrawal. Fix: make `showSuccess`/`showError`/`showWarning`/`showInfo` call `toast.success`/`toast.error`/... from `react-toastify` and mount one `react-toastify` `ToastContainer` in `App.js`, or render `UI/ToastContainer` with `toasts` and `removeToast` in every page that uses the hook.

## client/src/services/rechargeService.js

- No bugs found.

## client/src/utils/deliveryCharge.js

- No bugs found.

## client/src/utils/commissionDistributionPreview.js

- No bugs found.

## client/src/components/Navbar.jsx

- [HIGH] L371 (CONFIRMED) The mobile menu renders `NotificationBell` inside the panel `div` at L336, which has `overflow-hidden`, and the bell sits about 36px from the left edge while its dropdown (`NotificationBell.jsx` L83) is `absolute right-0 w-80`, so the dropdown extends 320px to the left of the bell's right edge and below the panel. Impact: on phones (below the `md` breakpoint, where the desktop bell at L153 is hidden) tapping the bell opens a notification list that is cut off by the panel's `overflow-hidden` and positioned mostly off the left side of the screen, so mobile users cannot read, mark or delete notifications. Fix: render the mobile bell in the top bar next to the cart icon, or give its dropdown `left-0` and move it out of the `overflow-hidden` panel (for example a fixed full-width sheet).

## client/src/components/Shop/DeliveryNote.jsx

- No bugs found.

## client/src/components/Shop/shopTokens.js

- No bugs found.

## client/src/components/UI/DashboardCard.jsx

- No bugs found.

## client/src/components/UI/DashboardChart.jsx

- No bugs found.

## client/src/components/UI/Footer.jsx

- [MEDIUM] L77 (CONFIRMED) The "Packages" quick link uses `to="/package"`, but `Router.jsx` only defines `/packages`. Impact: clicking "Packages" in the footer of any page lands on the 404 `NotFound` page. Fix: change the link to `/packages`.
- [LOW] L155 (CONFIRMED) The "Cookie Policy" link uses `to="/cookies"`, and `Router.jsx` defines no `/cookies` route. Impact: clicking "Cookie Policy" in the footer lands on the 404 `NotFound` page. Fix: add a `/cookies` route or remove the link.

## client/src/components/UI/InlineMessage.jsx

- No bugs found.

## client/src/components/UI/LazyLoad.jsx

- No bugs found.

## client/src/components/UI/LoadingSkeleton.jsx

- No bugs found.

## client/src/components/UI/LoginPrompt.jsx

- No bugs found.

## client/src/components/UI/NotificationBell.jsx

- No bugs found.

## client/src/components/UI/Pagination.jsx

- No bugs found.

## client/src/components/UI/ReferralLink.jsx

- [LOW] L36-41 (CONFIRMED) In `shareReferralLink` the `catch` block treats every error from `navigator.share` as a reason to copy the link and call `setShared(true)`, and `copyToClipboard` (L15-16) sets `copied` without awaiting `navigator.clipboard.writeText`. Impact: when the user cancels the native share sheet (`AbortError`) the link is silently written to the clipboard and the green "Shared!" message is shown although nothing was shared, and "Copied!" is shown even when the clipboard write is rejected. Fix: ignore `AbortError` in the `catch`, and `await` the clipboard write inside `try`/`catch` before setting `copied` or `shared`.

## client/src/components/UI/SocialLinks.jsx

- No bugs found.

## client/src/components/UI/StatsCard.jsx

- No bugs found.

## client/src/components/UI/TimePeriodSelector.jsx

- No bugs found.

## client/src/components/UI/Toast.jsx

- [LOW] L13-22 (CONFIRMED) The auto-dismiss effect depends on `onClose`, and `ToastContainer.jsx` L13 passes a new inline arrow function on every render, so the cleanup clears the timer and the effect starts a fresh `duration` timer each time the parent re-renders. Impact: whenever the parent re-renders (a second toast is added, or any state changes) every visible toast restarts its 4 second countdown, and on a page that re-renders more often than `duration` the toast never closes by itself. Fix: keep `onClose` in a ref and make the effect depend on `duration` only.
- [LOW] L58 (CONFIRMED) Each `Toast` root is itself `fixed top-4 right-4`, although `ToastContainer.jsx` L6 already positions a fixed container with `space-y-2`. Impact: when two or more toasts are shown they are all drawn at the same screen position on top of each other, so only the last one can be read. Fix: remove `fixed top-4 right-4 z-50` from the `Toast` root and let the container stack them.

## client/src/components/UI/ToastContainer.jsx

- No bugs found.

## client/src/components/UI/UserAvatar.jsx

- [LOW] L41-43 (LIKELY) The `onError` handler always assigns `e.target.src = fallbackUrl`, with no check that the failing image is not already the fallback. Impact: when the `ui-avatars.com` fallback itself fails to load (service down or blocked by the network), `onError` fires again, sets the same URL again and loops, sending repeated requests for every avatar on the page. Fix: set `e.target.onerror = null` (or check `e.target.src !== fallbackUrl`) before assigning the fallback.

## client/src/components/UI/UserFunds.jsx

- No bugs found.

## client/src/components/UI/WelcomeBanner.jsx

- No bugs found.

## client/src/components/UI/MoreAboutDirector.jsx

- No bugs found.

## client/src/components/UI/FormField.jsx

- No bugs found.

## client/src/components/UI/index.js

- No bugs found.

## client/src/components/UI/Card.jsx

- No bugs found.

## client/src/components/UI/PageHeader.jsx

- No bugs found.

## client/src/components/UI/EmptyState.jsx

- No bugs found.

## client/src/components/UI/Modal.jsx

- No bugs found.

## client/src/components/UI/ConfirmDialog.jsx

- No bugs found.

## client/src/components/UI/StatusBadge.jsx

- No bugs found.

## client/src/components/UI/DataTable.jsx

- No bugs found.

## client/src/components/UI/Skeleton.jsx

- No bugs found.

## client/src/components/UI/Tabs.jsx

- No bugs found.

## client/src/components/UI/Select.jsx

- No bugs found.

## client/src/components/UI/Textarea.jsx

- No bugs found.

## client/src/components/UI/Money.jsx

- No bugs found.

## client/src/components/UI/Button.jsx

- No bugs found.

## client/src/components/UI/Input.jsx

- No bugs found.

## client/src/design/tokens.js

- No bugs found.
