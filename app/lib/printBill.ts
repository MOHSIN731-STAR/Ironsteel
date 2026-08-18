export const PRINT_BILL_WIDTH_MM = 80;

export function pxToMm(px: number): number {
  return (px / 96) * 25.4;
}

function measureBillHeightMm(bill: HTMLElement): number {
  const rect = bill.getBoundingClientRect();
  return pxToMm(
    Math.ceil(Math.max(bill.scrollHeight, bill.offsetHeight, rect.height))
  );
}

const PRINT_BILL_STYLES = `
  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: white;
    font-family: Arial, Helvetica, sans-serif;
    font-size:13px;
line-height:1.35;
    font-weight: 750 !important;

    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

 .print-bill{
    width:${PRINT_BILL_WIDTH_MM}mm !important;

    min-width:${PRINT_BILL_WIDTH_MM}mm;
    max-width:${PRINT_BILL_WIDTH_MM}mm;

    margin:0 !important;

    padding:3mm 2mm;

    box-sizing:border-box;

    background:#fff;

    color:#000;

    page-break-inside:avoid;
    break-inside:avoid;

    page-break-after:avoid;
    break-after:avoid;
}

  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-bold { font-weight: 700; }
  .text-sm { font-size: 0.875rem; }
  .text-xs { font-size: 10px; }
  .text-gray-900 { color: #111827; }

  .mb-2 { margin-bottom: 0.5rem; }
  .mb-3 { margin-bottom: 0.75rem; }
  .mt-2 { margin-top: 0.5rem; }
  .mt-3 { margin-top: 0.75rem; }
  .mt-4 { margin-top: 1rem; }
  .mt-6 { margin-top: 1rem; }
  .pt-2 { padding-top: 0.5rem; }
  .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .p-3 { padding: 0.75rem; }

  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .justify-between { justify-content: space-between; }
  .gap-2 { gap: 0.5rem; }
  .w-full { width: 100%; }
  .w-1\\/4 { width: 25%; flex-shrink: 0; }

  .border-t { border-top: 1px solid #000; }
  .border-b { border-bottom: 1px solid #000; }
  .border { border: 1px solid #000; }
  .rounded-lg { border-radius: 0.5rem; }



  .print-footer {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .bill-row {
    page-break-inside: avoid;
    break-inside: avoid;
  }

h2{
    margin:0 0 2mm;
    text-align:center;
    font-size:22px;
    font-weight:700;
}
  p {
    margin: 0.5rem 0;
  }
`;

function buildPrintPageStyles(pageHeightMm: number): string {
  return `
    @page {
      size: ${PRINT_BILL_WIDTH_MM}mm ${pageHeightMm}mm auto;
      margin: 0;
    }

    html,
    body {
       margin: 0 !important;
  padding: 0 !important;

  width: ${PRINT_BILL_WIDTH_MM}mm !important;
  min-width: ${PRINT_BILL_WIDTH_MM}mm !important;
  max-width: ${PRINT_BILL_WIDTH_MM}mm !important;

  background: #fff;

  overflow: hidden;

  display: block;
    }

    .print-bill {
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-after: avoid;
      break-after: avoid;
    }
  `;
}

export function printBillFromElement(element: HTMLElement): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = `position:fixed;top:0;width:${PRINT_BILL_WIDTH_MM}mm;height:auto;border:0;left:0;opacity:0;pointer-events:none;`;
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;

  if (!win || !doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title></title>
  <style>${PRINT_BILL_STYLES}</style>
</head>
<body>
  <div class="print-bill">${element.innerHTML}</div>
</body>
</html>`);
  doc.close();

  const runPrint = () => {
    const bill = doc.querySelector(".print-bill") as HTMLElement | null;

    if (!bill) {
      iframe.remove();
      return;
    }

    const applyPageSize = (heightMm?: number) => {
      const pageHeightMm = heightMm ?? Math.ceil(measureBillHeightMm(bill));
      const pageStyle =
        doc.getElementById("print-page-size") ?? doc.createElement("style");
      pageStyle.id = "print-page-size";
      pageStyle.textContent = buildPrintPageStyles(pageHeightMm);

      if (!pageStyle.parentNode) {
        doc.head.appendChild(pageStyle);
      }

      return pageHeightMm;
    };

    let pageHeightMm = applyPageSize();
    void bill.offsetHeight;

    const finalHeightMm = Math.ceil(measureBillHeightMm(bill));
    if (finalHeightMm !== pageHeightMm) {
      applyPageSize(finalHeightMm);
    }

    const cleanup = () => {
      win.removeEventListener("afterprint", cleanup);
      setTimeout(() => iframe.remove(), 500);
    };

    win.addEventListener("afterprint", cleanup);
    win.focus();
    bill.style.width = `${PRINT_BILL_WIDTH_MM}mm`;
bill.style.margin = "0";
bill.style.padding = "3mm 2mm";

doc.body.style.margin = "0";
doc.body.style.padding = "0";

doc.documentElement.style.margin = "0";
doc.documentElement.style.padding = "0";

win.print();
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(runPrint, 50);
    });
  });
}