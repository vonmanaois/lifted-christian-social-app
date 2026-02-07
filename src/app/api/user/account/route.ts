import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import UserModel from "@/models/User";
import NotificationModel from "@/models/Notification";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  if (!Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const userObjectId = new Types.ObjectId(userId);

  await dbConnect();

  await Promise.all([
    UserModel.updateOne(
      { _id: userObjectId },
      { $set: { deletionRequestedAt: new Date(), deletedAt: new Date() } }
    ),
    NotificationModel.deleteMany({
      $or: [{ userId: userObjectId }, { actorId: userObjectId }],
    }),
  ]);

  return NextResponse.json({ success: true, gracePeriodDays: 30 });
}
