import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export async function exportToPDF(
  elementId: string,
  fileName: string
) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found');
    return;
  }

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    // Get image data as JPEG with reasonable quality (0.8 is standard best balance)
    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Create PDF with builtin compression enabled
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Add first page with FAST compression profile
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Add subsequent pages if the content is longer than one page
    while (heightLeft > 15) {
      position -= pageHeight; // Shift the Y position up by one page height
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(fileName);
  } catch (error) {
    console.error('Error exporting PDF:', error);
  }
}

export async function exportToPrinter(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found for printing');
    return;
  }

  // 1. Clean up any residual print-roots safely before starting
  const existing = document.getElementById('print-root');
  if (existing) {
    existing.parentNode?.removeChild(existing);
  }

  // 2. Create the unique container for print-mode
  const printRoot = document.createElement('div');
  printRoot.id = 'print-root';
  
  // 3. Deep clone the node so we don't detach existing React bindings
  const clonedContent = element.cloneNode(true);
  printRoot.appendChild(clonedContent);
  
  // 4. Append directly to body as sibling to application root
  document.body.appendChild(printRoot);

  // 5. Force synchronous reflow so the browser layout engine processes the DOM insertion before opening print dialog.
  // Critical for mobile Safari snapshotting correctness.
  void printRoot.offsetHeight;

  // 7. Execute browser print SYNCHRONOUSLY.
  // iOS Safari STRICTLY blocks window.print() if it occurs outside a direct user event chain.
  window.print();
}
