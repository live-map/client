const API_BASE = process.env.API_URL || "http://localhost:8000";

export async function GET(_req: Request, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;

  try {
    const res = await fetch(`${API_BASE}/api/v1/polls/${pollId}/research/status`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return Response.json(
        { status: "pending", error: null, currentStep: null },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ status: "pending", error: null, currentStep: null }, { status: 502 });
  }
}
