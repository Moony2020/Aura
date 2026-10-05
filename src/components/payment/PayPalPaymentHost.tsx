"use client";

import { useEffect, useRef, useState } from "react";
import { captureP3PayPalPayment, prepareP2PayPalOrder, verifyP2PayPalApproval } from "@/server/payment/p2-paypal-order-action";
import { useCheckoutDetails } from "./CheckoutDetailsProvider";
import type { CartViewModel } from "@/server/cart/cart-service";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": { id?: string; type?: string; hidden?: boolean; ref?: React.Ref<HTMLElement>; "aria-label"?: string };
    }
  }
}

type PayPalSdk = { createInstance(options: { clientId: string; components: string[]; pageType: string; locale: string }): Promise<PayPalInstance> };
type PayPalInstance = { findEligibleMethods(input: { currencyCode: string }): Promise<{ isEligible(method: string): boolean }>; createPayPalOneTimePaymentSession(options: { onApprove(data: { orderId: string }): void; onCancel(): void; onError(error: unknown): void }): { start(options: { presentationMode: "auto" }, order: Promise<{ orderId: string }>): Promise<void> } };
declare global { interface Window { paypal?: PayPalSdk } }

const PAYPAL_CORE_URL = "https://www.sandbox.paypal.com/web-sdk/v6/core";
const PAYPAL_CORE_TIMEOUT_MS = 15000;

let paypalCorePromise: Promise<PayPalSdk> | null = null;
let paypalInstancePromise: Promise<PayPalInstance> | null = null;

function loadPayPalCore(): Promise<PayPalSdk> {
  if (typeof window === "undefined") return Promise.reject(new Error("PayPal SDK can only load in a browser."));
  if (window.paypal?.createInstance) return Promise.resolve(window.paypal);
  if (paypalCorePromise) return paypalCorePromise;

  paypalCorePromise = new Promise<PayPalSdk>((resolve, reject) => {
    const script = document.querySelector<HTMLScriptElement>("script[data-aura-paypal-v6-core]");
    const activeScript = script ?? document.createElement("script");
    if (!script) {
      activeScript.src = PAYPAL_CORE_URL;
      activeScript.async = true;
      activeScript.setAttribute("data-aura-paypal-v6-core", "true");
    }
    let settled = false;
    let poll: number | undefined;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (poll !== undefined) window.clearInterval(poll);
      if (window.paypal?.createInstance) resolve(window.paypal);
      else reject(new Error("PayPal Sandbox core loaded without window.paypal.createInstance."));
    };
    const fail = () => { if (!settled) { settled = true; if (poll !== undefined) window.clearInterval(poll); reject(new Error("PayPal Sandbox core script could not be loaded.")); } };
    const timeout = window.setTimeout(fail, PAYPAL_CORE_TIMEOUT_MS);
    activeScript.addEventListener("load", () => { window.clearTimeout(timeout); finish(); }, { once: true });
    activeScript.addEventListener("error", () => { window.clearTimeout(timeout); fail(); }, { once: true });
    if (!script) document.head.appendChild(activeScript);
    poll = window.setInterval(() => {
      if (window.paypal?.createInstance) {
        window.clearTimeout(timeout);
        finish();
      }
    }, 50);
  }).catch((error) => { paypalCorePromise = null; throw error; });
  return paypalCorePromise;
}

function createPayPalInstance(clientId: string): Promise<PayPalInstance> {
  if (paypalInstancePromise) return paypalInstancePromise;
  paypalInstancePromise = (async () => {
    if (!window.paypal || typeof window.paypal.createInstance !== "function") {
      throw new Error("PayPal Sandbox SDK createInstance is unavailable.");
    }
    return window.paypal.createInstance({ clientId, components: ["paypal-payments"], pageType: "checkout", locale: "en-GB" });
  })().catch((error) => {
    paypalInstancePromise = null;
    throw error;
  });
  return paypalInstancePromise;
}

async function waitForPayPalButton(): Promise<void> {
  if (customElements.get("paypal-button")) return;
  await Promise.race([
    customElements.whenDefined("paypal-button"),
    new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("PayPal button registration timed out.")), PAYPAL_CORE_TIMEOUT_MS)),
  ]);
}

