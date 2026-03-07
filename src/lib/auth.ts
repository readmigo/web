import NextAuth from 'next-auth';
import Apple from 'next-auth/providers/apple';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Extend the built-in types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }

  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
    backendUserId?: string;
  }
}

interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email?: string;
    nickname?: string;
    avatarUrl?: string;
  };
}

// Access token lifetime margin (refresh 5 minutes before expiry)
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
// Default access token lifetime assumption: 1 hour
const DEFAULT_TOKEN_LIFETIME_MS = 60 * 60 * 1000;

async function refreshBackendToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.error(`Token refresh failed: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

async function authenticateWithBackend(
  provider: 'apple' | 'google' | 'line' | 'kakao',
  token: string
): Promise<BackendAuthResponse | null> {
  try {
    const endpointMap: Record<string, string> = {
      apple: '/auth/apple',
      google: '/auth/google',
      line: '/auth/line',
      kakao: '/auth/kakao',
    };
    const endpoint = endpointMap[provider];
    const body = provider === 'apple'
      ? { identityToken: token }
      : provider === 'google'
        ? { idToken: token }
        : { accessToken: token };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`Backend auth failed: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Backend authentication error:', error);
    return null;
  }
}

// Build providers array dynamically based on available credentials
const providers = [];

// Add Apple provider only if credentials are configured
if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    })
  );
}

// Add Google provider only if credentials are configured
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

// Add LINE provider only if credentials are configured
if (process.env.AUTH_LINE_CHANNEL_ID && process.env.AUTH_LINE_CHANNEL_SECRET) {
  providers.push({
    id: 'line',
    name: 'LINE',
    type: 'oauth' as const,
    authorization: {
      url: 'https://access.line.me/oauth2/v2.1/authorize',
      params: { scope: 'profile openid email', bot_prompt: 'normal' },
    },
    token: 'https://api.line.me/oauth2/v2.1/token',
    userinfo: 'https://api.line.me/v2/profile',
    clientId: process.env.AUTH_LINE_CHANNEL_ID,
    clientSecret: process.env.AUTH_LINE_CHANNEL_SECRET,
    profile(profile: Record<string, string>) {
      return {
        id: profile.userId,
        name: profile.displayName,
        image: profile.pictureUrl,
      };
    },
  });
}

// Add Kakao provider only if credentials are configured
if (process.env.AUTH_KAKAO_CLIENT_ID && process.env.AUTH_KAKAO_CLIENT_SECRET) {
  providers.push({
    id: 'kakao',
    name: 'Kakao',
    type: 'oauth' as const,
    authorization: {
      url: 'https://kauth.kakao.com/oauth/authorize',
      params: { scope: 'profile_nickname profile_image account_email' },
    },
    token: 'https://kauth.kakao.com/oauth/token',
    userinfo: 'https://kapi.kakao.com/v2/user/me',
    clientId: process.env.AUTH_KAKAO_CLIENT_ID,
    clientSecret: process.env.AUTH_KAKAO_CLIENT_SECRET,
    profile(profile: { id: number; kakao_account?: { profile?: { nickname?: string; profile_image_url?: string }; email?: string } }) {
      return {
        id: String(profile.id),
        name: profile.kakao_account?.profile?.nickname,
        email: profile.kakao_account?.email,
        image: profile.kakao_account?.profile?.profile_image_url,
      };
    },
  });
}

providers.push(
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const data: BackendAuthResponse = await response.json();

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.nickname,
          image: data.user.avatarUrl,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      } catch {
        return null;
      }
    },
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Handle session.update() calls (e.g., after avatar upload)
      if (trigger === 'update' && session?.image !== undefined) {
        token.picture = session.image;
        return token;
      }

      // Initial sign in
      if (account && user) {
        // For OAuth providers, authenticate with backend
        if (
          account.provider === 'apple' ||
          account.provider === 'google' ||
          account.provider === 'line' ||
          account.provider === 'kakao'
        ) {
          const oauthToken =
            account.provider === 'line' || account.provider === 'kakao'
              ? account.access_token
              : account.id_token;
          if (oauthToken) {
            const backendAuth = await authenticateWithBackend(
              account.provider as 'apple' | 'google' | 'line' | 'kakao',
              oauthToken
            );

            if (backendAuth) {
              token.accessToken = backendAuth.accessToken;
              token.refreshToken = backendAuth.refreshToken;
              token.accessTokenExpiresAt = Date.now() + DEFAULT_TOKEN_LIFETIME_MS;
              token.backendUserId = backendAuth.user.id;
              token.name = backendAuth.user.nickname || token.name;
              token.picture = backendAuth.user.avatarUrl || token.picture;
            }
          }
        }

        if (account.provider === 'credentials') {
          token.backendUserId = user.id;
          const u = user as Record<string, unknown>;
          token.accessToken = u.accessToken as string | undefined;
          token.refreshToken = u.refreshToken as string | undefined;
          token.accessTokenExpiresAt = Date.now() + DEFAULT_TOKEN_LIFETIME_MS;
        }

        return token;
      }

      // On subsequent requests, check if the access token needs refreshing
      const expiresAt = token.accessTokenExpiresAt as number | undefined;
      if (
        token.refreshToken &&
        expiresAt &&
        Date.now() + TOKEN_REFRESH_MARGIN_MS >= expiresAt
      ) {
        const refreshed = await refreshBackendToken(token.refreshToken as string);
        if (refreshed) {
          token.accessToken = refreshed.accessToken;
          token.refreshToken = refreshed.refreshToken;
          token.accessTokenExpiresAt = Date.now() + DEFAULT_TOKEN_LIFETIME_MS;
        } else {
          // Refresh failed — clear tokens so user gets logged out
          token.accessToken = undefined;
          token.refreshToken = undefined;
          token.accessTokenExpiresAt = undefined;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.backendUserId as string) || (token.sub as string);
      }
      // Tokens are kept server-side only (in the JWT cookie managed by NextAuth).
      // They are NOT exposed to the client session for security.
      // The API proxy route (/api/proxy) reads the JWT to attach tokens.
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
});
