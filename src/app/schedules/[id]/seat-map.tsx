"use client";

import { Alert, Box, Button, chakra, Flex, Grid, HStack, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  formatDateTime,
  formatPrice,
  GRADE_COLOR,
  GRADE_ORDER,
  type ScheduleSeats,
  type Seat,
} from "@/lib/schedule";

type ApiResult<T> = { message: string; data: T };
type ErrorResponse = { code: string; message: string };

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; data: ScheduleSeats };

// 좌석 배치도. 브라우저에서 직접 API를 부른다 (CSR).
// /api/** 는 next.config의 rewrites가 Spring으로 넘겨줘서 CORS 설정 없이 호출된다
export function SeatMap({ scheduleId }: { scheduleId: string }) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);

  // 응답을 받아서 다음 상태를 "돌려주기만" 한다 (setState는 부르는 쪽에서)
  const fetchSeats = useCallback(async (): Promise<LoadState> => {
    try {
      // cache: "no-store" → 좌석 상태는 항상 최신 값을 받아야 한다
      const res = await fetch(`/api/schedules/${scheduleId}/seats`, { cache: "no-store" });
      if (!res.ok) {
        // 백엔드 공통 에러 응답 { code, message }
        const error: ErrorResponse = await res.json();
        return { kind: "error", message: error.message };
      }
      const body: ApiResult<ScheduleSeats> = await res.json();
      return { kind: "loaded", data: body.data };
    } catch {
      return { kind: "error", message: "서버에 연결할 수 없습니다." };
    }
  }, [scheduleId]);

  const apply = useCallback((next: LoadState) => {
    setState(next);
    if (next.kind === "loaded") {
      // 새로 불러왔는데 고른 좌석이 그사이 팔렸으면 선택을 푼다
      setSelectedSeatId((prev) =>
        next.data.seats.some((s) => s.seatId === prev && s.status === "AVAILABLE") ? prev : null,
      );
    }
  }, []);

  // 처음 화면에 나타날 때 한 번 불러온다. 첫 상태가 이미 loading이라 effect 안에서 setState를 바로 부르지 않는다
  // ignore: 응답이 오기 전에 화면을 떠나면(또는 scheduleId가 바뀌면) 늦게 온 응답을 버린다
  useEffect(() => {
    let ignore = false;
    fetchSeats().then((next) => {
      if (!ignore) apply(next);
    });
    return () => {
      ignore = true;
    };
  }, [fetchSeats, apply]);

  // 새로고침 버튼: 이벤트 핸들러라 바로 loading으로 바꿔도 된다
  const load = async () => {
    setState({ kind: "loading" });
    apply(await fetchSeats());
  };

  if (state.kind === "loading") {
    return (
      <Text mt="6" color="fg.muted">
        좌석을 불러오는 중...
      </Text>
    );
  }
  if (state.kind === "error") {
    return (
      <Text mt="6" color="fg.error">
        {state.message}
      </Text>
    );
  }

  const { data } = state;
  const selectedSeat = data.seats.find((s) => s.seatId === selectedSeatId) ?? null;
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
        <Button variant="outline" size="sm" onClick={load}>
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
                      selected={seat.seatId === selectedSeatId}
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
