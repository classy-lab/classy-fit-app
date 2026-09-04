# Stripe Connect Integration Analysis for Classy Fit SaaS

## 1. CURRENT ARCHITECTURE

### 1.1 Frontend (React Native)
- **Location**: `/Users/admin/Sites/classy-fit-app`
- **Technology**: React Native + Expo, TypeScript
- **State Management**: React Context (UserContext, CartContext)
- **Screens**: ProductsScreen, ProductDetailScreen, ViewCartScreen
- **Cart System**: Local storage-based cart with tenant-aware key format (`{gymId}:{userId}`)
- **Authentication**: JWT tokens stored in UserContext
- **API Integration**: Fetch-based requests to `webServer` backend

### 1.2 Backend (PHP REST API)
- **Location**: `/Users/admin/Sites/classy-api`
- **Framework**: Custom REST API with gateway/controller pattern
- **Architecture**: 
  - Controllers (handle requests)
  - Gateways (data access)
  - Models (data structures)
- **Authentication**: JWT tokens via `Bearer` header, decoded by `Auth` class
- **Routing**: Manual route pattern matching in `/api/index.php`
- **API Convention**: `/api/v1/gyms/{gymId}/{resource}` pattern (tenant-scoped)
- **Dependencies**: vlucas/phpdotenv, maestroerror/php-heic-to-jpg (no Stripe SDK yet)
- **Configuration**: `.env` file for database and secret credentials

### 1.3 Database (MySQL/MariaDB)
- **Database Name**: `classy_fit`
- **Multi-tenancy Model**: All tables include `gym_id` foreign key
- **Key Tables**: 
  - `gyms` (gym tenants)
  - `users` (customer/staff accounts)
  - `gym_users` (join table with roles: Owner, Trainer, Member, etc.)
  - `products` (gym-specific products, scoped to gym_id)
  - `orders` (gym-specific orders, scoped to gym_id)
  - `order_items` (line items for orders)
  - `payments` (payment records)
  - `gym_stripe_accounts` (Stripe Connect account tracking)
  - `gym_commerce_settings` (platform fee configuration)
  - `stripe_webhook_events` (webhook event log)

---

## 2. EXISTING DATABASE SCHEMA RELEVANT TO STRIPE

### 2.1 `gym_stripe_accounts` Table (Already Exists!)
```sql
gym_id (PK) → gyms.gym_id
stripe_account_id (VARCHAR 255, UNIQUE) - Stripe Connected Account ID
account_type (VARCHAR 30) - express | standard
onboarding_status (VARCHAR 30) - not_started | pending | completed
details_submitted (TINYINT) - whether details were submitted
charges_enabled (TINYINT) - whether account can accept charges
payouts_enabled (TINYINT) - whether account can receive payouts
country_code (CHAR 2) - ISO country code
default_currency (CHAR 3) - ISO currency code
last_synced_at (TIMESTAMP) - last sync with Stripe API
created_at, updated_at (TIMESTAMP)
```

### 2.2 `payments` Table (Already Exists!)
```sql
uid (PK)
gym_id (FK) → gyms.gym_id
order_uid (FK) → orders.uid
provider (VARCHAR 30) = 'stripe'
status (VARCHAR 30) - created, processing, succeeded, failed, refunded
amount (DECIMAL 12,2)
application_fee_amount (DECIMAL 12,2) - platform fee amount
currency_code (CHAR 3)
stripe_connected_account_id (VARCHAR 255) - reference to gym's Stripe account
stripe_checkout_session_id (VARCHAR 255, UNIQUE)
stripe_payment_intent_id (VARCHAR 255, UNIQUE)
stripe_charge_id (VARCHAR 255, UNIQUE)
stripe_application_fee_id (VARCHAR 255) - Stripe application fee ID
idempotency_key (VARCHAR 100, UNIQUE)
failure_code, failure_message
paid_at, failed_at (TIMESTAMP)
created_at, updated_at (TIMESTAMP)
```

### 2.3 `gym_commerce_settings` Table (Already Exists!)
```sql
gym_id (PK) → gyms.gym_id
store_enabled (TINYINT)
currency_code (CHAR 3)
tax_enabled (TINYINT)
application_fee_type (VARCHAR 20) - percentage | fixed
application_fee_value (DECIMAL 10,4) - fee amount/percentage
created_at, updated_at (TIMESTAMP)
```

