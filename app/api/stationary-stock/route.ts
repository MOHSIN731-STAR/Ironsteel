import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../lib/authGuard";

/* ---------------- GET STOCK ---------------- */

export async function GET(
  req: NextRequest
) {
  const auth = requireAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const stocks =
      await prisma.stationaryStock.findMany({
        orderBy: {
          stationaryId: "asc",
        },
      });

    console.log(
      "STATIONARY STOCKS FROM DATABASE:",
      stocks
    );

    return NextResponse.json(stocks, {
      status: 200,
    });
  } catch (error) {
    console.error(
      "GET STATIONARY STOCK ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch stationary stocks",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}

/* ---------------- SAVE / UPDATE STOCK ---------------- */

export async function POST(
  req: NextRequest
) {
  const auth = requireAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await req.json();

    console.log(
      "STATIONARY STOCK POST BODY:",
      body
    );

    const stationaryId = Number(
      body.stationaryId
    );

    const stock = Number(body.stock);

    /* ---------------- VALIDATION ---------------- */

    if (
      !Number.isInteger(stationaryId) ||
      stationaryId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid stationaryId",
          received:
            body.stationaryId,
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid stock",
          received: body.stock,
        },
        {
          status: 400,
        }
      );
    }

    /* ---------------- FIND EXISTING ---------------- */

    const existingStock =
      await prisma.stationaryStock.findFirst(
        {
          where: {
            stationaryId:
              stationaryId,
          },
        }
      );

    let result;

    /* ---------------- UPDATE ---------------- */

    if (existingStock) {
      result =
        await prisma.stationaryStock.update(
          {
            where: {
              id: existingStock.id,
            },
            data: {
              stock: stock,
            },
          }
        );
    }

    /* ---------------- CREATE ---------------- */

    else {
      result =
        await prisma.stationaryStock.create(
          {
            data: {
              stationaryId:
                stationaryId,
              stock: stock,
            },
          }
        );
    }

    console.log(
      "STATIONARY STOCK SAVED:",
      result
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "POST STATIONARY STOCK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to save stationary stock",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}