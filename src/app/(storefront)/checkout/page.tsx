import { CreditCard, ShieldCheck } from "lucide-react";
import { CheckoutPaymentHost } from "@/components/payment/CheckoutPaymentHost";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#080809] px-4 py-16 text-[#f3ebdb] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c5a869]">Secure checkout</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Complete your purchase</h1>
          <p className="max-w-xl text-sm leading-relaxed text-[#a99e8a]">
            Secure card payment is available when an approved checkout payment session is ready.
          </p>
        </header>

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
          <div className="mt-6 border-t border-[#3a3528]/60 pt-6">
            <CheckoutPaymentHost />
          </div>
          <div className="mt-6 flex items-center gap-2 border-t border-[#3a3528]/60 pt-4 text-xs text-[#a99e8a]">
            <ShieldCheck className="h-4 w-4 text-[#c5a869]" aria-hidden="true" />
            <span>Card details are collected only by Stripe when a valid payment session is provided.</span>
          </div>
        </section>
      </div>
    </main>
  );
}
