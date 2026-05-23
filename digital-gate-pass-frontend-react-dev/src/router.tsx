import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Singleton — create once, reuse everywhere
let _router: ReturnType<typeof createRouter> | null = null;
let _queryClient: QueryClient | null = null;

export const getRouter = () => {
  if (_router) return _router;

  _queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
      },
    },
  });

  _router = createRouter({
    routeTree,
    context: { queryClient: _queryClient },
    // ❌ scrollRestoration: true  ← REMOVED — yeh "Leave site?" alert trigger karta tha
    //    TanStack Router internally window.history pe kaam karta hai, aur scrollRestoration
    //    ke saath kuch browsers beforeunload fire karte hain, jisse alert aata hai.
    defaultPreloadStaleTime: 0,
  });

  return _router;
};

export const getQueryClient = () => _queryClient;