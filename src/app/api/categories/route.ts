import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET() {
  try {
    const cacheKey = "categories:tree";
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const categories = await db.category.findMany({
      where: { parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        parentId: true,
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            parentId: true,
            children: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                image: true,
                parentId: true,
                children: true,
              },
            },
          },
        },
      },
    });

    await cacheSet(cacheKey, categories, 600); // 10 min cache
    return NextResponse.json(categories);
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
