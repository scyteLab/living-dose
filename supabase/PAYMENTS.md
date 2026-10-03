# Online payments with Paystack

Members can choose **Pay now** (card, bank transfer or USSD on Paystack's secure page)
or **Pay on delivery** at checkout. The amount always comes from the server, and only
a signed notification from Paystack can mark an order paid.

## 1. Paystack account
1. Sign up at paystack.com and verify your business.
2. In **Settings → API Keys & Webhooks**, copy your **test** secret key (`sk_test_…`).
   Start in test mode: no real money moves.

## 2. Database
Run `migrations/0012_payments.sql` in the Supabase SQL Editor (after 0011).

## 3. Server functions
Install the Supabase CLI (supabase.com/docs/guides/cli), then from the project folder:

```bash
supabase login
supabase link --project-ref uuuoymrszvtttagdtpel
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx SITE_URL=https://livingdose.netlify.app
supabase functions deploy paystack
supabase functions deploy paystack-webhook --no-verify-jwt
```

`--no-verify-jwt` is needed for the webhook only: Paystack can't sign in, so that
function checks Paystack's signature instead.

## 4. Tell Paystack where to send notifications
In **Settings → API Keys & Webhooks**, set the **Test Webhook URL** to:

```
https://uuuoymrszvtttagdtpel.supabase.co/functions/v1/paystack-webhook
```

## 5. Turn it on in the app
Add to Netlify → Site configuration → Environment variables (and `.env.local`):

```
VITE_PAYSTACK_ENABLED=true
```

Redeploy. "Pay now" now appears at checkout.

## 6. Test it
Place an order with **Pay now** and use a Paystack test card from
paystack.com/docs/payments/test-payments (for example 4084 0840 8408 4081,
any future expiry, CVV 408). You should return to the order page, see
"Confirming your payment…", then "Payment received". In the staff console the
order shows **Paid** and can be packed.

## 7. Going live
When you're ready: switch Paystack to live mode, set the **live** secret key with
`supabase secrets set PAYSTACK_SECRET_KEY=sk_live_…`, and set the **Live Webhook URL**
to the same address as above.

## If something goes wrong
- **"Pay now" doesn't appear:** check `VITE_PAYSTACK_ENABLED=true` and redeploy.
- **Stuck on "Confirming your payment…":** check the webhook URL in Paystack, and the
  function logs in Supabase → Edge Functions. The order page also asks Paystack
  directly, so a slow webhook still resolves.
- **Never share your secret key.** It only lives in Supabase secrets, never in the app
  or in `.env` files committed to GitHub.
