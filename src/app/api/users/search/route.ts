import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const client = await clientPromise;
  const db = client.db();

  const users = await db
    .collection("users")
    .find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ],
    })
    .project({ username: 1, name: 1, image: 1 })
    .limit(10)
    .toArray();

  const result = users.map((user) => ({
    id: user._id?.toString(),
    username: user.username ?? null,
    name: user.name ?? null,
    image: user.image ?? null,
  }));

  return NextResponse.json(result);
}
