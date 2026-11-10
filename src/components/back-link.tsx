import { Link } from "@chakra-ui/react";
import NextLink from "next/link";
import type { ReactNode } from "react";

// "← 공연 목록" 같은 뒤로 가기 링크. 여러 페이지에서 같은 모양으로 쓴다
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link asChild textStyle="sm" color="fg.muted">
      <NextLink href={href}>&larr; {children}</NextLink>
    </Link>
  );
}
