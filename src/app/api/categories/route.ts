import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  children: CategoryNode[];
};

function toCanonical(
  c: CategoryNode,
  index: number
): CategoryNode & {
  handle: string;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  external_id: string;
  metadata: Record<string, unknown>;
} {
  return {
    ...c,
    handle: c.slug,
    image_url: c.image,
    parent_id: c.parentId,
    sort_order: index,
    external_id: c.id,
    metadata: {},
  };
}

function decorateTree(nodes: CategoryNode[]): ReturnType<typeof toCanonical>[] {
  return nodes.map((node, index) => {
    const decorated = toCanonical(node, index);
    if (node.children?.length) {
      decorated.children = decorateTree(node.children) as unknown as CategoryNode[];
    }
    return decorated;
  });
}

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

    const decorated = decorateTree(
      categories as unknown as CategoryNode[]
    );

    await cacheSet(cacheKey, decorated, 600); // 10 min cache
    return NextResponse.json(decorated);
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}