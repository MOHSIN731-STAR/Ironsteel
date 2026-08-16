import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../lib/authGuard";

// ============================================================
// POST - CREATE NEW ORDER
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
// GET - GET ALL ORDERS
// ============================================================

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },

      include: {
        items: true,
        customer: true,
      },

      take: 50,
    });

    const formattedOrders = orders.map(
      (order: any) => ({
        ...order,

        // IMPORTANT:
        // DB ka saved total exactly frontend ko bhejna hai.
        total: Number(order.total || 0),

        items: (order.items || []).map(
          (item: any) => ({
            ...item,

            price: Number(item.price || 0),

            quantity: Number(
              item.quantity || 0
            ),

            total: Number(
              item.total || 0
            ),

            createdAt:
              item.createdAt ||
              order.createdAt,
          })
        ),
      })
    );

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error: any) {
    console.error(
      "Orders GET API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to fetch orders",
        code: error?.code,
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - UPDATE EXISTING ORDER
// ============================================================
//
// IMPORTANT LOGIC:
//
// Items update/delete/create ho sakte hain.
//
// LEKIN total items se recalculate NAHI hoga.
//
// Example:
//
// Old Total = 11,400
//
// Item delete
//        ↓
// Total = 11,400
//
// User changes Total
// 11,400 → 13,000
//        ↓
// Total = 13,000
//
// Refresh
//        ↓
// Total = 13,000
//
// ============================================================

// ============================================================
// PUT - UPDATE CUSTOMER ORDER GROUP
// ============================================================

export async function PUT(req: NextRequest) {
  const auth = requireAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await req.json();

    const orderIds = Array.isArray(body.orderIds)
      ? body.orderIds
          .map((id: any) => Number(id))
          .filter((id: number) => Number.isInteger(id) && id > 0)
      : [];

    // Backward compatibility
    const singleOrderId = Number(
      body.orderId ?? body.id
    );

    const finalOrderIds =
      orderIds.length > 0
        ? [...new Set(orderIds)]
        : Number.isInteger(singleOrderId) &&
          singleOrderId > 0
        ? [singleOrderId]
        : [];

    const customerName =
      body.customerName?.trim();

    const items = Array.isArray(body.items)
      ? body.items
      : [];

    const total = Number(body.total);

    // ========================================================
    // VALIDATION
    // ========================================================

    if (finalOrderIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid order ID(s) required",
        },
        { status: 400 }
      );
    }

    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name is required",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(total)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid total is required",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // FIND ALL ORDERS
    // ========================================================

    const existingOrders =
      await prisma.order.findMany({
        where: {
          id: {
            in: finalOrderIds,
          },
        },
        include: {
          items: true,
        },
      });

    if (existingOrders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Orders not found",
        },
        { status: 404 }
      );
    }

    // ========================================================
    // FORMAT ITEMS
    // ========================================================

    const formattedItems = items.map(
      (item: any) => {
        const price =
          Number(item.price) || 0;

        const quantity =
          Number(item.quantity) || 0;

        return {
          name:
            item.name?.trim() || "",

          price,

          quantity,

          // ONLY ITEM TOTAL
          total: price * quantity,
        };
      }
    );

    // ========================================================
    // UPDATE GROUP AS ONE ORDER
    // ========================================================

    const updatedOrder =
      await prisma.$transaction(
        async (tx) => {
          // --------------------------------------------------
          // MAIN ORDER
          // --------------------------------------------------

          const mainOrderId =
            existingOrders[0].id;

          // --------------------------------------------------
          // DELETE ITEMS FROM ALL ORDERS
          // --------------------------------------------------

          await tx.orderItem.deleteMany({
            where: {
              orderId: {
                in: finalOrderIds,
              },
            },
          });

          // --------------------------------------------------
          // DELETE EXTRA ORDERS
          //
          // Example:
          //
          // Order 1 = 45,500
          // Order 2 = 16,000
          //
          // After edit:
          //
          // Order 1 remains
          // Order 2 removed
          //
          // This prevents duplicate items.
          // --------------------------------------------------

          const extraOrderIds =
            finalOrderIds.filter(
              (id) => id !== mainOrderId
            );

          if (extraOrderIds.length > 0) {
            await tx.order.deleteMany({
              where: {
                id: {
                  in: extraOrderIds,
                },
              },
            });
          }

          // --------------------------------------------------
          // UPDATE MAIN ORDER
          // --------------------------------------------------

          const order =
            await tx.order.update({
              where: {
                id: mainOrderId,
              },

              data: {
                customerName,

                // ⭐ DO NOT RECALCULATE
                // ⭐ SAVE MANUAL TOTAL
                total,

                items: {
                  create: formattedItems,
                },
              },

              include: {
                items: true,
                customer: true,
              },
            });

          return order;
        }
      );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,

      order: {
        ...updatedOrder,

        total: Number(
          updatedOrder.total || 0
        ),

        items:
          updatedOrder.items.map(
            (item: any) => ({
              ...item,

              price: Number(
                item.price || 0
              ),

              quantity: Number(
                item.quantity || 0
              ),

              total: Number(
                item.total || 0
              ),
            })
          ),
      },

      message:
        "Customer order group updated successfully",
    });
  } catch (error: any) {
    console.error(
      "PUT Orders API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to update order group",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - DELETE ALL ORDERS OF CUSTOMER
// ============================================================

export async function DELETE(
  req: NextRequest
) {
  const auth = requireAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await req.json();

    const customerName =
      body.customerName?.trim();

    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer name required",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // DELETE ITEMS FIRST
    // ========================================================

    await prisma.orderItem.deleteMany({
      where: {
        order: {
          customerName:
            customerName,
        },
      },
    });

    // ========================================================
    // DELETE ORDERS
    // ========================================================

    await prisma.order.deleteMany({
      where: {
        customerName:
          customerName,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "All customer orders deleted",
    });
  } catch (error: any) {
    console.error(
      "DELETE Orders API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to delete orders",
      },
      { status: 500 }
    );
  }
}