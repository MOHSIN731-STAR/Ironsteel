import { NextResponse, NextRequest } from "next/server";
import { prisma } from "../.././lib/prisma";
import { requireAuth } from "../../lib/authGuard";

// ==========================
// POST: New customer create
// ==========================
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Name is required",
        },
        { status: 400 }
      );
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      data: newCustomer,
    });
  } catch (error) {
    console.log("POST CUSTOMER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server Error",
      },
      { status: 500 }
    );
  }
}

// ==========================
// GET: All customers
// ==========================
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Customers fetched successfully",
      data: customers,
    });
  } catch (error) {
    console.error("GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customers",
      },
      { status: 500 }
    );
  }
}

// ==========================
// PUT: Update customer
// ==========================
export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();

    const { id, name } = body;

    // ID validation
    const customerId = Number(id);

    if (!id || !Number.isInteger(customerId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid customer ID is required",
        },
        { status: 400 }
      );
    }

    // Name validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Name is required",
        },
        { status: 400 }
      );
    }

    // Check customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (error) {
    console.error("PUT CUSTOMER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update customer",
      },
      { status: 500 }
    );
  }
}

// ==========================
// DELETE: Delete customer
// ==========================
export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id || !Number.isInteger(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid ID is required",
        },
        { status: 400 }
      );
    }

    // Check customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    await prisma.customer.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("DELETE CUSTOMER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Delete failed",
      },
      { status: 500 }
    );
  }
}