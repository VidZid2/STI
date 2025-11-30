// Document converters - all work offline without external services
export { convertDocxToPDF, type ConversionResult } from './docxToPdf';
export { convertPdfToDocx } from './pdfToDocx';
export { compressPDF, formatFileSize, type CompressionResult } from './compressPdf';
export { analyzeText, readTextFromFile, type TextStats } from './textAnalysis';
