"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api/client"
import { newsInsightSchema, type NewsInsight } from "@/lib/api/schemas"

export function useNewsInsight(articleId: string | null) {
  return useQuery({
    queryKey: ["news-insight", articleId],
    queryFn: () =>
      apiFetch<NewsInsight>("/api/news/insight", {
        method: "POST",
        body: JSON.stringify({ article_id: articleId }),
        schema: newsInsightSchema,
      }),
    enabled: Boolean(articleId),
    staleTime: 60_000,
  })
}

export function usePrefetchNewsInsight() {
  const queryClient = useQueryClient()

  return (articleId: string) =>
    queryClient.prefetchQuery({
      queryKey: ["news-insight", articleId],
      queryFn: () =>
        apiFetch<NewsInsight>("/api/news/insight", {
          method: "POST",
          body: JSON.stringify({ article_id: articleId }),
          schema: newsInsightSchema,
        }),
      staleTime: 60_000,
    })
}
