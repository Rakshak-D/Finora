"use client"

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

import AppErrorBoundary from "@/components/shared/AppErrorBoundary"
import { ToastProvider, useToast } from "@/components/shared/ToastProvider"
import { APIError } from "@/lib/api/client"

function QueryProvider({ children }: { children: React.ReactNode }) {
  const { pushToast } = useToast()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (error instanceof APIError) {
              pushToast({ tone: "error", title: error.message, description: error.code ? `Code: ${error.code}` : undefined })
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            if (error instanceof APIError) {
              pushToast({ tone: "error", title: error.message, description: error.code ? `Code: ${error.code}` : undefined })
            }
          },
        }),
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              if (error instanceof APIError && error.status >= 400 && error.status < 500 && error.status !== 408) {
                return false
              }
              return failureCount < 2
            },
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppErrorBoundary>
      <ToastProvider>
        <QueryProvider>{children}</QueryProvider>
      </ToastProvider>
    </AppErrorBoundary>
  )
}
