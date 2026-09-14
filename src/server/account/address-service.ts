import "server-only";

import { z } from "zod";
import { addressCreateSchema, addressUpdateSchema, type Address, type AddressCreateInput, type AddressUpdateInput } from "@/domain/user/user.schema";
import { ownershipError, validationError } from "@/lib/errors/aura-error";
import { requireCurrentSessionAuthority } from "@/server/auth/current-session";
import type { SessionAuthority } from "@/server/auth/session-authority";
import { MongoAddressRepository } from "@/server/repositories/mongo-user-repository";
import type { AddressRepository } from "@/server/repositories/user-repository";

const addressIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid address id.");
const addressCreateInputSchema = addressCreateSchema.omit({ userId: true }).strict();
const addressUpdateInputSchema = addressCreateSchema.omit({ userId: true }).partial().strict().refine((value) => Object.keys(value).length > 0, "At least one address field is required.");

type AddressRepositories = { addresses: AddressRepository };
const mongoRepositories = (): AddressRepositories => ({ addresses: new MongoAddressRepository() });

function requireActiveAuthority(authority: SessionAuthority | null) {
  if (!authority || authority.user.status !== "ACTIVE" || authority.user.emailVerifiedAt === null) throw ownershipError();
  return authority;
}

function parseAddressId(addressId: unknown) {
  const parsed = addressIdSchema.safeParse(addressId);
  if (!parsed.success) throw validationError("Invalid address id.");
  return parsed.data;
}

function parseCreateInput(input: unknown): Omit<AddressCreateInput, "userId"> {
  return addressCreateInputSchema.parse(input);
}

function parseUpdateInput(input: unknown): AddressUpdateInput {
  return addressUpdateInputSchema.parse(input);
}

export async function listCurrentAddressesForAuthority(
  authority: SessionAuthority | null,
  options: { repositories?: AddressRepositories } = {},
): Promise<Address[]> {
  const current = requireActiveAuthority(authority);
  return (options.repositories ?? mongoRepositories()).addresses.listForUser(current.user.id);
}

export async function createAddressForAuthority(
  authority: SessionAuthority | null,
  input: unknown,
  options: { repositories?: AddressRepositories } = {},
): Promise<Address> {
  const current = requireActiveAuthority(authority);
  const parsed = parseCreateInput(input);
  return (options.repositories ?? mongoRepositories()).addresses.createForUser(current.user.id, parsed);
}

export async function updateAddressForAuthority(
  authority: SessionAuthority | null,
  addressId: unknown,
  input: unknown,
  options: { repositories?: AddressRepositories } = {},
): Promise<Address> {
  const current = requireActiveAuthority(authority);
  const id = parseAddressId(addressId);
  const parsed = parseUpdateInput(input);
  const repositories = options.repositories ?? mongoRepositories();
  const owned = await repositories.addresses.findForUser(current.user.id, id);
  if (!owned) throw ownershipError();
  return repositories.addresses.updateForUser(current.user.id, id, parsed);
}

export async function deleteAddressForAuthority(
  authority: SessionAuthority | null,
  addressId: unknown,
  options: { repositories?: AddressRepositories } = {},
): Promise<void> {
  const current = requireActiveAuthority(authority);
  const id = parseAddressId(addressId);
  const repositories = options.repositories ?? mongoRepositories();
  const owned = await repositories.addresses.findForUser(current.user.id, id);
  if (!owned) throw ownershipError();
  await repositories.addresses.deleteForUser(current.user.id, id);
}

export async function listCurrentAddresses(): Promise<Address[]> {
  return listCurrentAddressesForAuthority(await requireCurrentSessionAuthority());
}

export async function createCurrentAddress(input: unknown): Promise<Address> {
  return createAddressForAuthority(await requireCurrentSessionAuthority(), input);
}

export async function updateCurrentAddress(addressId: unknown, input: unknown): Promise<Address> {
  return updateAddressForAuthority(await requireCurrentSessionAuthority(), addressId, input);
}

export async function deleteCurrentAddress(addressId: unknown): Promise<void> {
  return deleteAddressForAuthority(await requireCurrentSessionAuthority(), addressId);
}
