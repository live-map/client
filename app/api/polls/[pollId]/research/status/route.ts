const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(_req: Request, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;
  const res = await fetch(`${API_BASE}/api/v1/polls/${pollId}/research/status`, {
    cache: "no-store",
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
