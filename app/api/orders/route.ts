import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../.././lib/prisma";
import { requireAuth } from "../../lib/authGuard";

export async function POST(req:NextRequest) {
  const auth = requireAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await req.json();

    const items = body.items.map((item: any) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);

      return {
        name: item.name,
        price,
        quantity,
        total: price * quantity,
      };
    });

    const grandTotal = items.reduce(
      (sum: number, item: any) => sum + item.total,
      0
    );

    const order = await prisma.order.create({
      data: {
        customerName: body.customerName,

        total: grandTotal,

        // CUSTOMER CONNECT
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
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);

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
      },
      take: 50,           // ← Add this (limit results)
      // skip: 0,         // for pagination later
    });

    const formattedOrders = orders.map((order: any) => ({
      ...order,
      items: order.items.map((item: any) => ({
        ...item,
        createdAt: item.createdAt || order.createdAt,
      })),
    }));

    return Response.json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error: any) {
    console.error("Orders API Error:", error);
    return Response.json({
      success: false,
      message: error.message,
      code: error.code,
    }, { status: 500 });
  }
}
// export async function GET() {
//   try {
//     const orders = await prisma.order.findMany({
//       orderBy: {
//         createdAt: "desc",
//       },
//       include: {
//         items: true,
//       },
//     });

//     const formattedOrders = orders.map((order: any) => ({
//       ...order,
//       items: order.items.map((item: any) => ({
//         ...item,
//         createdAt: item.createdAt || order.createdAt,
//       })),
//     }));

//     return Response.json({
//       success: true,
//       orders: formattedOrders,
//     });
//   } catch (error) {
//     console.log(error);

//     return Response.json({
//       success: false,
//     });
//   }
// }

// app/api/orders/route.ts  (ya jahan bhi aapka route hai)

export async function PUT(req: NextRequest) {
  const auth = requireAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }
  try {
    const body = await req.json();
    const { orderId, customerName, items, total } = body;

    if (!customerName) {
      return NextResponse.json({ success: false, message: "Customer name is required" }, { status: 400 });
    }

    const formattedItems = (items || []).map((item: any) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return {
        name: item.name?.trim() || '',
        price,
        quantity,
        total: price * quantity,
      };
    });

    const finalTotal = Number(total) || 
      formattedItems.reduce((sum: number, item: any) => sum + item.total, 0);

    // === BEST SOLUTION: Delete ALL old orders of this customer ===
    await prisma.orderItem.deleteMany({
      where: {
        order: {
          customerName: customerName,
        },
      },
    });

    await prisma.order.deleteMany({
      where: { customerName: customerName },
    });

    // === Create ONE fresh order with updated items ===
    const newOrder = await prisma.order.create({
      data: {
        customerName: customerName.trim(),
        total: finalTotal,
        items: {
          create: formattedItems,
        },
      },
      include: { items: true },
    });

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: "Order updated successfully (All old orders replaced)",
    });
  } catch (error: any) {
    console.error('PUT Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ================= FIXED DELETE =================
export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await req.json();
    const { customerName } = body;

    if (!customerName) {
      return NextResponse.json({ success: false, message: 'Customer name required' }, { status: 400 });
    }

    await prisma.orderItem.deleteMany({
      where: {
        order: { customerName: customerName }
      },
    });

    await prisma.order.deleteMany({
      where: { customerName: customerName },
    });

    return NextResponse.json({ success: true, message: 'All orders deleted' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}