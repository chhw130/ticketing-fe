"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  formatDateTime,
  formatPrice,
  GRADE_ORDER,
  GRADE_STYLE,
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
    return <p className="mt-6 text-zinc-500">좌석을 불러오는 중...</p>;
  }
  if (state.kind === "error") {
    return <p className="mt-6 text-red-600">{state.message}</p>;
  }

  const { data } = state;
  const selectedSeat = data.seats.find((s) => s.seatId === selectedSeatId) ?? null;
  const availableCount = data.seats.filter((s) => s.status === "AVAILABLE").length;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div>
          <p className="font-medium">{formatDateTime(data.startAt)} 공연</p>
          <p className="text-zinc-500">
            잔여 {availableCount} / {data.seats.length}석
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50"
        >
          새로고침
        </button>
      </div>

      {!data.open && (
        <p className="mt-4 rounded-md bg-zinc-100 px-4 py-3 text-sm">
          아직 예매 오픈 전입니다. 오픈 시각: <b>{formatDateTime(data.ticketOpenAt)}</b>
        </p>
      )}

      <div className="mt-6 rounded-lg border border-zinc-200 p-4">
        <div className="mb-6 rounded bg-zinc-800 py-2 text-center text-xs tracking-widest text-white">
          STAGE
        </div>
        {/* 등급별로 한 줄씩 (1~10 VIP, 11~20 S, 21~30 A, 31~40 B) */}
        <div className="space-y-3">
          {GRADE_ORDER.map((grade) => {
            const row = data.seats.filter((s) => s.grade === grade);
            if (row.length === 0) return null;
            return (
              <div key={grade} className="flex items-center gap-3">
                <span className="w-8 shrink-0 text-xs font-semibold text-zinc-500">{grade}</span>
                <div className="grid flex-1 grid-cols-10 gap-1.5">
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
                </div>
              </div>
            );
          })}
        </div>
        <Legend />
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3">
        {selectedSeat ? (
          <p className="text-sm">
            <b>
              {selectedSeat.grade}석 {selectedSeat.seatNumber}번
            </b>{" "}
            · {formatPrice(selectedSeat.price)}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">좌석을 선택하세요.</p>
        )}
        {/* 예매 API는 2단계에서 만든다. 지금은 선택까지만 */}
        <button
          type="button"
          disabled
          title="2단계에서 예매 API를 연결합니다"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          예매하기
        </button>
      </div>

      <Link href={`/concerts/${data.concertId}`} className="mt-4 inline-block text-sm text-zinc-500 hover:underline">
        &larr; 공연 상세로
      </Link>
    </div>
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
  const color =
    seat.status === "SOLD"
      ? "bg-zinc-300 text-zinc-500 line-through"
      : disabled
        ? "bg-zinc-200 text-zinc-400" // 오픈 전
        : `${GRADE_STYLE[seat.grade]} text-white`;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${seat.grade}석 ${seat.seatNumber}번 ${seat.status === "SOLD" ? "판매 완료" : formatPrice(seat.price)}`}
      className={`aspect-square rounded text-[10px] font-medium transition disabled:cursor-not-allowed ${color} ${
        selected ? "ring-2 ring-zinc-900 ring-offset-2" : ""
      }`}
    >
      {seat.seatNumber}
    </button>
  );
}

function Legend() {
  return (
    <ul className="mt-6 flex flex-wrap gap-4 text-xs text-zinc-600">
      {GRADE_ORDER.map((grade) => (
        <li key={grade} className="flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-sm ${GRADE_STYLE[grade]}`} />
          {grade}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-zinc-300" />
        판매 완료
      </li>
    </ul>
  );
}
