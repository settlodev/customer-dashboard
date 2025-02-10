'use client';

import React from 'react';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DownloadButtonProps {
  orderNumber: string;
}

const DownloadButton = ({ orderNumber }: DownloadButtonProps) => {
  const handleDownload = async () => {
    const receipt = document.getElementById('receipt-content');
    if (receipt) {
      try {
        // First, get the original dimensions
        const originalWidth = receipt.offsetWidth;
        // const originalHeight = receipt.offsetHeight;

        // Temporarily modify the element for better capture
        receipt.style.width = '600px'; // Force a consistent width
        receipt.style.margin = '0';
        receipt.style.padding = '0';

        // Configure html2canvas with mobile-friendly settings
        const canvas = await html2canvas(receipt, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 600, // Force a consistent width
          height: receipt.scrollHeight,
          windowWidth: 600,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.getElementById('receipt-content');
            if (clonedElement) {
              clonedElement.style.width = '600px';
              clonedElement.style.margin = '0';
              clonedElement.style.transform = 'none';
              clonedElement.style.maxWidth = 'none';
            }
          }
        });

        // Restore original dimensions
        receipt.style.width = `${originalWidth}px`;
        receipt.style.margin = '';
        receipt.style.padding = '';

        // Create PDF with mobile-friendly dimensions
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Add the image maintaining aspect ratio
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        // Save the PDF
        pdf.save(`receipt-${orderNumber}.pdf`);

      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('There was an error generating the PDF. Please try again.');
      }
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors"
    >
      <Download className="w-4 h-4" />
      Download Receipt
    </button>
  );
};

export default DownloadButton;