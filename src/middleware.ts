import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ipCache = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 50; // max requests
const WINDOW_MS = 60 * 1000; // 1 minute

export function middleware(request: NextRequest) {
    // Only apply to /api/ routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

        const now = Date.now();
        const hit = ipCache.get(ip);

        if (!hit) {
            ipCache.set(ip, { count: 1, lastReset: now });
        } else {
            if (now - hit.lastReset > WINDOW_MS) {
                // Reset window
                hit.count = 1;
                hit.lastReset = now;
            } else {
                hit.count++;
                if (hit.count > RATE_LIMIT) {
                    return new NextResponse('Too Many Requests', { status: 429 });
                }
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
