import type { Metadata } from "next";
import Link from "next/link";
import { getConcerts } from "@/lib/api";
import { GENRE_LABEL } from "@/lib/concert";

export const metadata: Metadata = {
  title: "공연 목록",
  description: "예매 가능한 공연을 확인하고 티켓팅을 연습해 보세요.",
};

export default async function ConcertsPage() {
  const concerts = await getConcerts();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">공연 목록</h1>

      {concerts.length === 0 ? (
        <p className="text-zinc-500">등록된 공연이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {concerts.map((concert) => (
            <li key={concert.id}>
              <Link
                href={`/concerts/${concert.id}`}
                className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <span className="text-xs text-zinc-500">{GENRE_LABEL[concert.genre]}</span>
                <h2 className="text-lg font-semibold">{concert.title}</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {concert.venue} · {concert.startDate} ~ {concert.endDate}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
