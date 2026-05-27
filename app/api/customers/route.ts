import { NextResponse, NextRequest } from "next/server";
import { prisma } from "../.././lib/prisma";



// ✅ POST: New customer create
export async function POST(request:NextRequest) {
  try {
    const body = await request.json();

    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      );
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name,
      },
    });

    return NextResponse.json({
      success: true,
      data: newCustomer,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { success: false, message: 'Server Error' },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    const customers = await prisma.customer.findMany();

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
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID required" },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Delete failed" },
      { status: 500 }
    );
  }
}