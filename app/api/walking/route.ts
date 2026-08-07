import { NextResponse, NextRequest } from "next/server";
import { prisma } from "../.././lib/prisma";
import { requireAuth } from "../../lib/authGuard";

// CREATE
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await req.json();
    const { customerName, items } = body;

    // 1. Calculate total safely
    const calculatedItems = items.map((item: any) => {
      const itemTotal =
        Number(item.price) * Number(item.quantity);

      return {
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        total: itemTotal,
      };
    });

    const total = calculatedItems.reduce(
      (acc: number, item: any) => acc + item.total,
      0
    );

    // 2. Save in DB
    const created = await prisma.walking.create({
      data: {
        customerName,
        total,
        items: {
          create: calculatedItems,
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Create failed" },
      { status: 500 }
    );
  }
}

// GET ALL
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const data = await prisma.walking.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}

// UPDATE
export async function PUT(req:NextRequest) {
  const auth = requireAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await req.json();
    const { orderId, customerName, items, total } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Delete old items first
    await prisma.walkingItem.deleteMany({
      where: { walkingId: Number(orderId) },
    });

    let calculatedTotal = 0;

    const updatedOrder = await prisma.walking.update({
      where: { id: Number(orderId) },
      data: {
        customerName,
        total: total || calculatedTotal, // agar frontend total bhej raha hai to use karo
        items: {
          create: items.map((item: any) => {
            const itemTotal = Number(item.price) * Number(item.quantity);
            calculatedTotal += itemTotal;

            return {
              name: item.name,
              price: Number(item.price),
              quantity: Number(item.quantity),
              total: itemTotal,
            };
          }),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Update Error:', error);
    return NextResponse.json(
      { success: false, error: 'Update failed' },
      { status: 500 }
    );
  }
}
// DELETE
export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    await prisma.walking.delete({
      where: { id: Number(orderId) },
    });

    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (error: any) {
    console.error('Delete Error:', error);
    return NextResponse.json(
      { success: false, error: 'Delete failed' },
      { status: 500 }
    );
  }
}