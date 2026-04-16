import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Prisma, Role, User } from "@prisma/client";
import { prisma } from "./db";

const loginUserSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  role: true,
  passwordHash: true,
} satisfies Prisma.UserSelect;

export type UserForLogin = Prisma.UserGetPayload<{ select: typeof loginUserSelect }>;

/** E-mail (s @) nebo uživatelské jméno (uložené malými písmeny). */
export async function findUserByLogin(raw: string): Promise<UserForLogin | null> {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) {
    return prisma.user.findUnique({
      where: { email: trimmed.toLowerCase() },
      select: loginUserSelect,
    });
  }
  return prisma.user.findUnique({
    where: { username: trimmed.toLowerCase() },
    select: loginUserSelect,
  });
}

const COOKIE = "it_session";
const SESSION_DAYS = 14;
/** Nová hesla (admin → zaměstnanec). Uložené hash v DB si drží vlastní náklad – tím se neovlivní stávající účty. */
const BCRYPT_ROUNDS_NEW = 10;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS_NEW);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: {
      token: tokenHash,
      userId,
      expiresAt,
    },
  });

  return token;
}

export async function deleteSessionByCookieValue(rawToken: string | undefined) {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await prisma.session.deleteMany({ where: { token: tokenHash } });
}

/**
 * Jedna databáze na request: layout i stránka volají getSessionUser() —
 * React cache() sloučí volání a zkrátí odezvu chráněných route.
 */
export const getSessionUser = cache(async (): Promise<(User & { role: Role }) | null> => {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;

  const tokenHash = hashToken(raw);
  const session = await prisma.session.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return session.user;
});

export function sessionCookieOptions() {
  return {
    name: COOKIE,
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export { COOKIE };