### 2.4 `stripe_webhook_events` Table (Already Exists!)
```sql
uid (PK)
stripe_event_id (VARCHAR 255, UNIQUE)
stripe_account_id (VARCHAR 255) - which account sent this event (gym's account)
event_type (VARCHAR 150) - e.g., charge.succeeded, charge.refunded
related_object_id (VARCHAR 255) - related Stripe object ID
livemode (TINYINT)
processing_status (VARCHAR 30) - received | processing | completed | failed
processing_attempts (INT)
error_message (TEXT)
received_at, processed_at, updated_at (TIMESTAMP)
```

### 2.5 `orders` Table (Stripe Fields Already Exist!)
```sql
uid (PK)
gym_id (FK)
user_uid (FK)
order_number (VARCHAR 50)
checkout_idempotency_key (VARCHAR 100, UNIQUE)
...pricing fields...
stripe_connected_account_id (VARCHAR 255) - which gym's Stripe account
stripe_tax_calculation_id (VARCHAR 255)
stripe_tax_transaction_id (VARCHAR 255)
application_fee_amount (DECIMAL 12,2)
...status fields...
```

---

## 3. CURRENT AUTHENTICATION & AUTHORIZATION MODEL

### 3.1 User Authentication
- **JWT Tokens**: Access token + Refresh token
- **Token Structure**: Includes `sub` (user uid), possibly `gym_id`
- **Auth Flow**: Login → JWT token issued → token stored in UserContext
- **Request Auth**: Bearer token in `Authorization: Bearer {token}` header

### 3.2 Multi-Tenant Authorization
- **Gym Scoping**: All resources scoped by `gym_id` from URL parameter
- **User-Gym Relationship**: `gym_users` table tracks user roles per gym
- **Roles**: Owner, Trainer, Member, Staff (roles stored in `gym_users.role`)
- **Current Auth Check**: Controller checks JWT, no explicit gym membership validation visible

### 3.3 Implications for Stripe Connect
- **Identity**: Each gym is a Stripe Connected Account
- **Gym Ownership**: Only gym owners should connect/manage Stripe account
- **Payment Ownership**: Payments must be associated with correct gym's Stripe account
- **User Verification**: Customers (users) must be authenticated members of the gym

---

## 4. WHERE STRIPE CONFIGURATION SHOULD LIVE

### 4.1 Environment Variables (Backend)
```
# .env additions needed:
STRIPE_API_KEY=sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLATFORM_ACCOUNT_ID=acct_...
STRIPE_CONNECT_RETURN_URL=https://app.classy-fit.com/stripe/connect/return
STRIPE_CONNECT_REFRESH_URL=https://app.classy-fit.com/stripe/connect/refresh
STRIPE_CHECKOUT_SESSION_EXPIRES_HOURS=24
```

### 4.2 Database Configuration
- `gym_commerce_settings` table already has `application_fee_type` and `application_fee_value`
- Additional fields may be needed:
  - `stripe_webhook_secret` (per-gym? or global?)
  - `stripe_connect_enabled` (feature flag)

### 4.3 Application Configuration
- Create a `StripeConfig` service class to manage Stripe SDK initialization
- Load credentials from environment variables
- Keep sensitive data server-side only

---

## 5. REQUIRED BACKEND ENDPOINTS/CONTROLLERS/SERVICES

### 5.1 Stripe Connect Onboarding
**Endpoints to Create:**
```
POST   /api/v1/gyms/{gymId}/stripe/onboarding/start
       → Generates OAuth link for connecting Stripe account
       → Returns redirect URL for user to click

GET    /api/v1/gyms/{gymId}/stripe/onboarding/callback
       → Receives OAuth code from Stripe
       → Exchanges code for access token
       → Updates gym_stripe_accounts record

GET    /api/v1/gyms/{gymId}/stripe/account/status
       → Returns current onboarding/capabilities status
       → Returns charges_enabled, payouts_enabled flags

POST   /api/v1/gyms/{gymId}/stripe/account/refresh
       → Manually sync account status from Stripe API
```

**Controller/Service Structure:**
- `StripeConnectController` - handles onboarding flows
- `StripeConnectService` - encapsulates Stripe OAuth logic
- `StripeAccountGateway` - wraps gym_stripe_accounts table queries
- `StripeAccountSyncService` - syncs account status from Stripe

