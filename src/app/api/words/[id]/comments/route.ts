import { NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import WordCommentModel from "@/models/WordComment";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const { id } = await params;
  const rawId = id ?? "";
  const cleanedId = rawId.replace(/^ObjectId\\(\"(.+)\"\\)$/, "$1");
  const wordObjectId = Types.ObjectId.isValid(cleanedId)
    ? new Types.ObjectId(cleanedId)
    : null;

  if (!wordObjectId) {
    return NextResponse.json([], { status: 200 });
  }

  const comments = await WordCommentModel.find({ wordId: wordObjectId })
    .sort({ createdAt: -1 })
    .populate("userId", "_id name image username")
    .lean();

  return NextResponse.json(comments);
}
