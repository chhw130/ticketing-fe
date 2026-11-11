import { queryOptions } from "@tanstack/react-query";
import { get } from "./http";
import type { ScheduleSeats } from "./schedule";

// TanStack Query 조회 정의 모음 (클라이언트 컴포넌트용).
// queryOptions로 key와 함수를 한 곳에 묶어 두면, useQuery·invalidateQueries 등 어디서든 같은 key를 쓰게 된다.
// key는 배열이라 앞부분만 맞춰도 묶어서 무효화할 수 있다: ["schedules", id] → 그 회차의 모든 데이터

export const scheduleKeys = {
  all: ["schedules"] as const,
  detail: (scheduleId: string) => [...scheduleKeys.all, scheduleId] as const,
  seats: (scheduleId: string) => [...scheduleKeys.detail(scheduleId), "seats"] as const,
};

// 좌석 현황. 몇 초 만에 바뀌는 실시간 데이터라
// - staleTime 0: 받자마자 "오래된 데이터"로 취급 → 창에 다시 포커스하면 자동으로 새로 받는다
// - cache: "no-store": 브라우저 HTTP 캐시도 거치지 않는다
export function seatsQuery(scheduleId: string) {
  return queryOptions({
    queryKey: scheduleKeys.seats(scheduleId),
    queryFn: ({ signal }) =>
      // signal: 화면을 떠나거나 key가 바뀌면 진행 중인 요청을 취소한다 (예전 코드의 ignore 플래그 역할)
      get<ScheduleSeats>(`/api/schedules/${scheduleId}/seats`, {
        signal,
        fetchOptions: { cache: "no-store" },
      }),
    staleTime: 0,
  });
}
