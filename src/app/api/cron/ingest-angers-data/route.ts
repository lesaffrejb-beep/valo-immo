import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type DatasetConfig = {
    dataset: "plui" | "isochrones" | "nuisances";
    url?: string;
};

type GeoJsonFeatureCollection = {
    type: "FeatureCollection";
    features: unknown[];
};

function isFeatureCollection(payload: unknown): payload is GeoJsonFeatureCollection {
    if (!payload || typeof payload !== "object") {
        return false;
    }

    const candidate = payload as Partial<GeoJsonFeatureCollection>;
    return candidate.type === "FeatureCollection" && Array.isArray(candidate.features);
}

function isAuthorized(request: Request): boolean {
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
        return false;
    }

    const authHeader = request.headers.get("authorization");
    const cronSecretHeader = request.headers.get("x-cron-secret");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    return cronSecretHeader === expectedSecret || bearerToken === expectedSecret;
}

async function ingestAngersData(request: Request) {
    if (!isAuthorized(request)) {
        return NextResponse.json(
            { success: false, error: "Unauthorized cron request." },
            { status: 401 }
        );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
            {
                success: false,
                error: "Missing Supabase configuration (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
            },
            { status: 500 }
        );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const datasets: DatasetConfig[] = [
        { dataset: "plui", url: process.env.ANGERS_PLUI_GEOJSON_URL },
        { dataset: "isochrones", url: process.env.ANGERS_ISOCHRONES_GEOJSON_URL },
        { dataset: "nuisances", url: process.env.ANGERS_NUISANCES_GEOJSON_URL },
    ];

    const reports: Array<Record<string, unknown>> = [];

    for (const config of datasets) {
        if (!config.url) {
            reports.push({ dataset: config.dataset, status: "skipped", reason: "missing_url" });
            continue;
        }

        try {
            const response = await fetch(config.url, { cache: "no-store" });
            if (!response.ok) {
                throw new Error(`GeoJSON download failed (${response.status})`);
            }

            const payload: unknown = await response.json();
            if (!isFeatureCollection(payload)) {
                throw new Error("Invalid GeoJSON payload (FeatureCollection expected)");
            }

            const { data, error } = await supabase.rpc("ingest_angers_feature_collection", {
                p_dataset: config.dataset,
                p_feature_collection: payload,
            });

            if (error) {
                throw new Error(error.message);
            }

            reports.push({ dataset: config.dataset, status: "ok", details: data });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown ingestion error";
            reports.push({ dataset: config.dataset, status: "error", error: message });
        }
    }

    const hasErrors = reports.some((report) => report.status === "error");

    return NextResponse.json(
        {
            success: !hasErrors,
            message: hasErrors ? "Ingestion completed with errors." : "Ingestion completed.",
            reports,
        },
        { status: hasErrors ? 500 : 200 }
    );
}

export async function GET(request: Request) {
    return ingestAngersData(request);
}

export async function POST(request: Request) {
    return ingestAngersData(request);
}
