"use client";

import { useState, useTransition } from "react";
import { StripePaymentElement } from "./StripePaymentElement";
import { useCheckoutDetails } from "./CheckoutDetailsProvider";
import { prepareP4CheckoutPayment } from "@/server/payment/p4-checkout-action";
import type { CartViewModel } from "@/server/cart/cart-service";

export function CheckoutPaymentHost({ cart }: { cart: CartViewModel }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { details, deliveryComplete } = useCheckoutDetails();

  function preparePayment() {
    setMessage(null);
    if (!deliveryComplete) {
      setMessage("Complete your contact and delivery details before preparing card payment.");
      return;
    }
    startTransition(async () => {
      const result = await prepareP4CheckoutPayment({ firstName: details.firstName, lastName: details.lastName, email: details.email, phone: details.phone || undefined, addressLine1: details.addressLine1, addressLine2: details.addressLine2 || undefined, city: details.city, postalCode: details.postalCode, countryCode: details.countryCode });
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
      {!cart.items.length || !cart.checkoutEligible ? <p className="text-sm text-[#b87863]">Add an available fragrance to your bag before preparing payment.</p> : null}
      {message ? <p role="alert" className="text-sm text-[#b87863]">{message}</p> : null}
    </div>
  );
}
