import axios, { AxiosError } from "axios";

// 백엔드 ApiResult(record)와 같은 모양. 성공 응답은 모두 이 형태로 감싸서 온다
type ApiResult<T> = { message: string; data: T };

// 백엔드 공통 에러 응답 (ErrorResponse record)
type ErrorResponse = { code: string; message: string };

// 화면에서 다루기 쉽게 에러 모양을 하나로 통일한다.
// status가 0이면 서버에 아예 닿지 못한 경우(서버 꺼짐, 네트워크 끊김)
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// 서버(서버 컴포넌트)에서는 Spring 주소로 직접, 브라우저에서는 같은 출처의 /api/** 로 보낸다.
// 브라우저 요청은 next.config의 rewrites가 Spring으로 넘겨주므로 CORS가 필요 없다
const baseURL =
  typeof window === "undefined" ? (process.env.API_BASE_URL ?? "http://localhost:8080") : "";

export const http = axios.create({
  baseURL,
  timeout: 5000,
  // axios는 원래 Node에서 http 모듈을 쓰는데, fetch 어댑터로 바꾸면 서버/브라우저 모두 fetch로 요청한다.
  // Next.js가 fetch를 기준으로 동작하는 기능(렌더 중 같은 요청 합치기 등)을 그대로 누리기 위해서다
  adapter: "fetch",
});

// ── 요청 인터셉터: 모든 요청에 공통으로 붙일 것 ──
http.interceptors.request.use((config) => {
  // 인증은 JWT HttpOnly 쿠키로 한다 (docs/roadmap/stage-2-reservation.md 결정 사항).
  // 브라우저는 같은 출처(/api/**) 요청에 쿠키를 알아서 실어 보내므로 여기서 할 일이 없다.
  // 요청 ID, 언어 같은 공통 헤더가 생기면 여기서 한 번만 붙인다: config.headers.set("X-Request-Id", ...)
  return config;
});

// ── 응답 인터셉터: ApiResult 껍데기를 벗기고, 에러를 ApiError로 바꾼다 ──
// 덕분에 호출하는 쪽은 http.get<T>()의 결과 .data가 바로 T가 된다 (아래 get 함수 참고)
http.interceptors.response.use(
  (response) => {
    response.data = (response.data as ApiResult<unknown>).data;
    return response;
  },
  (error: AxiosError<ErrorResponse>) => {
    if (error.response) {
      const { status, data } = error.response;
      return Promise.reject(
        new ApiError(status, data?.code ?? "UNKNOWN", data?.message ?? `요청 실패 (${status})`),
      );
    }
    return Promise.reject(new ApiError(0, "NETWORK_ERROR", "서버에 연결할 수 없습니다."));
  },
);

// 자주 쓰는 GET을 짧게. 인터셉터가 껍데기를 벗겨 주므로 바로 T를 돌려준다
export async function get<T>(url: string, config?: Parameters<typeof http.get>[1]): Promise<T> {
  const res = await http.get<T>(url, config);
  return res.data;
}
