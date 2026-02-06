import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import UserModel from "@/models/User";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const targetUserId = typeof body.userId === "string" ? body.userId : "";

  if (!targetUserId || targetUserId === session.user.id) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  await dbConnect();

  const currentUser = await UserModel.findById(session.user.id);
  const targetUser = await UserModel.findById(targetUserId);

  if (!currentUser || !targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isFollowing = currentUser.following?.some(
    (id) => id.toString() === targetUserId
  );

  if (isFollowing) {
    await UserModel.findByIdAndUpdate(session.user.id, {
      $pull: { following: targetUserId },
    });
    await UserModel.findByIdAndUpdate(targetUserId, {
      $pull: { followers: session.user.id },
    });
  } else {
    await UserModel.findByIdAndUpdate(session.user.id, {
      $addToSet: { following: targetUserId },
    });
    await UserModel.findByIdAndUpdate(targetUserId, {
      $addToSet: { followers: session.user.id },
    });
  }

  return NextResponse.json({ following: !isFollowing });
}
