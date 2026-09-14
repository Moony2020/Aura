"use client";

import { useState } from "react";

import type { Address } from "@/domain/user/user.schema";
import { createAddressAction, deleteAddressAction, updateAddressAction } from "@/server/account/address-actions";

type AddressDraft = {
  recipientFirstName: string;
  recipientLastName: string;
  company: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  phone: string;
  defaultShipping: boolean;
  defaultBilling: boolean;
};

const emptyDraft: AddressDraft = {
  recipientFirstName: "", recipientLastName: "", company: "", addressLine1: "", addressLine2: "", city: "", region: "", postalCode: "", countryCode: "SE", phone: "", defaultShipping: false, defaultBilling: false,
};

function draftFromAddress(address: Address): AddressDraft {
  return { recipientFirstName: address.recipientFirstName, recipientLastName: address.recipientLastName, company: address.company ?? "", addressLine1: address.addressLine1, addressLine2: address.addressLine2 ?? "", city: address.city, region: address.region ?? "", postalCode: address.postalCode, countryCode: address.countryCode, phone: address.phone ?? "", defaultShipping: address.defaultShipping, defaultBilling: address.defaultBilling };
}

export function AccountAddresses({ initialAddresses }: { initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [draft, setDraft] = useState<AddressDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateDraft(field: keyof AddressDraft, value: string | boolean) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function startCreate() {
    setEditingId(null); setDraft(emptyDraft); setMessage(""); setError("");
  }

  function startEdit(address: Address) {
    setEditingId(address.id); setDraft(draftFromAddress(address)); setMessage(""); setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(""); setError("");
    const result = editingId ? await updateAddressAction(editingId, draft) : await createAddressAction(draft);
    setPending(false);
    if (!result.ok) { setError(result.error.message); return; }
    setAddresses((current) => editingId ? current.map((address) => address.id === result.address.id ? result.address : address) : [...current, result.address]);
    setMessage(editingId ? "Address updated." : "Address saved."); setEditingId(null); setDraft(emptyDraft);
  }

  async function remove(addressId: string) {
    setPending(true); setMessage(""); setError("");
    const result = await deleteAddressAction(addressId);
    setPending(false);
    if (!result.ok) { setError(result.error.message); return; }
    setAddresses((current) => current.filter((address) => address.id !== addressId));
    if (editingId === addressId) startCreate();
    setMessage("Address removed.");
  }

  return (
    <section className="account-addresses" aria-labelledby="addresses-title">
      <div className="account-addresses__header">
        <div><p className="account-page__eyebrow">ADDRESSES</p><h2 id="addresses-title">Your delivery details</h2><p>Save the addresses you use for your Maison orders.</p></div>
        <button type="button" className="account-addresses__new" onClick={startCreate}>Add address</button>
      </div>

      <div className="account-addresses__list" aria-live="polite">
        {addresses.length === 0 ? <p className="account-addresses__empty">No saved addresses yet.</p> : addresses.map((address) => (
          <article className="account-address" key={address.id}>
            <div className="account-address__top"><div><h3>{address.recipientFirstName} {address.recipientLastName}</h3><p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}</p><p>{address.postalCode} {address.city}{address.region ? `, ${address.region}` : ""} · {address.countryCode}</p><p>{address.phone ?? "No phone provided"}</p></div><div className="account-address__badges">{address.defaultShipping && <span>Shipping default</span>}{address.defaultBilling && <span>Billing default</span>}</div></div>
            <div className="account-address__actions"><button type="button" onClick={() => startEdit(address)} disabled={pending}>Edit</button><button type="button" onClick={() => remove(address.id)} disabled={pending}>Delete</button></div>
          </article>
        ))}
      </div>

      <form className="account-address-form" onSubmit={submit} aria-labelledby="address-form-title">
        <p className="account-page__eyebrow">{editingId ? "EDIT ADDRESS" : "NEW ADDRESS"}</p><h3 id="address-form-title">{editingId ? "Refine your address" : "Add a delivery address"}</h3>
        <div className="account-address-form__grid">
          {([['recipientFirstName','First name','given-name'],['recipientLastName','Last name','family-name'],['company','Company (optional)','organization'],['addressLine1','Address line 1','address-line1'],['addressLine2','Address line 2 (optional)','address-line2'],['city','City','address-level2'],['region','Region (optional)','address-level1'],['postalCode','Postal code','postal-code'],['countryCode','Country code','country'],['phone','Phone','tel']] as const).map(([field, label, autoComplete]) => <label key={field} className={field === 'addressLine1' || field === 'addressLine2' ? 'account-address-form__wide' : ''}>{label}<input name={field} value={draft[field]} onChange={(event) => updateDraft(field, event.target.value)} autoComplete={autoComplete} required={!['company','addressLine2','region'].includes(field)} maxLength={field === 'phone' ? 40 : 240} /></label>)}
        </div>
        <div className="account-address-form__checks"><label><input type="checkbox" checked={draft.defaultShipping} onChange={(event) => updateDraft('defaultShipping', event.target.checked)} /> Default shipping address</label><label><input type="checkbox" checked={draft.defaultBilling} onChange={(event) => updateDraft('defaultBilling', event.target.checked)} /> Default billing address</label></div>
        <p className={error ? "account-profile__message" : "account-profile__message account-profile__message--success"} aria-live="polite" role="status">{error || message}</p>
        <div className="account-address-form__actions"><button type="submit" disabled={pending}>{pending ? "Saving…" : editingId ? "Save address" : "Add address"}</button>{editingId && <button type="button" className="account-address-form__cancel" onClick={startCreate} disabled={pending}>Cancel</button>}</div>
      </form>
    </section>
  );
}
