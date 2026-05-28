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

export async function PUT(req:NextRequest) {
  try {
    const body = await req.json();
    const { orderId, customerName, items, total } = body;   // ← total bhi receive karo

    const id = Number(orderId);
    if (!id) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    // Format items
    const formattedItems = (items || []).map((item: any) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;

      return {
        name: item.name,
        price,
        quantity,
        total: price * quantity,
      };
    });

    // ✅ IMPORTANT: Frontend se aaya total use karo, warna items se calculate karo
    const finalTotal = Number(total) || 
      formattedItems.reduce((sum: number, item: any) => sum + item.total, 0);

    // Delete old items
    await prisma.orderItem.deleteMany({
      where: { orderId: id },
    });

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        customerName,
        total: finalTotal,           // ← Yahan frontend ka total save ho raha hai
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
    console.error(error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let orderId = searchParams.get("id");

    if (!orderId) {
      try {
        const body = await req.json();
        orderId = body.orderId || body.id;
      } catch {}
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    await prisma.order.delete({
      where: { id: Number(orderId) },   // Make sure it's number
    });

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { success: false, message: "Error deleting order" },
      { status: 500 }
    );
  }
}