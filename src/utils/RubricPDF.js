/**
 * Rubric PDF Generation Utility
 * 
 * Generates printer-friendly PDF of rubrics for teachers
 * Uses html2pdf library (must be included in HTML head)
 * 
 * Usage:
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
 */

// ============================================================================
// PRINT STYLES (Add to main CSS or include in <style> tag)
// ============================================================================

const PRINT_STYLES = `
  @media print {
    body {
      margin: 0;
      padding: 0;
      background: white;
    }

    .no-print {
      display: none !important;
    }

    .rubric-container {
      page-break-inside: avoid;
      padding: 0;
      margin: 0;
    }

    .rubric-header {
      page-break-after: avoid;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #D9C9B0;
    }

    .rubric-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      color: #3A3226;
    }

    .rubric-header p {
      margin: 0.25rem 0;
      font-size: 0.95rem;
      color: #6B5D4E;
    }

    .category-block {
      page-break-inside: avoid;
      margin-bottom: 2rem;
      padding: 0;
    }

    .category-header {
      page-break-after: avoid;
      background: #F5EFE6;
      border: 2px solid #D9C9B0;
      border-radius: 0; /* Remove for cleaner print */
      padding: 1rem;
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
    }

    .category-header h2 {
      margin: 0;
      font-size: 1.3rem;
      color: #3A3226;
    }

    .category-points {
      font-size: 1rem;
      font-weight: 700;
      color: #2E6DA4;
      padding: 0.25rem 0.75rem;
      border: 2px solid #2E6DA4;
    }

    .criterion {
      page-break-inside: avoid;
      background: white;
      border: 1px solid #D9C9B0;
      border-left: 4px solid #2E6DA4;
      padding: 1rem;
      margin-bottom: 0.75rem;
      page-break-after: avoid;
    }

    .criterion h3 {
      margin: 0 0 0.3rem 0;
      font-size: 1rem;
      color: #3A3226;
      font-weight: 700;
    }

    .criterion .points {
      font-weight: 600;
      color: #2E6DA4;
      font-size: 0.9rem;
      margin-left: 0.5rem;
    }

    .criterion p {
      margin: 0.5rem 0 0 0;
      font-size: 0.95rem;
      color: #6B5D4E;
      line-height: 1.6;
    }

    .rubric-footer {
      page-break-inside: avoid;
      background: #EDE3D4;
      border: 2px solid #D9C9B0;
      padding: 1.5rem;
      text-align: center;
      margin-top: 2rem;
    }

    .rubric-footer p {
      margin: 0;
      font-size: 1rem;
      color: #3A3226;
    }

    .total-points {
      font-size: 1.8rem;
      font-weight: 700;
      color: #2E6DA4;
      margin-top: 0.5rem;
    }

    /* Avoid widows/orphans */
    h1, h2, h3 { page-break-after: avoid; }
    h1 + p, h2 + p, h3 + p { page-break-before: avoid; }
  }
`;

// ============================================================================
// PDF GENERATION FUNCTION
// ============================================================================

/**
 * Generates a PDF of the rubric
 * 
 * @param {HTMLElement} element - The element to convert to PDF
 * @param {string} filename - Filename for the PDF
 * @param {string} mode - 'simple' or 'detailed' for title
 */
export function generateRubricPDF(element, filename, mode = 'detailed') {
  if (!window.html2pdf) {
    console.error('html2pdf library not loaded');
    alert('PDF generation library not available. Please refresh and try again.');
    return;
  }

  const opt = {
    margin: [10, 10, 10, 10], // mm margins: [top, left, bottom, right]
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, logging: false },
    jsPDF: {
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  window.html2pdf().set(opt).from(element).save();
}

// ============================================================================
// SIMPLE PDF GENERATION (No html2pdf dependency)
// Alternative: Generate printable HTML and let browser handle PDF
// ============================================================================

/**
 * Opens a print dialog for the rubric
 * Browser's built-in print-to-PDF works well
 */
export function printRubricToPDF(element) {
  // Clone element to avoid modifying the original
  const printElement = element.cloneNode(true);

  // Remove non-printable elements
  const noPrintElements = printElement.querySelectorAll('.no-print');
  noPrintElements.forEach(el => el.remove());

  // Create a temporary container
  const container = document.createElement('div');
  container.style.display = 'none';
  container.appendChild(printElement);
  document.body.appendChild(container);

  // Trigger browser print dialog
  window.print();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(container);
  }, 100);
}

