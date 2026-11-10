import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
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
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/concerts" className="text-sm text-zinc-500 hover:underline">
        &larr; 공연 목록
      </Link>
      <Suspense fallback={<p className="mt-6 text-zinc-500">불러오는 중...</p>}>
        {params.then(({ id }) => (
          <ConcertDetail id={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function ConcertDetail({ id }: { id: string }) {
  const concert = await getConcert(id);
  if (!concert) {
    notFound();
  }

  return (
    <article className="mt-6">
      <span className="text-sm text-zinc-500">{GENRE_LABEL[concert.genre]}</span>
      <h1 className="mt-1 text-3xl font-bold">{concert.title}</h1>
      <dl className="mt-6 grid grid-cols-[80px_1fr] gap-y-2 text-sm">
        <dt className="text-zinc-500">장소</dt>
        <dd>{concert.venue}</dd>
        <dt className="text-zinc-500">기간</dt>
        <dd>
          {concert.startDate} ~ {concert.endDate}
        </dd>
      </dl>
      {concert.description && <p className="mt-6 leading-7">{concert.description}</p>}
      <ScheduleList concertId={id} />
    </article>
  );
}

// 회차 목록. 회차를 누르면 좌석 선택 화면(/schedules/[id])으로 간다
// 오픈 여부는 여기서 계산하지 않는다: 캐시된 서버 컴포넌트에서 현재 시각을 쓰면 캐시된 시각으로 고정되기 때문.
// 실시간 오픈 여부는 좌석 선택 화면이 API에서 받아 온다
async function ScheduleList({ concertId }: { concertId: string }) {
  const schedules = await getSchedules(concertId);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">회차</h2>
      {schedules.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">등록된 회차가 없습니다.</p>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200">
          {schedules.map((schedule) => (
            <li key={schedule.id}>
              <Link
                href={`/schedules/${schedule.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50"
              >
                <span className="font-medium">{formatDateTime(schedule.startAt)}</span>
                <span className="text-sm text-zinc-500">
                  예매 오픈 {formatDateTime(schedule.ticketOpenAt)} &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
