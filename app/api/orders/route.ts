import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

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