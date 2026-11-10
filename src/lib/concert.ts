export type Genre = "CONCERT" | "MUSICAL" | "THEATER" | "SPORTS";

// 백엔드 ConcertResponse(record)와 필드가 같아야 한다
export type Concert = {
  id: number;
  title: string;
  venue: string;
  genre: Genre;
  description: string | null;
  startDate: string; // "2026-12-20"
  endDate: string;
};

export const GENRE_LABEL: Record<Genre, string> = {
  CONCERT: "콘서트",
  MUSICAL: "뮤지컬",
  THEATER: "연극",
  SPORTS: "스포츠",
};
