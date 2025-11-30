import { PDFDocument } from 'pdf-lib';

export interface CompressionResult {
    blob: Blob;
    originalSize: number;
    compressedSize: number;
    savings: number;
    savingsPercent: number;
}

export const compressPDF = async (file: File): Promise<CompressionResult> => {
    const originalSize = file.size;
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
    });
    
    // Remove all metadata to reduce size
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    pdfDoc.setCreationDate(new Date(0));
    pdfDoc.setModificationDate(new Date(0));
    
    // Save with maximum compression options
    const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,      // Enables object stream compression
        addDefaultPage: false,        // Don't add empty pages
        objectsPerTick: 100,          // Process more objects per tick for speed
    });
    
    const compressedSize = compressedBytes.length;
    const savings = originalSize - compressedSize;
    const savingsPercent = Math.round((savings / originalSize) * 100);
    
    return {
        blob: new Blob([compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
        originalSize,
        compressedSize,
        savings,
        savingsPercent: Math.max(0, savingsPercent), // Don't show negative savings
    };
};

// Helper to format file sizes
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
