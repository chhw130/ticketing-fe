import { cacheLife } from "next/cache";
import type { Concert } from "./concert";
import type { Schedule } from "./schedule";

// 서버 컴포넌트에서 Spring을 직접 호출한다 (서버 간 통신이라 CORS가 필요 없다)
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

// 백엔드 ApiResult(record)와 같은 모양. 성공 응답은 모두 이 형태로 감싸서 온다
type ApiResult<T> = {
  message: string;
  data: T;
};

export async function getConcerts(): Promise<Concert[]> {
  "use cache";
  cacheLife("minutes"); // 1분마다 백그라운드에서 다시 가져온다 (ISR)

  const res = await fetch(`${API_BASE_URL}/api/concerts`);
  if (!res.ok) {
    throw new Error(`공연 목록 조회 실패: ${res.status}`);
  }
  const body: ApiResult<Concert[]> = await res.json();
  return body.data;
}

export async function getConcert(id: string): Promise<Concert | null> {
  "use cache";
  cacheLife("minutes");

  const res = await fetch(`${API_BASE_URL}/api/concerts/${id}`);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`공연 조회 실패: ${res.status}`);
  }
  const body: ApiResult<Concert> = await res.json();
  return body.data;
}

// 공연의 회차 목록 (공연 상세 페이지에서 서버 컴포넌트가 부른다)
// 회차는 자주 바뀌지 않으니 공연과 같이 1분 캐시한다. 좌석 현황은 실시간이어야 해서 여기서 부르지 않는다
export async function getSchedules(concertId: string): Promise<Schedule[]> {
  "use cache";
  cacheLife("minutes");

  const res = await fetch(`${API_BASE_URL}/api/concerts/${concertId}/schedules`);
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) {
    throw new Error(`회차 목록 조회 실패: ${res.status}`);
  }
  const body: ApiResult<Schedule[]> = await res.json();
  return body.data;
}
