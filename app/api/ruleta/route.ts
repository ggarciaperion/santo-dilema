import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const KEY_FORCED = "ruleta:forced_prize";
const KEY_RESET  = "ruleta:reset_session";

// Fallback en memoria para desarrollo local
let memForced: number | null = null;
let memReset  = false;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function GET() {
  try {
    const redis = getRedis();
    if (redis) {
      const [forced, reset] = await Promise.all([
        redis.get<number>(KEY_FORCED),
        redis.get<number>(KEY_RESET),
      ]);
      return NextResponse.json({
        forcedPrizeId: forced !== null && forced !== undefined ? Number(forced) : null,
        resetSession:  reset === 1,
      });
    }
    return NextResponse.json({ forcedPrizeId: memForced, resetSession: memReset });
  } catch {
    return NextResponse.json({ forcedPrizeId: null, resetSession: false });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const redis = getRedis();

    // Forzar premio
    if ("forcedPrizeId" in body) {
      const id = body.forcedPrizeId === null || body.forcedPrizeId === undefined
        ? null : Number(body.forcedPrizeId);
      if (redis) {
        id === null ? await redis.del(KEY_FORCED) : await redis.set(KEY_FORCED, id);
      } else {
        memForced = id;
      }
      return NextResponse.json({ forcedPrizeId: id });
    }

    // Resetear sesión
    if (body.action === "reset") {
      if (redis) {
        await Promise.all([redis.del(KEY_FORCED), redis.set(KEY_RESET, 1)]);
      } else {
        memForced = null;
        memReset  = true;
      }
      return NextResponse.json({ ok: true });
    }

    // Confirmar que la ruleta leyó y procesó el reset
    if (body.action === "ack_reset") {
      if (redis) {
        await redis.del(KEY_RESET);
      } else {
        memReset = false;
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Error saving" }, { status: 500 });
  }
}
