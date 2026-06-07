import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const REDIS_KEY = "ruleta:forced_prize";

// Fallback en memoria para desarrollo local (sin Redis)
let memForced: number | null = null;

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
      const val = await redis.get<number>(REDIS_KEY);
      return NextResponse.json({ forcedPrizeId: val !== null && val !== undefined ? Number(val) : null });
    }
    return NextResponse.json({ forcedPrizeId: memForced });
  } catch {
    return NextResponse.json({ forcedPrizeId: null });
  }
}

export async function POST(req: Request) {
  try {
    const { forcedPrizeId } = await req.json();
    const id = forcedPrizeId === null || forcedPrizeId === undefined ? null : Number(forcedPrizeId);
    const redis = getRedis();
    if (redis) {
      if (id === null) {
        await redis.del(REDIS_KEY);
      } else {
        await redis.set(REDIS_KEY, id);
      }
    } else {
      memForced = id;
    }
    return NextResponse.json({ forcedPrizeId: id });
  } catch {
    return NextResponse.json({ error: "Error saving" }, { status: 500 });
  }
}
