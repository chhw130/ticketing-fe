import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 브라우저(클라이언트 컴포넌트)에서 /api/** 로 요청하면 Spring으로 넘겨준다.
  // 같은 출처 요청이 되므로 개발 중에는 CORS 설정이 필요 없다
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_BASE_URL ?? "http://localhost:8080"}/api/:path*`,
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Chakra는 컴포넌트가 아주 많은 패키지라, 실제로 import한 것만 번들에 넣도록 한다
    optimizePackageImports: ["@chakra-ui/react"],
  },
};

export default nextConfig;
