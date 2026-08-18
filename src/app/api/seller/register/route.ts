import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth";
import { sellerService } from "@/modules/seller/seller.service";

export async function POST(request: NextRequest) {
  try {
    const session = await getRequestSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { shopName, description } = await request.json();

    if (!shopName) {
      return NextResponse.json({ error: "Shop name is required" }, { status: 400 });
    }

    const profile = await sellerService.register(session.user.id, { shopName, description });

    return NextResponse.json({
      message: "Seller registration successful. Welcome to Lumière!",
      profile
    });
  } catch (error: any) {
    console.error("[POST /api/seller/register]", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Shop name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
