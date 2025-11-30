/// <reference types="vite/client" />

declare namespace JSX {
    interface IntrinsicElements {
        'lord-icon': any;
    }
}

declare namespace React {
    namespace JSX {
        interface IntrinsicElements {
            'lord-icon': any;
        }
    }
}

// Type declarations for document conversion libraries
declare module 'mammoth' {
    interface ConversionResult {
        value: string;
        messages: Array<{ type: string; message: string }>;
    }
    
    interface Options {
        arrayBuffer?: ArrayBuffer;
    }
    
    export function convertToHtml(options: Options): Promise<ConversionResult>;
}

declare module 'html2pdf.js' {
    interface Html2PdfOptions {
        margin?: number | number[];
        filename?: string;
        image?: { type: string; quality: number };
        html2canvas?: { scale?: number; useCORS?: boolean; letterRendering?: boolean };
        jsPDF?: { unit: string; format: string; orientation: string };
    }
    
    interface Html2Pdf {
        set(options: Html2PdfOptions): Html2Pdf;
        from(element: HTMLElement): Html2Pdf;
        outputPdf(type: 'blob'): Promise<Blob>;
    }
    
    function html2pdf(): Html2Pdf;
    export default html2pdf;
}