// ============================================================================
// REACT HOOK: useRubricPDF
// ============================================================================

import { useCallback } from 'react';

export function useRubricPDF() {
  const downloadPDF = useCallback((element, filename, mode = 'detailed') => {
    try {
      if (window.html2pdf) {
        generateRubricPDF(element, filename, mode);
      } else {
        // Fallback to print dialog
        printRubricToPDF(element);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  }, []);

  return { downloadPDF };
}

// ============================================================================
// EXAMPLE USAGE IN REACT COMPONENT
// ============================================================================

/*
import { useRubricPDF } from './utils/rubricPDF';

export function RubricViewer({ rubric }) {
  const { downloadPDF } = useRubricPDF();

  const handleDownload = () => {
    const element = document.getElementById('rubric-print-content');
    downloadPDF(element, `${rubric.name}-rubric.pdf`);
  };

  return (
    <div>
      <button onClick={handleDownload}>📥 Download PDF</button>
      <div id="rubric-print-content">
        {/* Rubric content here */}
      </div>
    </div>
  );
}
*/

// ============================================================================
// HTML HEAD REQUIREMENTS
// ============================================================================

/*
Include in your HTML <head>:

<!-- For html2pdf library (recommended) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

<!-- Print styles -->
<style>
  {PRINT_STYLES}
</style>
*/

// ============================================================================
// IMPLEMENTATION IN Next.js pages/_document.js
// ============================================================================

/*
import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
*/

// ============================================================================
// STANDALONE PRINT STYLESHEET (if using separate CSS file)
// Save as: public/print.css
// ============================================================================

export const STANDALONE_PRINT_CSS = `
/* Rubric Print Styles */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    margin: 0;
    padding: 0;
    line-height: 1.5;
    font-family: Georgia, serif;
    background: white;
  }

  .no-print {
    display: none !important;
  }

  .rubric-print {
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  .rubric-page-break {
    page-break-before: always;
  }

  .rubric-avoid-break {
    page-break-inside: avoid;
  }

  /* Header */
  .rubric-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #333;
  }

  .rubric-header h1 {
    font-size: 2em;
    margin: 0 0 0.5rem 0;
    color: #000;
  }

  .rubric-header .subtitle {
    font-size: 0.9em;
    color: #666;
    margin: 0.25rem 0;
  }

  /* Categories */
  .rubric-category {
    margin-bottom: 1.5rem;
    page-break-inside: avoid;
  }

  .rubric-category-header {
    background: #f5f5f5;
    border: 1px solid #ccc;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
    font-weight: bold;
    font-size: 1.1em;
  }

  .rubric-category-points {
    float: right;
    font-weight: bold;
    color: #333;
  }

  /* Criteria */
  .rubric-criterion {
    border-left: 3px solid #666;
    border-bottom: 1px solid #ddd;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    page-break-inside: avoid;
  }

  .rubric-criterion-level {
    font-weight: bold;
    margin-bottom: 0.25rem;
  }

  .rubric-criterion-points {
    float: right;
    font-weight: bold;
    color: #333;
  }

  .rubric-criterion-descriptor {
    font-size: 0.95em;
    color: #333;
    line-height: 1.5;
    margin: 0.25rem 0 0 0;
  }

  /* Footer */
  .rubric-footer {
    border-top: 2px solid #333;
    margin-top: 1.5rem;
    padding-top: 1rem;
    text-align: center;
    font-weight: bold;
  }

  .rubric-total {
    font-size: 1.5em;
    color: #000;
  }

  /* Remove margins on print */
  h1, h2, h3, p {
    orphans: 3;
    widows: 3;
  }
}
`;