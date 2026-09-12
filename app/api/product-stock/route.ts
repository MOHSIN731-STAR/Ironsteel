import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../lib/authGuard";

export async function GET(req: NextRequest) {
const auth = requireAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }
    try {
    const stocks = await prisma.productStock.findMany({
      orderBy: {
        productId: "asc",
      },
    });

    return NextResponse.json(stocks);
  } catch (error) {
    console.error("GET STOCK ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch stocks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

    try {
   
    } catch {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const productId = Number(body.productId);
    const stock = Number(body.stock);

    if (
      !Number.isInteger(productId) ||
      Number.isNaN(stock) ||
      stock < 0
    ) {
      return NextResponse.json(
        { error: "Invalid productId or stock" },
        { status: 400 }
      );
    }

    const productStock =
      await prisma.productStock.upsert({
        where: {
          productId,
        },

        update: {
          stock,
        },

        create: {
          productId,
          stock,
        },
      });

    return NextResponse.json(productStock);
  } 

