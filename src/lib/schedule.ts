// 백엔드 ScheduleResponse(record)와 필드가 같아야 한다
export type Schedule = {
  id: number;
  concertId: number;
  startAt: string; // "2026-12-20T19:00:00"
  ticketOpenAt: string;
};

export type SeatGrade = "VIP" | "S" | "A" | "B";

// 백엔드 SeatDisplayStatus. DB에 저장된 값이 아니라 서버가 예매 기록으로 계산해 준 값이다
export type SeatStatus = "AVAILABLE" | "SOLD";

// 백엔드 SeatStatusResponse
export type Seat = {
  seatId: number;
  seatNumber: number;
  grade: SeatGrade;
  price: number;
  status: SeatStatus;
};

// 백엔드 ScheduleSeatsResponse (GET /api/schedules/{id}/seats)
export type ScheduleSeats = {
  scheduleId: number;
  concertId: number;
  startAt: string;
  ticketOpenAt: string;
  open: boolean;
  seats: Seat[];
};

export const GRADE_ORDER: SeatGrade[] = ["VIP", "S", "A", "B"];

// 등급별 좌석 색 (선택 가능한 좌석에만 쓴다).
// Chakra의 colorPalette 이름이다. 컴포넌트에 colorPalette="purple"을 주면
// "colorPalette.solid" 같은 토큰이 purple 계열로 바뀌고, 다크 모드 색도 알아서 맞춰진다
export const GRADE_COLOR: Record<SeatGrade, string> = {
  VIP: "purple",
  S: "blue",
  A: "green",
  B: "orange",
};

// "2026-12-20T19:00:00" → "2026.12.20 19:00"
// 서버가 보내는 문자열을 그대로 잘라 쓴다 (new Date()로 바꾸면 서버/브라우저 시간대에 따라 값이 달라질 수 있다)
export function formatDateTime(value: string): string {
  const [date, time] = value.split("T");
  return `${date.replaceAll("-", ".")} ${time.slice(0, 5)}`;
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}
