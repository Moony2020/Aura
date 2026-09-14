"use client";

import { useState, useTransition } from "react";
import { StripePaymentElement } from "./StripePaymentElement";
import { prepareP4CheckoutPayment } from "@/server/payment/p4-checkout-action";

export function CheckoutPaymentHost() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function preparePayment() {
    setMessage(null);
    startTransition(async () => {
      const result = await prepareP4CheckoutPayment();
      if (result.ok) setClientSecret(result.clientSecret);
      else setMessage(result.message);
    });
  }

  if (clientSecret) {
    return <StripePaymentElement clientSecret={clientSecret} />;
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={preparePayment} disabled={isPending} className="rounded-lg bg-[#c5a869] px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#17130d] disabled:cursor-not-allowed disabled:opacity-50">
        {isPending ? "Preparing secure payment…" : "Prepare secure card payment"}
      </button>
      {message ? <p role="alert" className="text-sm text-[#b87863]">{message}</p> : null}
    </div>
  );
}
