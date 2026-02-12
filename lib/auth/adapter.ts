import type { Adapter, AdapterUser, AdapterAccount } from "next-auth/adapters";
import { createId } from "@paralleldrive/cuid2";
import type { Pool } from "pg";

/** Map a DB row (snake_case) → NextAuth AdapterUser (camelCase) */
function mapUser(row: Record<string, unknown>): AdapterUser {
  return {
    id: row.id as string,
    name: (row.name as string) ?? null,
    email: (row.email as string) ?? "",
    emailVerified: row.email_verified ? new Date(row.email_verified as string) : null,
    image: (row.image as string) ?? null,
    role: (row.role as string) ?? "USER",
  };
}

export function PgAdapter(pool: Pool): Adapter {
  return {
    async createUser(user) {
      const id = createId();
      const { rows } = await pool.query(
        `INSERT INTO users (id, name, email, email_verified, image, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, user.name ?? null, user.email, user.emailVerified ?? null, user.image ?? null, "USER"]
      );
      return mapUser(rows[0]);
    },

    async getUser(id) {
      const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      return rows.length ? mapUser(rows[0]) : null;
    },

    async getUserByEmail(email) {
      const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      return rows.length ? mapUser(rows[0]) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const { rows } = await pool.query(
        `SELECT u.* FROM users u
         JOIN accounts a ON u.id = a.user_id
         WHERE a.provider = $1 AND a.provider_account_id = $2`,
        [provider, providerAccountId]
      );
      return rows.length ? mapUser(rows[0]) : null;
    },

    async updateUser(user) {
      const fields: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (user.name !== undefined) {
        fields.push(`name = $${idx++}`);
        values.push(user.name);
      }
      if (user.email !== undefined) {
        fields.push(`email = $${idx++}`);
        values.push(user.email);
      }
      if (user.emailVerified !== undefined) {
        fields.push(`email_verified = $${idx++}`);
        values.push(user.emailVerified);
      }
      if (user.image !== undefined) {
        fields.push(`image = $${idx++}`);
        values.push(user.image);
      }

      values.push(user.id);
      const { rows } = await pool.query(
        `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
        values
      );
      return mapUser(rows[0]);
    },

    async linkAccount(account) {
      const id = createId();
      await pool.query(
        `INSERT INTO accounts
           (id, user_id, type, provider, provider_account_id,
            refresh_token, access_token, expires_at,
            token_type, scope, id_token, session_state)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          id,
          account.userId,
          account.type,
          account.provider,
          account.providerAccountId,
          account.refresh_token ?? null,
          account.access_token ?? null,
          account.expires_at ?? null,
          account.token_type ?? null,
          account.scope ?? null,
          account.id_token ?? null,
          account.session_state ?? null,
        ]
      );
      return account as AdapterAccount;
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await pool.query("DELETE FROM accounts WHERE provider = $1 AND provider_account_id = $2", [
        provider,
        providerAccountId,
      ]);
    },

    // --- Session methods (JWT strategy → stubs) ---

    async createSession(session) {
      return session;
    },

    async getSessionAndUser() {
      return null;
    },

    async updateSession() {
      return null;
    },

    async deleteSession() {},

    // --- Verification token ---

    async createVerificationToken(token) {
      await pool.query(
        `INSERT INTO verification_tokens (identifier, token, expires)
         VALUES ($1, $2, $3)`,
        [token.identifier, token.token, token.expires]
      );
      return token;
    },

    async useVerificationToken({ identifier, token }) {
      const { rows } = await pool.query(
        `DELETE FROM verification_tokens
         WHERE identifier = $1 AND token = $2
         RETURNING *`,
        [identifier, token]
      );
      return rows.length ? rows[0] : null;
    },

    async deleteUser(id) {
      await pool.query("DELETE FROM users WHERE id = $1", [id]);
    },
  };
}
