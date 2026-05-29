import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../.././lib/prisma";


export async function POST(req:NextRequest) {
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
export async function GET() {
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
  try {
    const body = await req.json();
    const { orderId, customerName, items, total } = body;

    const id = Number(orderId);
    if (!id) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    const formattedItems = (items || []).map((item: any) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return {
        name: item.name?.trim(),
        price,
        quantity,
        total: price * quantity,
      };
    });

    const finalTotal = Number(total) || 
      formattedItems.reduce((sum: number, item: any) => sum + item.total, 0);

    // Delete old items
    await prisma.orderItem.deleteMany({
      where: { orderId: id },
    });

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        customerName,
        total: finalTotal,
        items: {
          create: formattedItems,
        },
      },
      include: { items: true },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('PUT Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ================= FIXED DELETE =================
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();

    const { customerName } = body;

    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          message: 'Customer name required',
        },
        { status: 400 }
      );
    }

    // Find all orders of customer
    const orders = await prisma.order.findMany({
      where: {
        customerName: customerName,
      },
      select: {
        id: true,
      },
    });

    const orderIds = orders.map((o) => o.id);

    // Delete all items first
    await prisma.orderItem.deleteMany({
      where: {
        orderId: {
          in: orderIds,
        },
      },
    });

    // Delete all orders
    await prisma.order.deleteMany({
      where: {
        customerName: customerName,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'All customer orders deleted',
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}