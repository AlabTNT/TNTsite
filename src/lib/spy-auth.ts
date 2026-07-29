import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || "default_super_secret_key_change_me_in_production_123456";

export function signToken(payload: any): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifyToken(token: string): any | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expectedSignature = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  if (signature !== expectedSignature) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (payload.expiresAt && Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getRpID(req: Request): string {
  const host = req.headers.get("host") || "";
  const domain = host.split(":")[0];
  if (domain === "localhost" || domain === "127.0.0.1") return "localhost";
  if (domain.endsWith("alabtnt.cn")) return "alabtnt.cn";
  return domain;
}

export function getOrigin(req: Request): string {
  const host = req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const scheme = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : proto;
  return `${scheme}://${host}`;
}

import { prisma } from "./prisma";

export async function authorizeRequest(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("authorization") || "";
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const apiToken = tokenMatch ? tokenMatch[1] : null;
  const expectedToken = process.env.SPY_API_TOKEN?.replace(/^["']|["']$/g, "");

  if (expectedToken && apiToken === expectedToken) {
    return true;
  }

  const count = await prisma.spyCredential.count();
  if (count === 0) {
    return true;
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/spy_admin_session=([^;]+)/);
  const session = match ? verifyToken(match[1]) : null;
  return !!session && session.authenticated;
}
