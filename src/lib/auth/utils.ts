import { AtUri } from "@atproto/api";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 21);

export function generateSessionId(): string {
  return `sess_${nanoid()}`;
}

export function generateDeviceId(): string {
  return `dev_${nanoid()}`;
}

export function parseAtUri(uri: string) {
  try {
    return new AtUri(uri);
  } catch {
    return null;
  }
}

export function isValidDid(did: string): boolean {
  return did.startsWith("did:") && did.length > 10;
}

export function isValidHandle(handle: string): boolean {
  return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(handle);
}
