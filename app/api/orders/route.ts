import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../lib/authGuard";

// ============================================================
// POST - CREATE ORDER
// ============================================================

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
        name: String(item.name || "").trim(),
        price,
        quantity,
        total: price * quantity,
      };
    });

    const calculatedTotal = items.reduce(
      (sum: number, item: any) =>
        sum + Number(item.total || 0),
      0
    );

    /*
     * IMPORTANT:
     *
     * If frontend sends Items Calculated Total,
     * preserve it.
     *
     * Otherwise use calculated item total.
     */
    const receivedItemsCalculatedTotal = Number(
      body.itemsCalculatedTotal
    );

    const itemsCalculatedTotal =
      Number.isFinite(receivedItemsCalculatedTotal)
        ? receivedItemsCalculatedTotal
        : calculatedTotal;

    const receivedTotal = Number(body.total);

    const grandTotal = Number.isFinite(receivedTotal)
      ? receivedTotal
      : calculatedTotal;

    const order = await prisma.order.create({
      data: {
        customerName: body.customerName.trim(),

        total: grandTotal,

        itemsCalculatedTotal,

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
// PUT - MERGE / UPDATE ORDER GROUP
// ============================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      orderId,
      orderIds,
      customerName,
      items,
      total,
      itemsCalculatedTotal,
    } = body;

    // ========================================================
    // VALIDATION
    // ========================================================

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

    const primaryOrderId = Number(orderId);

    if (!Number.isInteger(primaryOrderId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Order ID",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // ALL GROUP ORDER IDS
    // ========================================================

    let groupOrderIds: number[] = [];

    if (Array.isArray(orderIds)) {
      groupOrderIds = orderIds
        .map((id: any) => Number(id))
        .filter((id: number) =>
          Number.isInteger(id)
        );
    }

    /*
     * Primary order MUST always be included.
     */
    if (!groupOrderIds.includes(primaryOrderId)) {
      groupOrderIds.push(primaryOrderId);
    }

    groupOrderIds = [
      ...new Set(groupOrderIds),
    ];

    // ========================================================
    // VALUES
    // ========================================================

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

    // ========================================================
    // CLEAN ITEMS
    // ========================================================

    const cleanItems = items.map(
      (item: any) => {
        const price =
          Number(item.price) || 0;

        const quantity =
          Number(item.quantity) || 0;

        return {
          name: String(
            item.name || ""
          ).trim(),

          price,

          quantity,

          total:
            price * quantity,
        };
      }
    );

    // ========================================================
    // TRANSACTION
    //
    // IMPORTANT:
    //
    // We merge ALL selected/grouped orders into ONE order.
    //
    // Example:
    //
    // Order 6 = 6 items
    // Order 7 = 5 items
    //
    // Save:
    //
    // Order 6 = 11 items
    // Order 7 = deleted
    //
    // This prevents duplicate totals.
    // ========================================================

    const updatedOrder =
      await prisma.$transaction(
        async (tx) => {
          // --------------------------------------------------
          // Check primary order
          // --------------------------------------------------

          const existingPrimary =
            await tx.order.findUnique({
              where: {
                id: primaryOrderId,
              },
            });

          if (!existingPrimary) {
            throw new Error(
              "Primary order not found"
            );
          }

          // --------------------------------------------------
          // DELETE ITEMS FROM PRIMARY ORDER
          // --------------------------------------------------

          await tx.orderItem.deleteMany({
            where: {
              orderId:
                primaryOrderId,
            },
          });

          // --------------------------------------------------
          // CREATE MERGED ITEMS
          // --------------------------------------------------

          if (cleanItems.length > 0) {
            await tx.orderItem.createMany({
              data: cleanItems.map(
                (item) => ({
                  orderId:
                    primaryOrderId,

                  name:
                    item.name,

                  price:
                    item.price,

                  quantity:
                    item.quantity,

                  total:
                    item.total,
                })
              ),
            });
          }

          // --------------------------------------------------
          // UPDATE PRIMARY ORDER
          // --------------------------------------------------

          const updated =
            await tx.order.update({
              where: {
                id: primaryOrderId,
              },

              data: {
                customerName:
                  customerName.trim(),

                total:
                  customerTotal,

                /*
                 * VERY IMPORTANT:
                 *
                 * Preserve user's current editable value.
                 *
                 * Do NOT recalculate this from items.
                 */
                itemsCalculatedTotal:
                  editableItemsCalculatedTotal,
              },
            });

          // --------------------------------------------------
          // DELETE OTHER ORDERS FROM GROUP
          // --------------------------------------------------

          const otherOrderIds =
            groupOrderIds.filter(
              (id) =>
                id !==
                primaryOrderId
            );

          if (
            otherOrderIds.length >
            0
          ) {
            await tx.order.deleteMany({
              where: {
                id: {
                  in: otherOrderIds,
                },
              },
            });
          }

          // --------------------------------------------------
          // GET FINAL ORDER
          // --------------------------------------------------

          return await tx.order.findUnique(
            {
              where: {
                id: primaryOrderId,
              },

              include: {
                items: true,
              },
            }
          );
        }
      );

    return NextResponse.json({
      success: true,

      message:
        "Orders merged and updated successfully",

      order: updatedOrder,
    });
  } catch (error: any) {
    console.error(
      "PUT ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Failed to merge/update order",
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
    const body =
      await request.json();

    const orderId =
      Number(body.orderId);

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order ID is required",
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
      message:
        "Order deleted successfully",
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