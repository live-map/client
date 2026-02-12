import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";

import pool from "@/lib/pg";
import { PgAdapter } from "@/lib/auth/adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PgAdapter(pool),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // 초기 로그인 시 user 객체에서 role 저장
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      // OAuth 사용자는 DB에서 role 조회 (role이 없는 경우)
      if (token.id && !token.role) {
        const { rows } = await pool.query("SELECT role FROM users WHERE id = $1", [token.id]);
        const dbUser = rows[0];
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
