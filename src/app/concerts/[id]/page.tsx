import {
  Badge,
  Box,
  Container,
  DataList,
  Flex,
  Heading,
  LinkBox,
  LinkOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { getConcert, getSchedules } from "@/lib/api";
import { GENRE_LABEL } from "@/lib/concert";
import { formatDateTime } from "@/lib/schedule";

// 공연마다 검색 결과에 노출될 title/description을 만든다 (SEO)
export async function generateMetadata({ params }: PageProps<"/concerts/[id]">): Promise<Metadata> {
  const { id } = await params;
  const concert = await getConcert(id);

  if (!concert) {
    return { title: "공연을 찾을 수 없습니다" };
  }

  const description = `${concert.venue} · ${concert.startDate} ~ ${concert.endDate}`;
  return {
    title: concert.title,
    description,
    openGraph: { title: concert.title, description },
  };
}

// cacheComponents 환경에서는 params가 요청 시점 데이터라 Suspense 안에서 꺼내야 한다
export default function ConcertDetailPage({ params }: PageProps<"/concerts/[id]">) {
  return (
    <Container as="main" maxW="3xl" py="12">
      <BackLink href="/concerts">공연 목록</BackLink>
      <Suspense fallback={<Text mt="6" color="fg.muted">불러오는 중...</Text>}>
        {params.then(({ id }) => (
          <ConcertDetail id={id} />
        ))}
      </Suspense>
    </Container>
  );
}

async function ConcertDetail({ id }: { id: string }) {
  const concert = await getConcert(id);
  if (!concert) {
    notFound();
  }

  return (
    <Box as="article" mt="6">
      <Badge variant="subtle">{GENRE_LABEL[concert.genre]}</Badge>
      <Heading as="h1" size="3xl" mt="1">
        {concert.title}
      </Heading>
      {/* DataList: <dl><dt><dd> 구조를 그려 주는 컴포넌트 */}
      <DataList.Root orientation="horizontal" mt="6" size="sm">
        <DataList.Item>
          <DataList.ItemLabel minW="20">장소</DataList.ItemLabel>
          <DataList.ItemValue>{concert.venue}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel minW="20">기간</DataList.ItemLabel>
          <DataList.ItemValue>
            {concert.startDate} ~ {concert.endDate}
          </DataList.ItemValue>
        </DataList.Item>
      </DataList.Root>
      {concert.description && (
        <Text mt="6" lineHeight="tall">
          {concert.description}
        </Text>
      )}
      <ScheduleList concertId={id} />
    </Box>
  );
}

// 회차 목록. 회차를 누르면 좌석 선택 화면(/schedules/[id])으로 간다
// 오픈 여부는 여기서 계산하지 않는다: 캐시된 서버 컴포넌트에서 현재 시각을 쓰면 캐시된 시각으로 고정되기 때문.
// 실시간 오픈 여부는 좌석 선택 화면이 API에서 받아 온다
async function ScheduleList({ concertId }: { concertId: string }) {
  const schedules = await getSchedules(concertId);

  return (
    <Box as="section" mt="10">
      <Heading as="h2" size="lg">
        회차
      </Heading>
      {schedules.length === 0 ? (
        <Text mt="3" textStyle="sm" color="fg.muted">
          등록된 회차가 없습니다.
        </Text>
      ) : (
        // separator: 항목 사이에 구분선을 넣는다 (Tailwind의 divide-y)
        <Stack as="ul" mt="3" gap="0" borderWidth="1px" rounded="lg" separator={<Box borderTopWidth="1px" />}>
          {schedules.map((schedule) => (
            <LinkBox as="li" key={schedule.id} px="4" py="3" _hover={{ bg: "bg.muted" }}>
              <Flex align="center" justify="space-between">
                <LinkOverlay asChild fontWeight="medium">
                  <NextLink href={`/schedules/${schedule.id}`}>{formatDateTime(schedule.startAt)}</NextLink>
                </LinkOverlay>
                <Text textStyle="sm" color="fg.muted">
                  예매 오픈 {formatDateTime(schedule.ticketOpenAt)} &rarr;
                </Text>
              </Flex>
            </LinkBox>
          ))}
        </Stack>
      )}
    </Box>
  );
}
