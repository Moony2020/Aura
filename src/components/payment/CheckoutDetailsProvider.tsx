"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type AddressFields = { firstName: string; lastName: string; addressLine1: string; addressLine2: string; postalCode: string; city: string; countryCode: "SE" };
type CheckoutDetails = AddressFields & { email: string; phone: string; billingSameAsDelivery: boolean; billing: AddressFields };
type CheckoutDetailsContextValue = { details: CheckoutDetails; deliveryComplete: boolean };

const initialAddress: AddressFields = { firstName: "", lastName: "", addressLine1: "", addressLine2: "", postalCode: "", city: "", countryCode: "SE" };
const initialDetails: CheckoutDetails = { ...initialAddress, email: "", phone: "", billingSameAsDelivery: true, billing: { ...initialAddress } };
const CheckoutDetailsContext = createContext<CheckoutDetailsContextValue | null>(null);

export function useCheckoutDetails() {
  const value = useContext(CheckoutDetailsContext);
  if (!value) throw new Error("useCheckoutDetails must be used inside CheckoutDetailsProvider.");
  return value;
}

export function CheckoutDetailsProvider({ children }: { children: ReactNode }) {
  const [details, setDetails] = useState(initialDetails);
  const deliveryComplete = Boolean(details.firstName.trim() && details.lastName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()) && details.addressLine1.trim() && details.postalCode.trim() && details.city.trim() && details.countryCode === "SE");
  const update = <K extends keyof CheckoutDetails>(key: K, value: CheckoutDetails[K]) => setDetails((current) => ({ ...current, [key]: value }));
  const updateAddress = (target: "delivery" | "billing", key: keyof AddressFields, value: string) => setDetails((current) => target === "delivery" ? { ...current, [key]: value } : { ...current, billing: { ...current.billing, [key]: value } });
  const value = useMemo(() => ({ details, deliveryComplete }), [details, deliveryComplete]);
  const fields = (target: "delivery" | "billing") => {
    const address = target === "delivery" ? details : details.billing;
    return <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-xs text-[#a99e8a]">First name<input required={target === "delivery"} autoComplete="given-name" value={address.firstName} onChange={(event) => updateAddress(target, "firstName", event.target.value)} className="rounded-md border border-[#3a3528] bg-[#121016] px-3 py-2 text-sm text-[#f3ebdb]" /></label>
      <label className="grid gap-1 text-xs text-[#a99e8a]">Last name<input required={target === "delivery"} autoComplete="family-name" value={address.lastName} onChange={(event) => updateAddress(target, "lastName", event.target.value)} className="rounded-md border border-[#3a3528] bg-[#121016] px-3 py-2 text-sm text-[#f3ebdb]" /></label>
      <label className="grid gap-1 text-xs text-[#a99e8a] sm:col-span-2">Address line 1<input required={target === "delivery"} autoComplete="address-line1" value={address.addressLine1} onChange={(event) => updateAddress(target, "addressLine1", event.target.value)} className="rounded-md border border-[#3a3528] bg-[#121016] px-3 py-2 text-sm text-[#f3ebdb]" /></label>
      <label className="grid gap-1 text-xs text-[#a99e8a] sm:col-span-2">Address line 2 (optional)<input autoComplete="address-line2" value={address.addressLine2} onChange={(event) => updateAddress(target, "addressLine2", event.target.value)} className="rounded-md border border-[#3a3528] bg-[#121016] px-3 py-2 text-sm text-[#f3ebdb]" /></label>
      <label className="grid gap-1 text-xs text-[#a99e8a]">Postal code<input required={target === "delivery"} autoComplete="postal-code" value={address.postalCode} onChange={(event) => updateAddress(target, "postalCode", event.target.value)} className="rounded-md border border-[#3a3528] bg-[#121016] px-3 py-2 text-sm text-[#f3ebdb]" /></label>
      <label className="grid gap-1 text-xs text-[#a99e8a]">City<input required={target === "delivery"} autoComplete="address-level2" value={address.city} onChange={(event) => updateAddress(target, "city", event.target.value)} className="rounded-md border border-[#3a3528] bg-[#121016] px-3 py-2 text-sm text-[#f3ebdb]" /></label>
      <label className="grid gap-1 text-xs text-[#a99e8a] sm:col-span-2">Country<input readOnly value="Sweden" className="cursor-not-allowed rounded-md border border-[#3a3528] bg-[#121016] px-3 py-2 text-sm text-[#a99e8a]" /></label>
    </div>;
  };
  return <CheckoutDetailsContext.Provider value={value}><div className="space-y-6">
    <section className="rounded-2xl border border-[#c5a869]/20 bg-[#121016] p-6" aria-labelledby="contact-information-title">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a869]">Contact information</p><h2 id="contact-information-title" className="mt-2 font-serif text-2xl">Your details</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs text-[#a99e8a]">Email<input required type="email" autoComplete="email" value={details.email} onChange={(event) => update("email", event.target.value)} className="rounded-md border border-[#3a3528] bg-[#121016] px-3 py-2 text-sm text-[#f3ebdb]" /></label><label className="grid gap-1 text-xs text-[#a99e8a]">Phone (optional)<input type="tel" autoComplete="tel" value={details.phone} onChange={(event) => update("phone", event.target.value)} className="rounded-md border border-[#3a3528] bg-[#121016] px-3 py-2 text-sm text-[#f3ebdb]" /></label></div>
    </section>
    <section className="rounded-2xl border border-[#c5a869]/20 bg-[#121016] p-6" aria-labelledby="delivery-address-title"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a869]">Delivery address</p><h2 id="delivery-address-title" className="mt-2 font-serif text-2xl">Where should we deliver?</h2><div className="mt-4">{fields("delivery")}</div></section>
    <section className="rounded-2xl border border-[#c5a869]/20 bg-[#121016] p-6" aria-labelledby="billing-address-title"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a869]">Billing address</p><h2 id="billing-address-title" className="mt-2 font-serif text-2xl">Payment details</h2></div><label className="flex items-center gap-2 text-xs text-[#a99e8a]"><input type="checkbox" checked={details.billingSameAsDelivery} onChange={(event) => update("billingSameAsDelivery", event.target.checked)} /> Same as delivery</label></div>{!details.billingSameAsDelivery && <div className="mt-4">{fields("billing")}</div>}</section>
    {children}
  </div></CheckoutDetailsContext.Provider>;
}
