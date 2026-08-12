import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../lib/authGuard";

// ==========================
// GET ALL CUSTOMER ITEMS
// ==========================
export async function GET(request: NextRequest) {
   const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }
  try {
    const items = await prisma.customerItem.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("GET Customer Items Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customer items",
      },
      { status: 500 }
    );
  }
}

// ==========================
// POST CUSTOMER ITEM
// ==========================
export async function POST(request: NextRequest) {
   const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }
  try {
    const body = await request.json();

    const {
      customerName,
      item,
      quantity,
      price,
      paidPrice = 0,
    } = body;

    if (
      !customerName ||
      !item ||
      quantity === undefined ||
      price === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "customerName, item, quantity and price are required",
        },
        { status: 400 }
      );
    }

    const totalPrice = Number(quantity) * Number(price);
    const paid = Number(paidPrice);
    const remainingPrice = totalPrice - paid;

    const newItem = await prisma.customerItem.create({
      data: {
        customerName,
        item,
        quantity: Number(quantity),
        price: Number(price),
        totalPrice,
        paidPrice: paid,
        remainingPrice,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Customer item created successfully",
        data: newItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Customer Item Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create customer item",
      },
      { status: 500 }
    );
  }
}

// ==========================
// UPDATE CUSTOMER ITEM
// ==========================
export async function PUT(request: NextRequest) {
  try {
     const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }
    const body = await request.json();

    const {
      id,
      customerName,
      item,
      quantity,
      price,
      paidPrice,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "id is required",
        },
        { status: 400 }
      );
    }

    const existingItem = await prisma.customerItem.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer item not found",
        },
        { status: 404 }
      );
    }

    const newQuantity =
      quantity !== undefined
        ? Number(quantity)
        : existingItem.quantity;

    const newPrice =
      price !== undefined
        ? Number(price)
        : existingItem.price;

    const newPaidPrice =
      paidPrice !== undefined
        ? Number(paidPrice)
        : existingItem.paidPrice;

    const totalPrice = newQuantity * newPrice;
    const remainingPrice = totalPrice - newPaidPrice;

    const updatedItem = await prisma.customerItem.update({
      where: {
        id: Number(id),
      },
      data: {
        customerName:
          customerName !== undefined
            ? customerName
            : existingItem.customerName,

        item:
          item !== undefined
            ? item
            : existingItem.item,

        quantity: newQuantity,
        price: newPrice,
        totalPrice,
        paidPrice: newPaidPrice,
        remainingPrice,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Customer item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("PUT Customer Item Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update customer item",
      },
      { status: 500 }
    );
  }
}

// ==========================
// DELETE CUSTOMER ITEM
// ==========================
export async function DELETE(request: NextRequest) {
   const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "id is required",
        },
        { status: 400 }
      );
    }

    const existingItem = await prisma.customerItem.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer item not found",
        },
        { status: 404 }
      );
    }

    await prisma.customerItem.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Customer item deleted successfully",
    });
  } catch (error) {
    console.error("DELETE Customer Item Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete customer item",
      },
      { status: 500 }
    );
  }
}