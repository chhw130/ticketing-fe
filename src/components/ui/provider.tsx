"use client";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/http";

// Chakra 기본 테마에서 두 가지만 바꾼다
const system = createSystem(defaultConfig, {
  // 다크 모드: Chakra 기본값은 <html class="dark">를 보고 바뀌는데(토글 버튼용),
  // 이 프로젝트는 토글 없이 OS 설정만 따르므로 CSS 미디어 쿼리로 바꾼다.
  // 이렇게 하면 class를 붙여 줄 next-themes 같은 라이브러리가 필요 없다
  conditions: {
    dark: "@media (prefers-color-scheme: dark)",
  },
  theme: {
    tokens: {
      // 변수는 layout.tsx의 next/font가 <html>에 넣어 준다
      fonts: {
        body: { value: "var(--font-geist-sans), sans-serif" },
        heading: { value: "var(--font-geist-sans), sans-serif" },
        mono: { value: "var(--font-geist-mono), monospace" },
      },
    },
  },
});

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 4xx(없는 회차, 잘못된 요청)는 다시 보내도 결과가 같으니 재시도하지 않는다.
        // 5xx·네트워크 오류만 최대 2번 재시도
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
      },
    },
  });
}

// Chakra는 Context로 테마를, TanStack Query는 Context로 캐시(QueryClient)를 내려주기 때문에 클라이언트 컴포넌트여야 한다.
// 이 Provider로 감싸도 그 안의 page.tsx들은 그대로 서버 컴포넌트로 남는다 (children으로 전달되기 때문)
export function Provider({ children }: { children: ReactNode }) {
  // useState로 만들어야 리렌더 때마다 QueryClient(=캐시)가 새로 생기지 않는다.
  // 모듈 최상단에 두면 서버에서는 모든 사용자가 캐시를 공유하게 되므로 안 된다
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>{children}</ChakraProvider>
      {/* 개발 모드에서만 화면 구석에 캐시 상태를 보여 준다 (프로덕션 빌드에서는 자동으로 빠진다) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
