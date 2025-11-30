import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';

export const convertImageToPDF = async (files: File[]): Promise<Blob> => {
    const doc = new jsPDF();

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file is an image
        if (!file.type.startsWith('image/')) {
            console.warn(`Skipping non-image file: ${file.name}`);
            continue;
        }

        if (i > 0) doc.addPage();

        try {
            const imgData = await readFileAsDataURL(file);
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Determine image format
            const format = file.type === 'image/png' ? 'PNG' : 'JPEG';
            
            doc.addImage(imgData, format, 0, 0, pdfWidth, pdfHeight);
        } catch (error) {
            console.error(`Error processing image ${file.name}:`, error);
            throw new Error(`Failed to process image: ${file.name}`);
        }
    }

    return doc.output('blob');
};

export const mergePDFs = async (files: File[]): Promise<Blob> => {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
        // Validate file is a PDF
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            console.warn(`Skipping non-PDF file: ${file.name}`);
            continue;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        } catch (error) {
            console.error(`Error processing PDF ${file.name}:`, error);
            throw new Error(`Failed to process PDF: ${file.name}. The file may be corrupted or password-protected.`);
        }
    }

    if (mergedPdf.getPageCount() === 0) {
        throw new Error('No valid PDF pages to merge');
    }

    const pdfBytes = await mergedPdf.save();
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
};

const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};
