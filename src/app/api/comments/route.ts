import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import CommentModel from "@/models/Comment";
import NotificationModel from "@/models/Notification";
import PrayerModel from "@/models/Prayer";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const rawPrayerId = typeof body.prayerId === "string" ? body.prayerId : "";
  const cleanedPrayerId = rawPrayerId.replace(/^ObjectId\\(\"(.+)\"\\)$/, "$1");
  const prayerObjectId = Types.ObjectId.isValid(cleanedPrayerId)
    ? new Types.ObjectId(cleanedPrayerId)
    : null;

  if (!content || !prayerObjectId) {
    return NextResponse.json(
      { error: "Prayer ID and content are required" },
      { status: 400 }
    );
  }

  await dbConnect();

  const comment = await CommentModel.create({
    content,
    userId: session.user.id,
    prayerId: prayerObjectId,
  });

  const prayer = await PrayerModel.findById(prayerObjectId).lean();
  if (prayer?.userId && prayer.userId.toString() !== session.user.id) {
    await NotificationModel.create({
      userId: prayer.userId,
      actorId: session.user.id,
      prayerId: prayerObjectId,
      type: "comment",
    });
  }

  return NextResponse.json(comment, { status: 201 });
}
