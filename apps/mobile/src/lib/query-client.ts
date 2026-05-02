import { QueryClient } from '@tanstack/react-query'

let client: QueryClient | null = null

export function getQueryClient(): QueryClient {
  if (!client) {
    client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime:          1000 * 60 * 2,
          retry:              2,
          retryDelay:         (n) => Math.min(1000 * 2 ** n, 8000),
          refetchOnWindowFocus: false,
        },
      },
    })
  }
  return client
}
