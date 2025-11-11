// src/lib/server/db/db.service.ts
import { db } from './index';
import { users, sessions, oauthTokens, type NewUser, type NewSession, type User, type NewOAuthToken, type OAuthToken } from './schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function findUserByEmail(email: string): Promise<User | undefined> {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function createUser(newUser: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(newUser).returning();
  return user;
}

export async function updateUser(userId: string, userData: Partial<NewUser>): Promise<User | undefined> {
  const [user] = await db.update(users).set(userData).where(eq(users.id, userId)).returning();
  return user;
}

export async function createSession(userId: string, expiresAt: Date): Promise<string> {
  const sessionId = nanoid();
  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });
  return sessionId;
}

export async function getSession(sessionId: string): Promise<{ user: User } | undefined> {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      user: true,
    },
  });

  if (session && session.expiresAt > new Date()) {
    return { user: session.user };
  }
  return undefined;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function saveOrUpdateOAuthToken(tokenData: NewOAuthToken): Promise<void> {
  await db.insert(oauthTokens)
    .values(tokenData)
    .onConflictDoUpdate({
      target: [oauthTokens.userId, oauthTokens.provider],
      set: {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
        scope: tokenData.scope,
      }
    });
}

export async function getOAuthTokenByUserId(userId: string, provider: string = 'google'): Promise<OAuthToken | undefined> {
  return db.query.oauthTokens.findFirst({
    where: (tokens, { and, eq }) => and(eq(tokens.userId, userId), eq(tokens.provider, provider)),
  });
}