'use client'
import { QueryClient } from '@tanstack/react-query'

let browserClient: QueryClient | null = null

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return new QueryClient({
      defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
    })
  }
  if (!browserClient) {
    browserClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime:            60 * 1000,
          retry:                1,
          refetchOnWindowFocus: false,
        },
      },
    })
  }
  return browserClient
}
