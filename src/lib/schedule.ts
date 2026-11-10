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

// 등급별 좌석 색 (선택 가능한 좌석에만 쓴다)
export const GRADE_STYLE: Record<SeatGrade, string> = {
  VIP: "bg-purple-500 hover:bg-purple-600",
  S: "bg-blue-500 hover:bg-blue-600",
  A: "bg-emerald-500 hover:bg-emerald-600",
  B: "bg-amber-500 hover:bg-amber-600",
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