### 5.2 Payment Processing
**Endpoints to Create:**
```
POST   /api/v1/gyms/{gymId}/checkout/sessions
       → Creates Stripe Checkout Session for connected account
       → Includes line items from cart
       → Calculates platform fee
       → Returns session ID for frontend

POST   /api/v1/gyms/{gymId}/payments/verify
       → Verifies payment was successful
       → Updates order and payment status
       → Marks inventory as paid

POST   /api/v1/gyms/{gymId}/orders/{orderId}/retry-payment
       → Retries failed payment
```

**Controller/Service Structure:**
- `CheckoutController` - handles checkout session creation
- `PaymentController` - handles payment verification
- `PaymentService` - creates Stripe payment intents/charges
- `PaymentGateway` - wraps payments table queries (may already exist partially)

### 5.3 Webhook Handling
**Endpoints to Create:**
```
POST   /api/v1/stripe/webhooks
       → Receives Stripe webhook events
       → Validates webhook signature
       → Routes to appropriate handler
       → Returns 200 immediately

Internal Queue/Processing:
- Event handlers for: charge.succeeded, charge.failed, payment_intent.succeeded, etc.
```

**Service Structure:**
- `StripeWebhookController` - validates signatures, routes events
- `StripeWebhookService` - processes events
- `StripeWebhookEventGateway` - stores/retrieves webhook events
- Event handlers (charge succeeded, failed, refunded, etc.)

### 5.4 Refunds & Dispute Handling
**Endpoints to Create:**
```
POST   /api/v1/gyms/{gymId}/orders/{orderId}/refund
       → Issues refund to customer via connected account
       → Updates payment status to refunded
       → Releases inventory

GET    /api/v1/gyms/{gymId}/payments/{paymentId}
       → Returns payment details with Stripe status
```

---

## 6. REQUIRED DATABASE CHANGES

### 6.1 New Tables Needed
None required - all necessary tables already exist!

