"use client";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import type { ReactNode } from "react";

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

// Chakra는 Context로 테마를 내려주기 때문에 클라이언트 컴포넌트여야 한다.
// 이 Provider로 감싸도 그 안의 page.tsx들은 그대로 서버 컴포넌트로 남는다 (children으로 전달되기 때문)
export function Provider({ children }: { children: ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
