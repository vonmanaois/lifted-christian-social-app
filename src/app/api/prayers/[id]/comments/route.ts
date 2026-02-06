import { NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import CommentModel from "@/models/Comment";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const { id } = await params;
  const rawId = id ?? "";
  const cleanedId = rawId.replace(/^ObjectId\\(\"(.+)\"\\)$/, "$1");
  const prayerObjectId = Types.ObjectId.isValid(cleanedId)
    ? new Types.ObjectId(cleanedId)
    : null;

  if (!prayerObjectId) {
    return NextResponse.json([], { status: 200 });
  }

  const comments = await CommentModel.find({ prayerId: prayerObjectId })
    .sort({ createdAt: -1 })
    .populate("userId", "_id name image username")
    .lean();

  return NextResponse.json(comments);
}
