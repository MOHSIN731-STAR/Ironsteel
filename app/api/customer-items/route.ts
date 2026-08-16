import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../lib/authGuard";

// ======================================================
// GET ALL CUSTOMER ITEMS
// ======================================================

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);

    if (auth instanceof NextResponse) {
      return auth;
    }

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
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// POST NEW CUSTOMER ITEM
// ======================================================

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);

    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = await request.json();

    const {
      customerName,
      item,
      quantity,
      price,
      paidPrice,
    } = body;

    // =========================
    // VALIDATION
    // =========================

    if (!customerName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          message: "Item is required",
        },
        {
          status: 400,
        }
      );
    }

    const newQuantity = Number(quantity) || 0;
    const newPrice = Number(price) || 0;
    const newPaidPrice = Number(paidPrice) || 0;

    if (newQuantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be greater than 0",
        },
        {
          status: 400,
        }
      );
    }

    if (newPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Price must be greater than 0",
        },
        {
          status: 400,
        }
      );
    }

    if (newPaidPrice > newQuantity * newPrice) {
      return NextResponse.json(
        {
          success: false,
          message: "Paid amount cannot be greater than total price",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // CALCULATIONS
    // =========================

    const totalPrice = newQuantity * newPrice;

    const remainingPrice =
      totalPrice - newPaidPrice;

    // =========================
    // CREATE
    // =========================

    const createdItem =
      await prisma.customerItem.create({
        data: {
          customerName: customerName.trim(),
          item,
          quantity: newQuantity,
          price: newPrice,
          totalPrice,
          paidPrice: newPaidPrice,
          remainingPrice,
        },
      });

    return NextResponse.json({
      success: true,
      message: "Customer item added successfully",
      data: createdItem,
    });
  } catch (error) {
    console.error("POST Customer Item Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create customer item",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// PUT UPDATE CUSTOMER ITEM
// ======================================================

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

    // =========================
    // ID VALIDATION
    // =========================

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "id is required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // FIND EXISTING
    // =========================

    const existingItem =
      await prisma.customerItem.findUnique({
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
        {
          status: 404,
        }
      );
    }

    // =========================
    // NEW VALUES
    // =========================

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

    // =========================
    // VALIDATION
    // =========================

    if (newQuantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be greater than 0",
        },
        {
          status: 400,
        }
      );
    }

    if (newPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Price must be greater than 0",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // CALCULATIONS
    // =========================

    const totalPrice =
      newQuantity * newPrice;

    const remainingPrice =
      totalPrice - newPaidPrice;

    if (newPaidPrice > totalPrice) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Paid amount cannot be greater than total price",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // UPDATE
    // =========================

    const updatedItem =
      await prisma.customerItem.update({
        where: {
          id: Number(id),
        },

        data: {
          customerName:
            customerName !== undefined
              ? customerName.trim()
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
      message:
        "Customer item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error(
      "PUT Customer Item Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update customer item",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// UPDATE OVERALL CUSTOMER PRICE
// ======================================================

export async function PATCH(request: NextRequest) {
  try {
    const auth = requireAuth(request);

    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = await request.json();

    const {
      customerName,
      overallTotal,
      overallPaid,
      overallRemaining,
    } = body;

    // =========================
    // VALIDATION
    // =========================

    if (!customerName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name is required",
        },
        {
          status: 400,
        }
      );
    }

    const total = Number(overallTotal);
    const paid = Number(overallPaid);
    const remaining = Number(overallRemaining);

    if (
      Number.isNaN(total) ||
      Number.isNaN(paid) ||
      Number.isNaN(remaining)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid overall values",
        },
        {
          status: 400,
        }
      );
    }

    if (total < 0 || paid < 0 || remaining < 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Overall values cannot be negative",
        },
        {
          status: 400,
        }
      );
    }

    if (paid > total) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Overall paid cannot be greater than overall total",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // CALCULATE REMAINING
    // =========================

    const calculatedRemaining =
      total - paid;

    // =========================
    // FIND CUSTOMER RECORDS
    // =========================

    const customerItems =
      await prisma.customerItem.findMany({
        where: {
          customerName:
            customerName.trim(),
        },
      });

    if (customerItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer records not found",
        },
        {
          status: 404,
        }
      );
    }

    // =========================
    // SAVE OVERALL VALUES
    // ON ALL CUSTOMER RECORDS
    // =========================

    await prisma.customerItem.updateMany({
      where: {
        customerName:
          customerName.trim(),
      },

      data: {
        overallTotal: total,
        overallPaid: paid,
        overallRemaining:
          calculatedRemaining,
      },
    });

    return NextResponse.json({
      success: true,

      message:
        "Overall customer price updated successfully",

      data: {
        customerName:
          customerName.trim(),

        overallTotal: total,

        overallPaid: paid,

        overallRemaining:
          calculatedRemaining,
      },
    });
  } catch (error) {
    console.error(
      "PATCH Overall Customer Price Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update overall customer price",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// DELETE CUSTOMER ITEM
// ======================================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = requireAuth(request);

    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = await request.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "id is required",
        },
        {
          status: 400,
        }
      );
    }

    const existingItem =
      await prisma.customerItem.findUnique({
        where: {
          id: Number(id),
        },
      });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer item not found",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.customerItem.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Customer item deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE Customer Item Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete customer item",
      },
      {
        status: 500,
      }
    );
  }
}