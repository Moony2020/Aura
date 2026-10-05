import { CreditCard, ShieldCheck } from "lucide-react";
import { cookies } from "next/headers";
import { CheckoutPaymentHost } from "@/components/payment/CheckoutPaymentHost";
import { PayPalPaymentHost } from "@/components/payment/PayPalPaymentHost";
import { CheckoutDetailsProvider } from "@/components/payment/CheckoutDetailsProvider";
import { formatMinorUnitMoney } from "@/lib/money";
import { createCartService } from "@/server/cart/cart-service";
import { GUEST_CART_COOKIE_NAME } from "@/server/cart/guest-cart-token";
import { getP2PayPalClientId } from "@/server/payment/p2-paypal-order-action";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <CheckoutPageContent />;
}

async function CheckoutPageContent() {
  const cookieStore = await cookies();
  const cart = await createCartService().readCurrentCart({
    kind: "GUEST",
    guestToken: cookieStore.get(GUEST_CART_COOKIE_NAME)?.value ?? null,
  });
  const paypalClient = await getP2PayPalClientId();

  return (
    <main className="min-h-screen bg-[#080809] px-4 py-16 text-[#f3ebdb] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c5a869]">Secure checkout</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Complete your purchase</h1>
          <p className="max-w-xl text-sm leading-relaxed text-[#a99e8a]">
            Secure card payment is available when an approved checkout payment session is ready.
          </p>
        </header>

        <CheckoutDetailsProvider>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
        <section className="rounded-2xl border border-[#c5a869]/20 bg-[#121016] p-6" aria-labelledby="checkout-cart-title">
          <div className="flex items-center justify-between gap-4">
            <h2 id="checkout-cart-title" className="font-serif text-xl">Your bag</h2>
            <a href="/cart" className="text-xs uppercase tracking-[0.14em] text-[#e5c982]">Edit bag</a>
          </div>
          {cart.items.length ? (
            <ul className="mt-4 divide-y divide-[#3a3528]/60">
              {cart.items.map((item) => (
                <li key={item.lineId} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="min-w-0"><span className="block text-xs uppercase tracking-[0.14em] text-[#c5a869]">{item.audience ?? "Fragrance"}</span><span className="block text-[#f3ebdb]">{item.productName}</span><span className="block text-xs text-[#a99e8a]">{item.variantLabel} × {item.quantity}</span></span>
                  <strong>{item.lineTotal ? formatMinorUnitMoney(item.lineTotal) : "Unavailable"}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[#a99e8a]">Your bag is empty. Add a fragrance before preparing payment.</p>
          )}
          <div className="mt-4 space-y-2 border-t border-[#3a3528]/60 pt-4 text-sm">
            <div className="flex justify-between"><span>Merchandise</span><strong>{formatMinorUnitMoney(cart.subtotal)}</strong></div>
            <div className="flex justify-between"><span>Standard Delivery</span><strong>{cart.subtotal.amount >= 79900 ? "Free" : "59 SEK"}</strong></div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#c5a869]/30 bg-[#121016] p-6 shadow-xl sm:p-8" aria-labelledby="payment-unavailable-title">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#c5a869]/40 bg-[#c5a869]/10 text-[#e5c982]">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h2 id="payment-unavailable-title" className="font-serif text-xl">Payment session unavailable</h2>
              <p className="text-sm leading-relaxed text-[#a99e8a]">
                There is no authorized payment session for this checkout yet. Your cart and inventory have not been changed.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-5 border-t border-[#3a3528]/60 pt-5">
            <CheckoutPaymentHost cart={cart} />
            <PayPalPaymentHost cart={cart} clientId={paypalClient.ok ? paypalClient.clientId : null} />
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-[#3a3528]/60 pt-4 text-xs text-[#a99e8a]">
            <ShieldCheck className="h-4 w-4 text-[#c5a869]" aria-hidden="true" />
            <span>Card details are collected only by Stripe when a valid payment session is provided.</span>
          </div>
        </section>
        </div>
        </CheckoutDetailsProvider>
      </div>
    </main>
  );
}
