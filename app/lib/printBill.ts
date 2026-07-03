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
    font-size: 14px;
    line-height: 1.5;
    font-weight: 750 !important;

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
    font-size: 2.5rem;
  }

  p {
    margin: 0.5rem 0;
  }
`;

function buildPrintPageStyles(pageHeightMm: number): string {
  return `
    @page {
      size: ${PRINT_BILL_WIDTH_MM}mm ${pageHeightMm}mm;
      margin: 0;
    }

    html,
    body {
      width: ${PRINT_BILL_WIDTH_MM}mm;
      height: ${pageHeightMm}mm;
      max-height: ${pageHeightMm}mm;
      margin: 0;
      padding: 0;
      overflow: hidden;
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
  iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${PRINT_BILL_WIDTH_MM}mm;height:auto;border:0;visibility:hidden`;
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
    win.print();
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(runPrint, 50);
    });
  });
}