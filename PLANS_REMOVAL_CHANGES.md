# Plans, Memberships & Payment Methods — Removal Summary

This build removes the subscription/plan/membership system and all payment methods.
A company account created by the super admin (or via self-registration) can now use
the system **immediately and fully**, with every enabled module active and no plan,
seat limit, trial, or payment required.

The approach favours **safety over deletion**: the enforcement logic was neutralised
and every user-facing plan/payment surface was removed, while the underlying
`plans` / `orders` / `coupons` / `bank_transfer_payments` tables and their Eloquent
models were left intact (dormant) so nothing that referenced them can break.

---

## How a new company now becomes fully functional

A new helper, `setupCompanyDefaults($userId)` (in `app/Helpers/Helper.php`), runs
whenever a company is created. It:

- activates **all enabled modules** for that company (`user_active_modules`),
- dispatches `DefaultData` so every package seeds its default per-company data,
- dispatches `GivePermissionToRole` for the default staff/client roles,
- sets `total_user = -1` (unlimited users) and `storage_limit = 0` (unlimited).

It is wired into both creation paths:
- `app/Http/Controllers/UserController.php@store` (super admin creates a company)
- `app/Http/Controllers/Auth/RegisteredUserController.php@store` (self-registration)

---

## Backend changes

- **`app/Http/Middleware/PlanModuleCheck.php`** — removed all plan-expiry / trial /
  `active_plan` checks and the redirects to `plans.index`. Only the unrelated
  add-on/module availability check remains.
- **`app/Helpers/Helper.php`**
  - `ActivatedModule()` now returns **all enabled modules** for every company and
    sub-user (no longer limited to plan-assigned modules).
  - `canCreateUser()` always returns `can_create => true` (plan seat limit removed).
  - Added `setupCompanyDefaults()` (see above).
- **`app/Http/Controllers/UserController.php`** — `index()` no longer queries plans,
  `adminHub()` no longer looks up a plan, `assignPlan()` reduced to a harmless stub.
- **`app/Http/Controllers/HomeController.php`** — the super-admin dashboard now shows
  company/user counts and a "new companies per month" chart instead of orders, order
  payments and plan counts.
- **`packages/workdo/LandingPage/.../LandingPageController.php`** — the public
  `/pricing` page no longer queries plans (returns an empty plan list).
- **`routes/web.php`** — removed all routes for `plans`, `coupons`, `orders`,
  `subscriptions`, `users.assign-plan`, `bank-transfer`, and `settings.bank-transfer`.

## Payment methods removed

- Deleted the **`packages/workdo/Stripe`** and **`packages/workdo/Paypal`** packages.
- Removed the **Bank Transfer** settings tab, requests page and routes.
- Added migration `database/migrations/2026_06_20_000000_remove_payment_gateway_addons.php`
  which deletes the Stripe/Paypal `add_ons` rows and their `user_active_modules` rows.

## Frontend changes

- Removed the **Subscription** menu group (super admin) and the **Plan** menu group
  (company) — `resources/js/utils/menus/superadmin-menu.ts`, `company-menu.ts`.
- Removed the **Bank Transfer Settings** tab from both settings menus and the
  settings component registry.
- Deleted pages: `pages/plans`, `pages/orders`, `pages/coupons`, `pages/bank-transfer`,
  `pages/settings/components/bank-transfer-settings.tsx`, and
  `components/ui/subscription-info.tsx`.
- `pages/users/index.tsx` — removed the "Upgrade Plan" buttons and the entire
  plan/module-assignment modal.
- `pages/SuperAdminDashboard.tsx` — replaced order/plan cards & chart with
  company/user cards & a new-companies chart.

## Database seeders

- `DatabaseSeeder` no longer runs `PlanSeeder`, `CouponSeeder`, `DemoOrderSeeder`,
  `DemoCouponDetailsSeeder` or `DemoBankTransferSeeder`. It now runs `PackageSeeder`
  so a fresh install enables all modules and sets the default company to unlimited.
- `PackageSeeder` no longer assigns a plan; it sets the default company to unlimited
  users/storage directly.

---

## Verification

- All modified PHP files pass `php -l` (no syntax errors).
- `tsc` (strict) passes with **0 type errors**.
- `vite build` completes successfully; refreshed assets are in `public/build`.

## Restoring dependencies (this archive excludes `node_modules` and `vendor`)

```bash
composer install
npm install
php artisan migrate        # applies the payment-gateway cleanup migration
# public/build is already included; rebuild only if you change frontend code:
# npm run build
```

## Notes / optional follow-ups (left untouched for safety)

- The `plans`, `orders`, `coupons`, `user_coupons`, `bank_transfer_payments` tables and
  their models still exist but are unused. They can be dropped later if desired.
- Unused plan-related permissions (e.g. `manage-plans`, `manage-coupons`,
  `manage-orders`, `view-upgrade-plan`) were left in place; they simply have no
  routes or menu entries now.
- `composer.json` still lists `stripe/stripe-php` and `srmklive/paypal` (unused
  libraries). They are harmless; remove them with `composer remove` if you wish.
