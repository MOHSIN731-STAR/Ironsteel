"use client";


export const PRINT_BILL_WIDTH_MM = 80;
const SINGLE_PAGE_LIMIT_MM = 280;
const PAGE_HEIGHT_BUFFER_MM = 1;

export function pxToMm(px: number): number {
  return (px / 96) * 25.4;
}

function measureBillHeightMm(bill: HTMLElement): number {
  const rect = bill.getBoundingClientRect();
  return pxToMm(Math.ceil(Math.max(bill.scrollHeight, bill.offsetHeight, rect.height)));
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
    font-size: 14px;
    line-height: 1.4;
    height: auto;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-bill {
    width: ${PRINT_BILL_WIDTH_MM}mm;
    padding: 4mm 1.5mm 2mm;
    border: 1px dashed #000;
    border-radius: 8px;
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

  .note-box {
    width: 100%;
    height: 3rem;
    margin-top: 0.5rem;
    border: 1px solid #000;
    border-radius: 0.5rem;
  }

  .print-footer {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .bill-row {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
  }

  p {
    margin: 0.15rem 0;
  }
`;

function buildPrintPageStyles(
  fitsSinglePage: boolean,
  pageHeightMm: number
): string {
  const pageHeight = fitsSinglePage ? `${pageHeightMm}mm` : "auto";

  return `
    @page {
      size: ${PRINT_BILL_WIDTH_MM}mm ${pageHeight};
      margin: 0;
    }

    html,
    body {
      width: ${PRINT_BILL_WIDTH_MM}mm;
      margin: 0;
      padding: 0;
      ${
        fitsSinglePage
          ? `
      height: ${pageHeightMm}mm;
      max-height: ${pageHeightMm}mm;
      overflow: hidden;`
          : ""
      }
    }

    .print-bill {
      page-break-inside: ${fitsSinglePage ? "avoid" : "auto"};
      break-inside: ${fitsSinglePage ? "avoid" : "auto"};
    }
  `;
}

export function printBillFromElement(element: HTMLElement): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
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
  <title>Bill</title>
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

    const contentHeightMm = measureBillHeightMm(bill);
    const fitsSinglePage = contentHeightMm <= SINGLE_PAGE_LIMIT_MM;
    const pageHeightMm = Math.ceil(contentHeightMm + PAGE_HEIGHT_BUFFER_MM);

    const pageStyle = doc.createElement("style");
    pageStyle.textContent = buildPrintPageStyles(fitsSinglePage, pageHeightMm);
    doc.head.appendChild(pageStyle);

    void bill.offsetHeight;

    if (fitsSinglePage) {
      const finalHeightMm = Math.ceil(
        measureBillHeightMm(bill) + PAGE_HEIGHT_BUFFER_MM
      );

      if (finalHeightMm !== pageHeightMm) {
        pageStyle.textContent = buildPrintPageStyles(true, finalHeightMm);
      }
    }

    const cleanup = () => {
      win.removeEventListener("afterprint", cleanup);
      setTimeout(() => iframe.remove(), 500);
    };

    win.addEventListener("afterprint", cleanup);
    win.focus();
    win.print();
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(runPrint, 50);
    });
  });
}
