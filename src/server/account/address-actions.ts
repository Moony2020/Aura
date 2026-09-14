"use server";

import { revalidatePath } from "next/cache";
import { serializePublicError, type PublicError } from "@/lib/errors/serialize";
import type { Address } from "@/domain/user/user.schema";
import { createCurrentAddress, deleteCurrentAddress, listCurrentAddresses, updateCurrentAddress } from "./address-service";

export type AddressListActionState = { ok: true; addresses: Address[] } | { ok: false; error: PublicError };
export type AddressActionState = { ok: true; address: Address } | { ok: false; error: PublicError };
export type AddressDeleteActionState = { ok: true } | { ok: false; error: PublicError };

export async function listAddressesAction(): Promise<AddressListActionState> {
  try { return { ok: true, addresses: await listCurrentAddresses() }; }
  catch (error) { return { ok: false, error: serializePublicError(error) }; }
}

export async function createAddressAction(input: unknown): Promise<AddressActionState> {
  try { const address = await createCurrentAddress(input); revalidatePath("/account"); return { ok: true, address }; }
  catch (error) { return { ok: false, error: serializePublicError(error) }; }
}

export async function updateAddressAction(addressId: unknown, input: unknown): Promise<AddressActionState> {
  try { const address = await updateCurrentAddress(addressId, input); revalidatePath("/account"); return { ok: true, address }; }
  catch (error) { return { ok: false, error: serializePublicError(error) }; }
}

export async function deleteAddressAction(addressId: unknown): Promise<AddressDeleteActionState> {
  try { await deleteCurrentAddress(addressId); revalidatePath("/account"); return { ok: true }; }
  catch (error) { return { ok: false, error: serializePublicError(error) }; }
}
