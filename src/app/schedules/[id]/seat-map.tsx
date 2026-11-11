"use client";

import { Alert, Box, Button, chakra, Flex, Grid, HStack, Link, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState } from "react";
import { seatsQuery } from "@/lib/queries";
import { formatDateTime, formatPrice, GRADE_COLOR, GRADE_ORDER, type Seat } from "@/lib/schedule";

// 좌석 배치도. 브라우저에서 직접 API를 부른다 (CSR).
// 예전에는 useState + useEffect로 로딩/에러/응답 상태와 늦게 온 응답 무시를 직접 관리했는데,
// TanStack Query의 useQuery가 그걸 전부 대신한다 (isPending, error, isFetching, 요청 취소, 재시도)
export function SeatMap({ scheduleId }: { scheduleId: string }) {
  const { data, error, isPending, isFetching, refetch } = useQuery(seatsQuery(scheduleId));
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);

  // isPending: 아직 한 번도 데이터를 못 받은 상태 (새로고침 중에는 false라 기존 배치도가 그대로 보인다)
  if (isPending) {
    return (
      <Text mt="6" color="fg.muted">
        좌석을 불러오는 중...
      </Text>
    );
  }
  if (error) {
    // http.ts의 응답 인터셉터가 모든 에러를 ApiError로 바꿔 두어서 message를 바로 보여 줄 수 있다
    return (
      <Text mt="6" color="fg.error">
        {error.message}
      </Text>
    );
  }

  // 고른 좌석이 새로고침 사이에 팔렸으면 선택이 없는 것으로 본다.
  // (예전엔 응답마다 선택 상태를 고쳐 썼지만, 매 렌더마다 계산하면 상태를 맞출 필요가 없다)
  const selectedSeat =
    data.seats.find((s) => s.seatId === selectedSeatId && s.status === "AVAILABLE") ?? null;
  const availableCount = data.seats.filter((s) => s.status === "AVAILABLE").length;

  return (
    <Box mt="6">
      <Flex wrap="wrap" align="center" justify="space-between" gap="2" textStyle="sm">
        <Box>
          <Text fontWeight="medium">{formatDateTime(data.startAt)} 공연</Text>
          <Text color="fg.muted">
            잔여 {availableCount} / {data.seats.length}석
          </Text>
        </Box>
        <Button variant="outline" size="sm" onClick={() => refetch()} loading={isFetching}>
          새로고침
        </Button>
      </Flex>

      {!data.open && (
        <Alert.Root status="info" mt="4">
          <Alert.Indicator />
          <Alert.Title>
            아직 예매 오픈 전입니다. 오픈 시각: <b>{formatDateTime(data.ticketOpenAt)}</b>
          </Alert.Title>
        </Alert.Root>
      )}

      <Box mt="6" borderWidth="1px" rounded="lg" p="4">
        <Box mb="6" rounded="sm" bg="gray.800" py="2" textAlign="center" textStyle="xs" letterSpacing="widest" color="white">
          STAGE
        </Box>
        {/* 등급별로 한 줄씩 (1~10 VIP, 11~20 S, 21~30 A, 31~40 B) */}
        <Stack gap="3">
          {GRADE_ORDER.map((grade) => {
            const row = data.seats.filter((s) => s.grade === grade);
            if (row.length === 0) return null;
            return (
              <Flex key={grade} align="center" gap="3">
                <Text w="8" flexShrink="0" textStyle="xs" fontWeight="semibold" color="fg.muted">
                  {grade}
                </Text>
                <Grid flex="1" templateColumns="repeat(10, 1fr)" gap="1.5">
                  {row.map((seat) => (
                    <SeatButton
                      key={seat.seatId}
                      seat={seat}
                      disabled={!data.open || seat.status === "SOLD"}
                      selected={seat.seatId === selectedSeat?.seatId}
                      onSelect={() =>
                        setSelectedSeatId((prev) => (prev === seat.seatId ? null : seat.seatId))
                      }
                    />
                  ))}
                </Grid>
              </Flex>
            );
          })}
        </Stack>
        <Legend />
      </Box>

      <Flex mt="6" align="center" justify="space-between" borderWidth="1px" rounded="lg" px="4" py="3">
        {selectedSeat ? (
          <Text textStyle="sm">
            <b>
              {selectedSeat.grade}석 {selectedSeat.seatNumber}번
            </b>{" "}
            · {formatPrice(selectedSeat.price)}
          </Text>
        ) : (
          <Text textStyle="sm" color="fg.muted">
            좌석을 선택하세요.
          </Text>
        )}
        {/* 예매 API는 2단계에서 만든다. 지금은 선택까지만 */}
        <Button size="sm" disabled title="2단계에서 예매 API를 연결합니다">
          예매하기
        </Button>
      </Flex>

      <Link asChild mt="4" textStyle="sm" color="fg.muted">
        <NextLink href={`/concerts/${data.concertId}`}>&larr; 공연 상세로</NextLink>
      </Link>
    </Box>
  );
}

function SeatButton({
  seat,
  disabled,
  selected,
  onSelect,
}: {
  seat: Seat;
  disabled: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const sold = seat.status === "SOLD";

  // chakra.button: 스타일 prop을 받을 수 있는 <button>. (Box는 div라서 type, disabled 같은 button 속성 타입이 없다)
  return (
    <chakra.button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${seat.grade}석 ${seat.seatNumber}번 ${sold ? "판매 완료" : formatPrice(seat.price)}`}
      // colorPalette를 정하면 아래 "colorPalette.solid" 등이 등급 색으로 바뀐다
      colorPalette={GRADE_COLOR[seat.grade]}
      aspectRatio="square"
      rounded="sm"
      fontSize="10px"
      fontWeight="medium"
      transition="backgrounds"
      bg="colorPalette.solid"
      color="colorPalette.contrast"
      _hover={{ bg: "colorPalette.emphasized" }}
      // 판매 완료·오픈 전 좌석은 회색으로 덮는다 (disabled 상태일 때만 적용)
      _disabled={{
        cursor: "not-allowed",
        bg: sold ? "gray.subtle" : "bg.muted",
        color: "fg.subtle",
        textDecoration: sold ? "line-through" : undefined,
      }}
      // aria-pressed="true"일 때 바깥쪽 테두리로 선택 표시 (Tailwind의 ring + ring-offset)
      _pressed={{ outline: "2px solid", outlineColor: "fg", outlineOffset: "2px" }}
    >
      {seat.seatNumber}
    </chakra.button>
  );
}

function Legend() {
  return (
    <HStack as="ul" mt="6" wrap="wrap" gap="4" textStyle="xs" color="fg.muted">
      {GRADE_ORDER.map((grade) => (
        <HStack as="li" key={grade} gap="1.5">
          <Box w="3" h="3" rounded="xs" colorPalette={GRADE_COLOR[grade]} bg="colorPalette.solid" />
          {grade}
        </HStack>
      ))}
      <HStack as="li" gap="1.5">
        <Box w="3" h="3" rounded="xs" bg="gray.subtle" />
        판매 완료
      </HStack>
    </HStack>
  );
}