### 6.2 New Columns Needed (if any)
Consider adding to `gym_stripe_accounts`:
- `stripe_webhook_secret` (if webhooks are per-account, which they're not typically)
- `onboarding_error_reason` (for debugging why onboarding failed)
- `restricted_capabilities` (array/JSON of restrictions from Stripe)

Consider adding to `payments`:
- `refund_id` (track if payment was refunded)
- `refund_amount` (amount refunded)
- `dispute_id` (if customer disputes the charge)

Consider adding to `orders`:
- `payment_method_id` (Stripe Payment Method ID)
- `invoice_id` (if needed for accounting)

### 6.3 Migration Strategy
- Create migrations to add any new columns
- Add indexes for `stripe_account_id`, `stripe_payment_intent_id`, etc.
- Create foreign key constraints

---

## 7. REQUIRED REACT NATIVE SCREENS/COMPONENTS

### 7.1 Gym Owner Screens
**StripeConnectSetupScreen**
- Displays current onboarding status
- Shows "Connect Stripe" button if not connected
- Shows account status if connected
- Button to "Manage Account" (opens Stripe dashboard in browser)

**StripeConnectCallbackScreen**
- Handles OAuth redirect from Stripe
- Shows loading state while exchanging authorization code
- Shows success or error message
- Redirects to dashboard on success

### 7.2 Customer/Member Screens
**CheckoutScreen**
- Displays order summary
- Shows total price with platform fee breakdown
- "Proceed to Payment" button
- Error handling for Stripe issues

**PaymentProcessingScreen**
- Loading state during payment processing
- Handles success redirect
- Shows error if payment failed
- Retry option on failure

**OrderConfirmationScreen**
- Order details
- Payment receipt
- Links to customer service if needed

### 7.3 Components
**StripeConnectStatus**
- Reusable component showing onboarding status
- Green checkmark if connected
- Red warning if not connected

**PriceBreakdown**
- Shows subtotal, fees, total
- Displays platform fee amount/percentage

---

## 8. GYM-STRIPE RELATIONSHIP MODELING

### 8.1 Recommended Model

```
Gym (tenant)
  ↓
  └─→ gym_stripe_accounts (1:1 relationship)
       ├─ stripe_account_id (Stripe Connected Account ID)
       ├─ onboarding_status (not_started | pending | completed | failed)
       ├─ charges_enabled (bool) - can accept payments
       ├─ payouts_enabled (bool) - can receive payouts
       └─ account_sync_info (timestamps, error messages)

Orders (for gym)
  ↓
  └─→ Order.stripe_connected_account_id (references gym's Stripe account)
       └─→ payments (1:N relationship)
            └─ Payment.stripe_payment_intent_id (Stripe Payment Intent)
                ├─ stripe_charge_id
                ├─ stripe_application_fee_id (SaaS platform fee)
                └─ status tracking
```

### 8.2 Key Design Decisions

**1. One Stripe Account Per Gym**
- Each gym owner connects their own Stripe account
- Allows each gym to receive direct payouts
- Enables gym-specific fee structures

**2. Platform Receives Fees Through Application Fee**
- When gym's account is charged, Stripe splits funds
- Platform account gets application fee (configured in `gym_commerce_settings`)
- Gym account gets remainder

**3. No Central Managed Account Needed**
- Alternative: Platform has managed account, gym accounts are sub-accounts
  - **Not recommended** for this architecture - Stripe Connect Express is simpler
- Using Stripe Connect Express:
  - Gym signs up via OAuth flow
  - Gym immediately can accept payments
  - Platform collects fees automatically

---

## 9. RECOMMENDED STRIPE CONNECT ACCOUNT TYPE & PAYMENT FLOW

### 9.1 Account Type: Stripe Connect Express (RECOMMENDED)

**Why Express vs. Standard?**

| Aspect | Express | Standard |
|--------|---------|----------|
| Onboarding | Simple OAuth flow (10 min) | Complex form (30+ min) | 
| User Experience | Seamless | Friction |
| Ownership | Stripe owns account | Gym owns account |
| Control | Limited platform control | Full platform control |
| Payouts | To connected account or platform | Only to account owner |
| Compliance | Stripe handles KYC | Platform handles KYC |
| Best for | SaaS marketplaces | Established platforms |

**Recommendation**: Use **Express** because:
1. Lower friction for gym owners
2. Fast onboarding (minutes, not hours)
3. Suitable for SaaS marketplace model
4. Gym retains branding and autonomy
5. Platform collects fees automatically via `application_fee`

### 9.2 Payment Flow

```
Customer (Member)
   ↓
   └─→ [Frontend] ViewCartScreen
       └─→ Clicks "Checkout"
           ↓
           └─→ [API] POST /api/v1/gyms/{gymId}/checkout/sessions
               └─→ Backend validates:
                   - User is authenticated member of gym ✓
                   - Gym has connected Stripe account ✓
                   - Account is charges_enabled ✓
                   - Cart items are valid for gym ✓
               ↓
               └─→ Backend creates Stripe Checkout Session:
                   - Line items from cart
                   - Platform fee calculation
                   - Targeting gym's Stripe account
                   - Idempotency key for safety
               ↓
               └─→ Frontend receives session ID
                   └─→ Redirects to Stripe Checkout
                       (hosted by Stripe, not custom)
                       ↓
                       └─→ Customer enters payment details
                           ↓
                           └─→ Stripe processes payment
                               ├─ Charges gym's account
                               ├─ Splits into platform fee + gym payout
                               └─ Sends webhook to backend
                           ↓
                           └─→ Webhook handler updates payment status
                               ├─ Updates payments table
                               ├─ Updates order status to "paid"
                               ├─ Releases inventory from reservation
                               └─ Triggers fulfillment workflow
                           ↓
                           └─→ Frontend redirects to OrderConfirmationScreen
                               (or receives push notification)
```

### 9.3 Platform Fee Structure

**Configuration** (in `gym_commerce_settings`):
```
application_fee_type = 'percentage' | 'fixed'
application_fee_value = 2.9  (if percentage: 2.9%)
                      = 0.30  (if fixed: $0.30 per transaction)
```

**Fee Calculation** (backend):
```php
subtotal = order items sum
// Calculate fee based on configuration
if (fee_type == 'percentage') {
    platform_fee = subtotal * (fee_value / 100)
} else {
    platform_fee = fee_value
}

// Stripe also charges its own fee (2.9% + $0.30 by default)
stripe_fee = (subtotal * 0.029) + 0.30

// Customer pays
total = subtotal + stripe_fee (included in line items)

// When charge succeeds:
// Platform receives: platform_fee (application_fee)
// Gym receives: subtotal - platform_fee
```

### 9.4 Webhook Events to Handle

```
charge.succeeded
  ├─ Mark payment as paid
  ├─ Update order status to processing
  └─ Release inventory from reservation

charge.failed
  ├─ Mark payment as failed
  ├─ Update order status to payment_failed
  ├─ Return inventory to stock
  └─ Send failure notification to customer

charge.refunded
  ├─ Mark payment as refunded
  ├─ Update order status to refunded
  ├─ Return items to inventory
  └─ Send refund confirmation to customer

charge.dispute.created
  ├─ Log dispute
  ├─ Notify gym owner
  └─ Flag order for review

account.updated
  ├─ Sync charges_enabled, payouts_enabled status
  └─ Update gym_stripe_accounts record
```

---

## 10. PHASED IMPLEMENTATION PLAN

### Phase 1: Foundation & Account Setup (Week 1-2)
**Goals**: Connect gym Stripe accounts, store credentials, verify connection

**Tasks**:
1. Install Stripe PHP SDK via Composer
2. Create `StripeConfig` service class to initialize Stripe SDK
3. Create `StripeConnectController` with OAuth endpoints:
   - `startOnboarding()` → generates OAuth link
   - `handleCallback()` → receives auth code, exchanges for token
4. Create `StripeAccountGateway` class to query/update `gym_stripe_accounts`
5. Create `StripeAccountService` class to:
   - Save account credentials
   - Sync account status from Stripe API
   - Check charges_enabled, payouts_enabled flags
6. Add database indexes on stripe-related columns
7. Frontend: Create `StripeConnectSetupScreen`
8. Frontend: Create `StripeConnectCallbackScreen`
9. Test OAuth flow end-to-end in sandbox

**Validation**:
- Gym owner can initiate Stripe connection
- OAuth redirect works correctly
- Account ID is stored in `gym_stripe_accounts`
- Status is correctly synced and displayed

---

### Phase 2: Payment Processing (Week 3-4)
**Goals**: Accept payments via connected Stripe accounts with platform fees

**Tasks**:
1. Create `PaymentService` to build Stripe Checkout Session payloads
2. Create `CheckoutController` with:
   - `createCheckoutSession()` → returns Stripe session ID for frontend
   - Includes platform fee calculation
3. Create `PaymentGateway` (or extend `OrderGateway`) to insert payment records
4. Update `OrderController.createOrder()` to:
   - Validate gym has connected Stripe account
   - Calculate platform fee
   - Create payment record with PENDING status
5. Frontend: Update `ViewCartScreen` to show fee breakdown
6. Frontend: Create `CheckoutScreen` that:
   - Displays order summary with fees
   - Calls `/checkout/sessions` endpoint
   - Redirects to Stripe Checkout
7. Frontend: Create `OrderConfirmationScreen`
8. Test checkout flow in sandbox:
   - Cart → Checkout → Stripe Checkout → Success flow

**Validation**:
- Checkout session created with correct gym's Stripe account
- Platform fee correctly calculated and included
- Session redirects to Stripe Checkout
- Sandbox payment succeeds
- Payment record created with session ID

---

### Phase 3: Webhook Processing (Week 5)
**Goals**: Handle Stripe webhooks, update order/payment status

**Tasks**:
1. Create `StripeWebhookController`:
   - `handleWebhook()` endpoint
   - Validates webhook signature using secret
   - Routes to appropriate event handler
   - Returns 200 immediately (queue for async processing)
2. Create `StripeWebhookService`:
   - `handleChargeSucceeded()` - update payment/order status
   - `handleChargeFailed()` - mark failed, return inventory
   - `handleChargeRefunded()` - mark refunded, return inventory
   - `handleAccountUpdated()` - sync account status
3. Create `StripeWebhookEventGateway` to log events in `stripe_webhook_events`
4. Create webhook signing secret management:
   - Store in `.env`
   - Add validation logic
5. Register webhook endpoint in Stripe dashboard
6. Test webhook processing:
   - Use Stripe CLI to forward events locally
   - Verify status updates correctly

**Validation**:
- Webhook signature validation works
- charge.succeeded updates order to "processing"
- Payment record marked as "paid"
- Inventory released from reservation
- Events logged in `stripe_webhook_events`
- Webhook can be replayed if processing fails

---

### Phase 4: Admin Dashboard & Management (Week 6)
**Goals**: Gym owners can view payment history and refund

**Tasks**:
1. Create `PaymentHistoryScreen` (frontend):
   - Lists recent payments for gym
   - Shows amount, status, date
   - Links to order details
2. Create `RefundController` with:
   - `issueRefund()` endpoint
   - Validates authorization (gym owner only)
   - Calls Stripe API to issue refund
   - Updates payment record
3. Create refund confirmation flow
4. Create payment detail view showing:
   - Customer name
   - Order details
   - Payment status and date
   - Transaction fees breakdown
5. Create settlement/payout tracking:
   - Show when platform fee was collected
   - Show when gym receives payout

**Validation**:
- Gym owner can see payment history
- Payment details display correctly
- Refund initiates successfully
- Payment status updates to "refunded"
- Inventory returns to stock

---

### Phase 5: Error Handling & Edge Cases (Week 7)
**Goals**: Handle failures gracefully, retry logic

**Tasks**:
1. Implement idempotent payment creation:
   - Use `checkout_idempotency_key` or `idempotency_key`
   - Prevent double-charging if retry occurs
2. Implement payment retry logic:
   - Failed payments can be retried
   - Endpoint: `POST /api/v1/gyms/{gymId}/orders/{orderId}/retry-payment`
3. Implement webhook retry/dead-letter handling:
   - Track failed webhook processing
   - Allow manual retry
   - Alert if too many failures
4. Implement error notifications:
   - Frontend: Show error messages to user
   - Backend: Log errors, send alerts to gym owner
5. Handle account disconnection:
   - Stripe account becomes charges_disabled
   - Stop accepting new orders
   - Notify gym owner
6. Handle currency/tax edge cases:
   - Validate currency matches account
   - Tax calculation fallback

**Validation**:
- Duplicate payment attempts are rejected
- Failed payments can be retried
- Error messages are user-friendly
- All error cases are logged
- No money is lost in any error scenario

---

### Phase 6: Testing & Documentation (Week 8)
**Goals**: Comprehensive testing, documentation

**Tasks**:
1. Unit tests:
   - StripeConnectService tests
   - PaymentService tests
   - Platform fee calculation tests
   - Webhook event handling tests
2. Integration tests:
   - Full checkout flow
   - Webhook processing
   - Refund flow
3. End-to-end tests:
   - Gym owner setup Stripe account
   - Customer purchases product
   - Webhook updates status
   - Payment receipt sent
4. Documentation:
   - API endpoint documentation
   - Webhook event documentation
   - Error codes and meanings
   - Deployment checklist
   - Troubleshooting guide
5. Security audit:
   - Webhook signature validation
   - Access control (only gym owner can manage account)
   - Idempotency checks
   - No sensitive data in logs

---

### Phase 7: Go Live (Week 9-10)
**Goals**: Deploy to production

**Tasks**:
1. Switch from Stripe test mode to live mode
2. Update environment variables with live API key
3. Register live webhook endpoint in Stripe
4. Perform live transaction testing with small amount
5. Monitor logs for 48 hours
6. Create runbook for operations team
7. Set up alerts for:
   - Payment failures
   - Webhook processing failures
   - Account capability changes
   - Refunds issued
8. Train gym owner support team

---

## CLARIFICATIONS NEEDED

Before implementing, please confirm:

1. **Platform Fee Strategy**: 
   - Should platform fee be percentage, fixed, or configurable per gym?
   - Who sets the fee - platform or gym owner?

2. **Refund Authority**:
   - Can gym owner issue refunds without platform approval?
   - Or does platform must approve all refunds?

3. **Tax Handling**:
   - Should Stripe Tax be used for tax calculation?
   - Or does your existing tax calculation logic suffice?

4. **Webhook Signature**:
   - Should webhook secret be global or per-gym?
   - (Recommend: global, Stripe only sends from platform account)

5. **Go-Live Timeline**:
   - Do you need sandboxtesting first, or go live immediately?
   - Any regulatory requirements (money transmission license, etc.)?

6. **Payout Schedule**:
   - Daily, weekly, monthly payouts to gym accounts?
   - Should platform retain funds temporarily?

7. **Metrics & Reporting**:
   - Need analytics dashboard showing transaction volume, fees collected?
   - Need integration with accounting software?

8. **Dispute Handling**:
   - How should chargebacks/disputes be handled?
   - Should gym owner be notified immediately?

9. **Velocity Limits**:
   - Any transaction limits per gym or per customer?
   - Fraud prevention measures?

10. **Existing Orders**:
    - Should existing unpaid orders be migrated to new Stripe payment flow?
    - Or only new orders use new flow?

