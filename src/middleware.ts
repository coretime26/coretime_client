
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/oauth/callback",
  "/favicon.ico",
];

// 정적 파일 같은 것들은 matcher에서 대부분 제외하지만,
// 혹시 모르니 확장자 기반도 한번 더 방어
function isPublicFile(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // e.g. .png, .css, .js ...
  );
}

function isPublicPath(pathname: string, searchParams: URLSearchParams) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (isPublicFile(pathname)) return true;

  // Allow any path if it has tokens (Backend is managing the flow)
  const hasAccessToken = searchParams.has("accessToken");
  const hasSignupToken = searchParams.has("signupToken");

  if (hasAccessToken || hasSignupToken) {
    return true;
  }

  // Allow pending approval flow: /login?state=pending&accessToken=...
  if (pathname === "/login" && searchParams.has("state") && hasAccessToken) {
    return true;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname, searchParams } = nextUrl;

  /**
1) 백엔드가 토큰을 쿼리스트링으로 넘겨주는 케이스 처리
   - /oauth/callback 로 모아서 처리
   */
  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");

  if (accessToken && refreshToken && pathname !== "/oauth/callback") {
    const callbackUrl = new URL("/oauth/callback", request.url);
    searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(callbackUrl);
  }

  /**
2) 공개 경로는 통과
   */
  if (isPublicPath(pathname, searchParams)) {
    return NextResponse.next();
  }

  /**
3) 세션(JWT) 없으면 /login 으로 이동
   - NextAuth JWT strategy("jwt") 사용 중이라 getToken()으로 판별 가능
   */
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET, // authOptions와 동일해야 함
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  /**
4) (옵션) refresh 실패로 error가 박힌 토큰이면 로그인으로 보내기
   */
  if ((token as any).error === "RefreshAccessTokenError") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "session_expired");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
:white_check_mark: 모든 페이지에서 middleware 실행하되,
api/static/image/favicon은 제외
 */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};