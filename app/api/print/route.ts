import { NextRequest, NextResponse } from 'next/server';
import ThermalPrinter from 'node-thermal-printer';

export async function POST(req: NextRequest) {
  try {
    const { cart, customerName, customerType } = await req.json();

    const printer = new ThermalPrinter({
      type: 'epson',           
      interface: 'usb',
      characterSet: 'UTF8',
      removeSpecialCharacters: false,
    });

    // Header
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println("بسم اللہ آئرن سٹور");
    printer.setTextSize(0, 0);
    printer.bold(false);
    printer.println("====================================");

    printer.alignLeft();
    printer.println(`Customer: ${customerName || "Walk-in"}`);
    printer.println(`Type: ${customerType === "regular" ? "Regular" : "Walking"}`);
    printer.println(`Date: ${new Date().toLocaleDateString("en-GB")}`);
    printer.println("====================================");

    // Items
    let grandTotal = 0;
    cart.forEach((item: any) => {
      const price = Number(item.price || 0);
      const qty = Number(item.quantity || 0);
      const total = price * qty;
      grandTotal += total;

      printer.println(item.name);
      printer.println(`Rs ${price} × ${qty} = Rs ${total}`);
    });

    printer.println("====================================");
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.alignRight();
    printer.println(`Total: Rs ${grandTotal}`);
    printer.setTextSize(0, 0);
    printer.bold(false);

    // Footer
    printer.alignLeft();
    printer.feed(1);
    printer.println("Shop Number: 0307-1038571");
    printer.println("Sign: ________________");
    printer.alignCenter();
    printer.feed(1);
    printer.println("بسم اللہ آئرن سٹور");
    printer.println("جمالپور نزد ماہر والا پٹرول پمپ");
    printer.println("قائم پور روڈ");
    printer.feed(3);

    await printer.cut();
    await printer.execute();

    return NextResponse.json({ success: true, message: "Printed" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Printer error" 
    }, { status: 500 });
  }
}