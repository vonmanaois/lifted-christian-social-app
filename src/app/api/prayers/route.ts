import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import CommentModel from "@/models/Comment";
import PrayerModel from "@/models/Prayer";
import { Types } from "mongoose";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const cursor = searchParams.get("cursor");
  const limitParam = Number(searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20;

  await dbConnect();

  const isOwnerView = Boolean(session?.user?.id && userId && session.user.id === userId);
  const filter: Record<string, unknown> = userId
    ? isOwnerView
      ? { userId }
      : { userId, isAnonymous: false }
    : {};

  if (cursor) {
    const decoded = Buffer.from(cursor, "base64").toString("utf8");
    const [createdAtRaw, idRaw] = decoded.split("|");
    const createdAt = createdAtRaw ? new Date(createdAtRaw) : null;
    const cursorId = idRaw && Types.ObjectId.isValid(idRaw) ? new Types.ObjectId(idRaw) : null;
    if (createdAt && !Number.isNaN(createdAt.getTime())) {
      filter.$or = [
        { createdAt: { $lt: createdAt } },
        ...(cursorId ? [{ createdAt, _id: { $lt: cursorId } }] : []),
      ];
    }
  }

  const prayers = await PrayerModel.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate("userId", "name image username")
    .lean();

  const hasMore = prayers.length > limit;
  const items = hasMore ? prayers.slice(0, limit) : prayers;

  const sanitized = await Promise.all(
    items.map(async (prayer) => {
      const { userId: userRef, ...rest } = prayer as typeof prayer & {
        userId?: { name?: string; image?: string; username?: string; _id?: { toString: () => string } } | null;
      };

      const rawUserId = (prayer as {
        userId?: { _id?: { toString: () => string } } | { toString: () => string } | string | null;
      }).userId;

      let userIdString: string | null = null;
      if (typeof rawUserId === "string") {
        userIdString = rawUserId;
      } else if (
        rawUserId &&
        typeof (rawUserId as { _id?: { toString: () => string } })._id?.toString === "function"
      ) {
        userIdString = (rawUserId as { _id: { toString: () => string } })._id.toString();
      } else if (rawUserId && typeof (rawUserId as { toString?: () => string }).toString === "function") {
        const asString = (rawUserId as { toString: () => string }).toString();
        userIdString = asString !== "[object Object]" ? asString : null;
      }

      const base = {
        ...rest,
        _id: prayer._id.toString(),
        userId: userIdString,
        isOwner: Boolean(session?.user?.id && userIdString && session.user.id === userIdString),
      };

      if (prayer.isAnonymous) {
        const commentCount = await CommentModel.countDocuments({
          prayerId: prayer._id,
        });
        return { ...base, user: null, commentCount };
      }

      const commentCount = await CommentModel.countDocuments({
        prayerId: prayer._id,
      });
      return { ...base, user: userRef ?? null, commentCount };
    })
  );

  const last = items[items.length - 1];
  const nextCursor = hasMore && last
    ? Buffer.from(`${new Date(last.createdAt).toISOString()}|${last._id.toString()}`).toString("base64")
    : null;

  return NextResponse.json({ items: sanitized, nextCursor });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const isAnonymous = Boolean(body.isAnonymous);
  const expiresInDays =
    body.expiresInDays === "never" ? "never" : body.expiresInDays === 30 ? 30 : 7;

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  let expiresAt: Date | undefined;
  if (expiresInDays !== "never") {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  await dbConnect();

  const prayer = await PrayerModel.create({
    content,
    userId: session.user.id,
    isAnonymous,
    prayedBy: [],
    expiresAt,
  });

  return NextResponse.json(prayer, { status: 201 });
}
