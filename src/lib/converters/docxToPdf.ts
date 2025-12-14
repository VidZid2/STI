import mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';

export interface ConversionResult {
    blob: Blob;
    warnings: string[];
}

export const convertDocxToPDF = async (file: File): Promise<ConversionResult> => {
    const arrayBuffer = await file.arrayBuffer();

    // Convert DOCX to HTML using mammoth
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;
    const warnings = result.messages.map(m => m.message);

    // Create styled HTML container
    const styledHtml = `
        <div style="
            font-family: 'Times New Roman', Georgia, serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            max-width: 100%;
        ">
            <style>
                p { margin: 0 0 12pt 0; }
                h1 { font-size: 24pt; margin: 24pt 0 12pt 0; }
                h2 { font-size: 18pt; margin: 18pt 0 10pt 0; }
                h3 { font-size: 14pt; margin: 14pt 0 8pt 0; }
                ul, ol { margin: 0 0 12pt 24pt; }
                li { margin: 0 0 6pt 0; }
                table { border-collapse: collapse; margin: 12pt 0; width: 100%; }
                td, th { border: 1px solid #000; padding: 6pt; }
                img { max-width: 100%; height: auto; }
            </style>
            ${html}
        </div>
    `;

    // Create temporary element for conversion
    const element = document.createElement('div');
    element.innerHTML = styledHtml;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.width = '210mm'; // A4 width
    document.body.appendChild(element);

    try {
        // Convert HTML to PDF
        const pdfBlob = await html2pdf()
            .set({
                margin: [15, 15, 15, 15],
                filename: 'document.pdf',
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait'
                },
                // pagebreak option removed for compatibility
            })
            .from(element)
            .outputPdf('blob');

        return { blob: pdfBlob, warnings };
    } finally {
        document.body.removeChild(element);
    }
};
