import type { User } from "./types";

type NamedPerson = Partial<Pick<User, "fullName" | "email">> | null | undefined;

export function displayName(person: NamedPerson, fallback = "Unknown user") {
  const name = person?.fullName?.trim();
  if (name) return name;

  const email = person?.email?.trim();
  if (email) return email;

  return fallback;
}

export function firstName(person: NamedPerson, fallback = "there") {
  return displayName(person, fallback).split(/\s+/)[0] || fallback;
}

/**
 * Deterministically compress a token to a 3-digit code for UI display.
 * Backend still receives/stores the full token; this is presentation only.
 */
export function compressToken(token: string | null | undefined): string {
  if (!token) return "---";
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
  }
  return String(hash % 1000).padStart(3, "0");
}