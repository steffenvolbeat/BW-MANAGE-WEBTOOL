import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/security/guard";

// Job Portal APIs Configuration (real endpoints require valid API tokens)
const JOB_PORTALS = {
  STEPSTONE: {
    name: "StepStone",
    baseUrl: "https://api.stepstone.com/v1",
    searchEndpoint: "/jobs",
    tokenEnv: "STEPSTONE_API_TOKEN",
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },
  XING: {
    name: "Xing",
    baseUrl: "https://api.xing.com/v1",
    searchEndpoint: "/jobs/find",
    tokenEnv: "XING_API_TOKEN",
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },
  LINKEDIN: {
    name: "LinkedIn",
    baseUrl: "https://api.linkedin.com/v2",
    searchEndpoint: "/jobSearch",
    tokenEnv: "LINKEDIN_API_TOKEN",
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },
  INDEED: {
    name: "Indeed",
    baseUrl: "https://api.indeed.com/v2",
    searchEndpoint: "/jobs",
    tokenEnv: "INDEED_API_TOKEN",
    authHeader: (token: string) => ({ "X-Api-Token": token }),
  },
} as const;

export async function GET(request: NextRequest) {
  try {
    await requireActiveUser();

    const { searchParams } = new URL(request.url);
    const portal = searchParams.get("portal");
    const keyword = searchParams.get("keyword") || "";
    const location = searchParams.get("location") || "";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (
      !portal ||
      !JOB_PORTALS[portal.toUpperCase() as keyof typeof JOB_PORTALS]
    ) {
      return NextResponse.json(
        { error: "Invalid or missing portal parameter" },
        { status: 400 }
      );
    }

    const portalConfig = JOB_PORTALS[portal.toUpperCase() as keyof typeof JOB_PORTALS];
    const token = process.env[portalConfig.tokenEnv];

    if (!token) {
      return NextResponse.json(
        { error: `Missing API token for ${portalConfig.name}. Set ${portalConfig.tokenEnv} env var.` },
        { status: 500 }
      );
    }

    const url = new URL(`${portalConfig.baseUrl}${portalConfig.searchEndpoint}`);
    if (keyword) url.searchParams.set("q", keyword);
    if (location) url.searchParams.set("location", location);
    url.searchParams.set("limit", limit.toString());

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        ...portalConfig.authHeader(token),
      },
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { error: `Portal request failed (${res.status}): ${body}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      portal: portal.toUpperCase(),
      raw: data,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED" || msg === "INACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Job portal API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireActiveUser();

    const body = await request.json();
    const { jobId, portal, action } = body;

    // Simuliere Job-Aktionen (speichern, ignorieren, etc.)
    console.log(`Job action: ${action} for job ${jobId} from ${portal}`);

    return NextResponse.json({
      success: true,
      message: `Job ${action} successfully`,
      jobId,
      portal,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED" || msg === "INACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Job portal action error:", error);
    return NextResponse.json(
      { error: "Failed to process job action" },
      { status: 500 }
    );
  }
}
