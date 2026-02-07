import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import PrayerModel from "@/models/Prayer";
import dbConnect from "@/lib/db";

const usernameRegex = /^[a-z0-9_]{3,20}$/;

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";

  if (!usernameRegex.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-20 chars, lowercase, numbers or underscore." },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db();
  const userObjectId = ObjectId.isValid(session.user.id)
    ? new ObjectId(session.user.id)
    : null;
  const userFilter =
    session.user.email && session.user.email.length > 0
      ? { email: session.user.email }
      : userObjectId
        ? { _id: userObjectId }
        : { _id: session.user.id };

  const exists = await db.collection("users").findOne({
    username,
    _id: userObjectId ? { $ne: userObjectId } : undefined,
  });

  if (exists) {
    return NextResponse.json({ error: "Username already taken." }, { status: 409 });
  }

  await db.collection("users").updateOne(
    userFilter,
    {
      $set: {
        username,
        name,
        bio: bio.slice(0, 280),
        onboardingComplete: true,
      },
    }
  );

  const updated = await db.collection("users").findOne(userFilter);

  return NextResponse.json({
    username: updated?.username ?? username,
    name: updated?.name ?? name,
    bio: updated?.bio ?? bio,
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const usernameParam = searchParams.get("username");

  const client = await clientPromise;
  const db = client.db();

  if (usernameParam) {
    await dbConnect();
    const user = await db.collection("users").findOne({ username: usernameParam });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    let prayersLiftedCount =
      typeof user.prayersLiftedCount === "number" ? user.prayersLiftedCount : null;

    if (user._id) {
      const count = await PrayerModel.countDocuments({ prayedBy: user._id });
      prayersLiftedCount = count;
      if (user.prayersLiftedCount !== count) {
        await db
          .collection("users")
          .updateOne({ _id: user._id }, { $set: { prayersLiftedCount: count } });
      }
    }

    return NextResponse.json({
      name: user.name ?? null,
      username: user.username ?? null,
      bio: user.bio ?? null,
      followersCount: Array.isArray(user.followers) ? user.followers.length : 0,
      followingCount: Array.isArray(user.following) ? user.following.length : 0,
      prayersLiftedCount: typeof prayersLiftedCount === "number" ? prayersLiftedCount : 0,
    });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = ObjectId.isValid(session.user.id)
    ? new ObjectId(session.user.id)
    : null;
  const userFilter =
    session.user.email && session.user.email.length > 0
      ? { email: session.user.email }
      : userId
        ? { _id: userId }
        : { _id: session.user.id };

  const user = await db.collection("users").findOne(userFilter);
  let prayersLiftedCount =
    typeof user?.prayersLiftedCount === "number" ? user.prayersLiftedCount : null;

  if (user?._id) {
    const count = await PrayerModel.countDocuments({ prayedBy: user._id });
    prayersLiftedCount = count;
    if (user.prayersLiftedCount !== count) {
      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: { prayersLiftedCount: count } }
      );
    }
  }

  return NextResponse.json({
    name: user?.name ?? null,
    username: user?.username ?? null,
    bio: user?.bio ?? null,
    followersCount: Array.isArray(user?.followers) ? user.followers.length : 0,
    followingCount: Array.isArray(user?.following) ? user.following.length : 0,
    prayersLiftedCount: typeof prayersLiftedCount === "number" ? prayersLiftedCount : 0,
  });
}
