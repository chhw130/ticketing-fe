import { Badge, Container, Heading, LinkBox, LinkOverlay, Stack, Text } from "@chakra-ui/react";
import type { Metadata } from "next";
import NextLink from "next/link";
import { getConcerts } from "@/lib/api";
import { GENRE_LABEL } from "@/lib/concert";

export const metadata: Metadata = {
  title: "공연 목록",
  description: "예매 가능한 공연을 확인하고 티켓팅을 연습해 보세요.",
};

export default async function ConcertsPage() {
  const concerts = await getConcerts();

  return (
    <Container as="main" maxW="3xl" py="12">
      <Heading as="h1" size="2xl" mb="8">
        공연 목록
      </Heading>

      {concerts.length === 0 ? (
        <Text color="fg.muted">등록된 공연이 없습니다.</Text>
      ) : (
        <Stack as="ul" gap="3">
          {concerts.map((concert) => (
            // LinkBox + LinkOverlay: 카드 전체를 클릭 가능하게 하면서 <a>는 제목 하나만 둔다
            <LinkBox
              as="li"
              key={concert.id}
              borderWidth="1px"
              rounded="lg"
              p="4"
              transition="background"
              _hover={{ bg: "bg.muted" }}
            >
              <Badge variant="subtle">{GENRE_LABEL[concert.genre]}</Badge>
              <Heading as="h2" size="md" mt="1">
                {/* asChild: Chakra 스타일은 유지하고 실제 태그는 Next.js Link(클라이언트 라우팅)로 그린다 */}
                <LinkOverlay asChild>
                  <NextLink href={`/concerts/${concert.id}`}>{concert.title}</NextLink>
                </LinkOverlay>
              </Heading>
              <Text textStyle="sm" color="fg.muted">
                {concert.venue} · {concert.startDate} ~ {concert.endDate}
              </Text>
            </LinkBox>
          ))}
        </Stack>
      )}
    </Container>
  );
}
