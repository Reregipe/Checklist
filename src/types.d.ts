declare module 'jspdf';

declare module 'jspdf-autotable' {
  import jsPDF from 'jspdf';

  export interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    styles?: any;
    headStyles?: any;
    columnStyles?: Record<number, any>;
    margin?: { left?: number; right?: number; top?: number; bottom?: number };
  }

  export default function autoTable(
    doc: jsPDF,
    options: AutoTableOptions,
  ): void;
}
