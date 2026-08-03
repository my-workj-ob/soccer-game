'use client'

import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  // Don't specify baseURL - let Better Auth auto-detect
  // This prevents "Invalid origin" errors in iframe environments
  fetchOptions: {
    credentials: 'include',
  },
})

export const { signIn, signUp, signOut, useSession } = authClient
