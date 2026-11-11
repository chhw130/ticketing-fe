import { cacheLife } from "next/cache";
import type { Concert } from "./concert";
import { ApiError, get } from "./http";
import type { Schedule } from "./schedule";

// 서버 컴포넌트 전용 조회 함수 (SEO가 필요한 공연 목록/상세).
// 캐시는 axios가 아니라 "use cache"가 함수의 반환값 단위로 건다. 그래서 안에서 무엇으로 요청하든 상관없다.
// 브라우저에서 부르는 실시간 데이터(좌석 현황)는 여기 두지 않고 lib/queries.ts(TanStack Query)에 둔다

export async function getConcerts(): Promise<Concert[]> {
  "use cache";
  cacheLife("minutes"); // 1분마다 백그라운드에서 다시 가져온다 (ISR)

  return get<Concert[]>("/api/concerts");
}

export async function getConcert(id: string): Promise<Concert | null> {
  "use cache";
  cacheLife("minutes");

  return notFoundAs(get<Concert>(`/api/concerts/${id}`), null);
}

// 공연의 회차 목록 (공연 상세 페이지에서 서버 컴포넌트가 부른다)
// 회차는 자주 바뀌지 않으니 공연과 같이 1분 캐시한다. 좌석 현황은 실시간이어야 해서 여기서 부르지 않는다
export async function getSchedules(concertId: string): Promise<Schedule[]> {
  "use cache";
  cacheLife("minutes");

  return notFoundAs(get<Schedule[]>(`/api/concerts/${concertId}/schedules`), []);
}

// axios는 404도 에러로 던진다. 404일 때만 기본값으로 바꾸고, 나머지 에러는 그대로 던진다
async function notFoundAs<T, F>(request: Promise<T>, fallback: F): Promise<T | F> {
  try {
    return await request;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return fallback;
    throw e;
  }
}
