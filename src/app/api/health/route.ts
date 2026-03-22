import { NextResponse } from "next/server";

export async function GET() {
  const timestamp = new Date().toISOString();

  return NextResponse.json(
    {
      ok: true,
      data: {
        status: "healthy",
        timestamp,
      },
    },
    { status: 200 },
  );
}