export function PayPalPaymentHost({ cart, clientId }: { cart: CartViewModel; clientId: string | null }) {
  const buttonRef = useRef<HTMLElement | null>(null);
  const sessionRef = useRef<ReturnType<PayPalInstance["createPayPalOneTimePaymentSession"]> | null>(null);
  const activeAttemptRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"loading-core" | "initializing" | "checking-eligibility" | "ready" | "approved" | "error">("loading-core");
  const [message, setMessage] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const { details, deliveryComplete } = useCheckoutDetails();
  const detailsRef = useRef(details);
  const deliveryCompleteRef = useRef(deliveryComplete);
  detailsRef.current = details;
  deliveryCompleteRef.current = deliveryComplete;

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      if (!cart.items.length || !cart.checkoutEligible || !clientId) {
        if (!clientId) {
          setStatus("error");
          setMessage("PayPal Sandbox is unavailable.");
        }
        return;
      }
      setStatus("loading-core");
      setMessage(null);
      await loadPayPalCore();
      if (cancelled) return;
      setStatus("initializing");
      const sdk = await createPayPalInstance(clientId);
      if (cancelled) return;
      setStatus("checking-eligibility");
      const eligible = await sdk.findEligibleMethods({ currencyCode: "SEK" });
      if (!eligible.isEligible("paypal")) throw new Error("PayPal is not available for this checkout.");
      await waitForPayPalButton();
      if (cancelled) return;
      sessionRef.current = sdk.createPayPalOneTimePaymentSession({
        onApprove: async (data) => {
          const attemptId = activeAttemptRef.current;
          if (!attemptId) { setMessage("PayPal approval could not be linked to this checkout."); return; }
          const verified = await verifyP2PayPalApproval({ paymentAttemptId: attemptId, providerOrderId: data.orderId });
          if (!verified.ok) { setMessage(verified.message); return; }
          const captured = await captureP3PayPalPayment({ paymentAttemptId: attemptId });
          if (captured.ok) { setStatus("approved"); setMessage(captured.message); }
          else setMessage(captured.message);
        },
        onCancel: () => setMessage("PayPal approval was cancelled."),
        onError: () => setMessage("PayPal approval is unavailable."),
      });
      setStatus("ready");
    }
    void initialize().catch((error) => {
      if (!cancelled) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "PayPal Sandbox is unavailable.");
      }
    });
    return () => { cancelled = true; };
  }, [cart.checkoutEligible, cart.items.length, clientId, retryNonce]);

  useEffect(() => {
    let cancelled = false;
    if (status !== "ready" || !sessionRef.current) return;
    const button = buttonRef.current;
    if (!button) return;
    const onClick = async () => {
      if (!deliveryCompleteRef.current) {
        setMessage("Complete your contact and delivery details before choosing PayPal.");
        return;
      }
      setMessage(null);
      const result = await prepareP2PayPalOrder({ firstName: detailsRef.current.firstName, lastName: detailsRef.current.lastName, email: detailsRef.current.email, phone: detailsRef.current.phone || undefined, addressLine1: detailsRef.current.addressLine1, addressLine2: detailsRef.current.addressLine2 || undefined, city: detailsRef.current.city, postalCode: detailsRef.current.postalCode, countryCode: detailsRef.current.countryCode });
      if (!result.ok) { setMessage(result.message); return; }
      activeAttemptRef.current = result.paymentAttemptId;
      try {
        await sessionRef.current?.start({ presentationMode: "auto" }, Promise.resolve({ orderId: result.orderId }));
      } catch {
        setMessage("PayPal approval is unavailable after the Sandbox order was prepared.");
      }
    };
    button.addEventListener("click", onClick);
    return () => {
      cancelled = true;
      button.removeEventListener("click", onClick);
    };
  }, [status]);

  if (!cart.items.length || !cart.checkoutEligible) return null;
  return <div className="space-y-2 border-t border-[#3a3528]/60 pt-3">
    {status === "ready" || status === "approved" ? <paypal-button ref={buttonRef as React.RefObject<HTMLElement>} id="paypal-btn" type="pay" aria-label="Pay with PayPal" /> : null}
    {status === "loading-core" || status === "initializing" || status === "checking-eligibility" ? <p className="text-sm text-[#a99e8a]">Loading PayPal…</p> : null}
    {status === "approved" ? <p role="status" className="text-sm text-[#c5a869]">PayPal approval received. Payment has not been captured yet.</p> : null}
    {status === "error" ? <button type="button" onClick={() => setRetryNonce((value) => value + 1)} className="rounded-lg border border-[#c5a869]/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#e5c982]">Retry PayPal</button> : null}
    {message ? <p role="alert" className="text-sm text-[#b87863]">{message}</p> : null}
  </div>;
}
