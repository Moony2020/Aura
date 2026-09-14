"use client";

import { useState, type FormEvent } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { publicEnv } from "@/config/env.public";

const stripePromise = publicEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(publicEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type StripePaymentElementFormProps = {
  onValidated?: () => Promise<void> | void;
};

function PaymentElementForm({ onValidated }: StripePaymentElementFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setPending(true);
    setMessage(null);
    const { error } = await elements.submit();
    if (error) {
      setMessage(error.message ?? "Payment details need attention.");
      setPending(false);
      return;
    }

    // Validation is only a handoff signal. It is not payment proof.
    await onValidated?.();
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Secure card payment">
      <PaymentElement />
      {message ? <p role="alert">{message}</p> : null}
      <button type="submit" disabled={!stripe || !elements || pending}>
        {pending ? "Preparing…" : "Continue securely"}
      </button>
    </form>
  );
}

export function StripePaymentElement({
  clientSecret,
  onValidated,
}: { clientSecret: string; onValidated?: StripePaymentElementFormProps["onValidated"] }) {
  if (!stripePromise) {
    return <p role="alert">Secure card payments are temporarily unavailable.</p>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentElementForm onValidated={onValidated} />
    </Elements>
  );
}
