import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import NotificationModel from "@/models/Notification";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const encoder = new TextEncoder();
  let lastCount = -1;

  const stream = new ReadableStream({
    start(controller) {
      const send = async () => {
        try {
          const count = await NotificationModel.countDocuments({
            userId: session.user.id,
          });
          if (count !== lastCount) {
            lastCount = count;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ count })}\n\n`)
            );
          }
        } catch {
          // ignore transient errors
        }
      };

      send();

      const interval = setInterval(send, 5000);

      const close = () => {
        clearInterval(interval);
        controller.close();
      };

      request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
