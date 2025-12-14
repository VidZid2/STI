// Document converters - offline/local options
export { convertDocxToPDF, type ConversionResult } from './docxToPdf';
export { convertPdfToDocx } from './pdfToDocx';
export { compressPDF, formatFileSize, type CompressionResult } from './compressPdf';
export { analyzeText, readTextFromFile, type TextStats } from './textAnalysis';

// iLovePDF API Service - For Word→PDF, Image→PDF, Merge PDFs
// 5 accounts × 250 files = 1,250/month FREE!
export {
    convertDocxToPdfILovePDF,
    convertImagesToPdfILovePDF,
    mergePdfsILovePDF,
    isILovePDFConfigured,
    getApiStatus,
    getConfiguredKeyCount,
    getActiveKeyCount,
    resetFailedKeys,
    reloadApiKeys,
} from './ilovepdfService';

// Adobe PDF Services API - For PDF→Word (best quality!)
// 5 accounts × 500 files = 2,500/month FREE!
export {
    convertPdfToDocxAdobe,
    isAdobeConfigured,
    getAdobeApiStatus,
    getAdobeKeyCount,
    getAdobeActiveKeyCount,
    resetFailedAdobeKeys,
    reloadAdobeApiKeys,
} from './adobePdfService';

// LanguageTool API - Free grammar checking!
// 20 requests/minute, 75,000 characters/minute - No API key needed!
export {
    checkGrammar,
    applyFix,
    getLanguageToolStatus,
    getCategoryColor,
    getCategoryUnderlineStyle,
    IssueCategory,
    type GrammarIssue,
} from './languageToolService';
