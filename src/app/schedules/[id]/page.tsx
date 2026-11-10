import { Container, Heading, Text } from "@chakra-ui/react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { SeatMap } from "./seat-map";

// 티켓팅 화면은 SEO가 필요 없다 (CLAUDE.md: 티켓팅 화면은 CSR)
export const metadata: Metadata = {
  title: "좌석 선택",
  robots: { index: false },
};

// 페이지 자체는 껍데기만 서버에서 그리고, 좌석은 클라이언트 컴포넌트가 브라우저에서 불러온다.
// 좌석 상태는 몇 초 만에 바뀌는 실시간 데이터라 서버 캐시("use cache")를 쓰면 안 되기 때문이다
export default function SchedulePage({ params }: PageProps<"/schedules/[id]">) {
  return (
    <Container as="main" maxW="3xl" py="12">
      <BackLink href="/concerts">공연 목록</BackLink>
      <Heading as="h1" size="2xl" mt="4">
        좌석 선택
      </Heading>
      {/* cacheComponents 환경에서는 params를 Suspense 안에서 꺼낸다 */}
      <Suspense fallback={<Text mt="6" color="fg.muted">불러오는 중...</Text>}>
        {params.then(({ id }) => (
          <SeatMap scheduleId={id} />
        ))}
      </Suspense>
    </Container>
  );
}
