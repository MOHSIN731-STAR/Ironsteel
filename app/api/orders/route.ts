import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../lib/authGuard";


export async function POST(req: NextRequest) {
  const auth = requireAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await req.json();

    if (!body.customerName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name is required",
        },
        { status: 400 }
      );
    }

    const rawItems = Array.isArray(body.items)
      ? body.items
      : [];

    const items = rawItems.map((item: any) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;

      return {
        name: item.name?.trim() || "",
        price,
        quantity,

        // Item ka apna calculation
        total: price * quantity,
      };
    });

    // ========================================================
    // NEW ORDER TOTAL
    //
    // POST par agar frontend total bhej raha hai to usko use
    // karenge.
    //
    // Agar total nahi bheja gaya to items ka total calculate
    // hoga.
    // ========================================================

    const calculatedTotal = items.reduce(
      (sum: number, item: any) =>
        sum + Number(item.total || 0),
      0
    );

    const receivedTotal = Number(body.total);

    const grandTotal = Number.isFinite(receivedTotal)
      ? receivedTotal
      : calculatedTotal;

    // ========================================================
    // CREATE ORDER
    // ========================================================

    const order = await prisma.order.create({
      data: {
        customerName: body.customerName.trim(),

        // IMPORTANT:
        // Saved order total
        total: grandTotal,

        ...(body.customer && {
          customer: {
            connect: {
              id: Number(body.customer),
            },
          },
        }),

        items: {
          create: items,
        },
      },

      include: {
        items: true,
        customer: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        order,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST Orders API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to create order",
      },
      { status: 500 }
    );
  }
}
// ============================================================
// GET ORDERS
// ============================================================

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// UPDATE ORDER
// ============================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      orderId,
      customerName,
      items,
      total,
      itemsCalculatedTotal,
    } = body;

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required",
        },
        { status: 400 }
      );
    }

    if (!customerName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name is required",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        {
          success: false,
          message: "Items must be an array",
        },
        { status: 400 }
      );
    }

    const customerTotal = Number(total);

    const editableItemsCalculatedTotal =
      Number(itemsCalculatedTotal);

    if (!Number.isFinite(customerTotal)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Customer Total",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(
        editableItemsCalculatedTotal
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Items Calculated Total",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // CLEAN ITEMS
    // ----------------------------------------------------------

    const cleanItems = items.map((item: any) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;

      return {
        name: String(item.name || "").trim(),
        price,
        quantity,

        // Item ka actual calculated total
        total: price * quantity,
      };
    });

    // ----------------------------------------------------------
    // UPDATE ORDER
    // ----------------------------------------------------------

    const updatedOrder = await prisma.order.update({
      where: {
        id: Number(orderId),
      },

      data: {
        customerName: customerName.trim(),

        // Customer Total
        total: customerTotal,

        // ⭐ IMPORTANT
        // Ye USER EDITABLE VALUE hai.
        // Isko items se calculate nahi kiya ja raha.
        itemsCalculatedTotal:
          editableItemsCalculatedTotal,

        // ------------------------------------------------------
        // UPDATE ITEMS
        // ------------------------------------------------------

        items: {
          // Purane items delete
          deleteMany: {},

          // New items create
          create: cleanItems,
        },
      },

      include: {
        items: true,
      },
    });

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return NextResponse.json({
      success: true,

      message: "Order updated successfully",

      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("PUT ORDER ERROR:", error);

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Failed to update order",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE ORDER
// ============================================================

export async function DELETE(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const orderId = Number(body.orderId);

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required",
        },
        { status: 400 }
      );
    }

    await prisma.order.delete({
      where: {
        id: orderId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error: any) {
    console.error(
      "DELETE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to delete order",
      },
      { status: 500 }
    );
  }
}