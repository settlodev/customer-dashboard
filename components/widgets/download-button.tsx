
'use client';

import React, { useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DownloadButtonProps {
  orderNumber: string;
  isDownloadable?: boolean;
  fontFamily?: string;
  title:string
  fontSize?: {
    header?: string;
    body?: string;
    footer?: string;
  };
  fontWeight?: {
    header?: string;
    body?: string;
    footer?: string;
  };
}

const DownloadButton = ({ 
  orderNumber, 
  isDownloadable,
  title,
  fontFamily = 'system-ui, -apple-system, sans-serif', 
  fontSize = {
    header: '14px',
    body: '10px', 
    footer: '8px'
  },
  fontWeight = {
    header: '600',
    body: 'normal',
    footer: 'normal'
  }
}: DownloadButtonProps) => {
  const handleDownload = useCallback(async () => {
    const receipt = document.getElementById('receipt-content');
    if (receipt) {
      try {
        // Show loading state
        const originalButton = document.querySelector('[data-download-button]') as HTMLButtonElement;
        if (originalButton) {
          originalButton.disabled = true;
          originalButton.innerHTML = '<div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> Generating...';
        }

        // Store original styles
        const originalStyles = {
          width: receipt.style.width,
          maxWidth: receipt.style.maxWidth,
          margin: receipt.style.margin,
          padding: receipt.style.padding,
          transform: receipt.style.transform,
          position: receipt.style.position,
          backgroundColor: receipt.style.backgroundColor,
        };

        // Optimize for PDF generation
        receipt.style.width = '794px';
        receipt.style.maxWidth = '794px';
        receipt.style.margin = '0';
        receipt.style.padding = '0';
        receipt.style.transform = 'none';
        receipt.style.position = 'relative';
        receipt.style.backgroundColor = 'white';

        await new Promise(resolve => setTimeout(resolve, 100));

        // Wait for images to load
        const images = receipt.querySelectorAll('img');
        await Promise.all(Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 3000);
          });
        }));

        const canvas = await html2canvas(receipt, {
          scale: 1.5,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          width: 794,
          height: receipt.scrollHeight,
          windowWidth: 1200,
          windowHeight: receipt.scrollHeight + 100,
          scrollX: 0,
          scrollY: 0,
          imageTimeout: 15000,
          removeContainer: true,
          foreignObjectRendering: false,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.getElementById('receipt-content');
            if (clonedElement) {
              // Apply clean styling
              clonedElement.style.width = '794px';
              clonedElement.style.maxWidth = '794px';
              clonedElement.style.margin = '0';
              clonedElement.style.padding = '0';
              clonedElement.style.transform = 'none';
              clonedElement.style.position = 'relative';
              clonedElement.style.backgroundColor = 'white';
              clonedElement.style.fontFamily = fontFamily;
              clonedElement.style.color = '#111827';
              
              // Fix all elements
              const allElements = clonedElement.querySelectorAll('*');
              allElements.forEach((el: any) => {
                if (el.style) {
                  el.style.visibility = 'visible';
                  el.style.opacity = '1';
                  el.style.printColorAdjust = 'exact';
                  el.style.webkitPrintColorAdjust = 'exact';
                  el.style.colorAdjust = 'exact';
                  el.style.fontFamily = fontFamily;
                }
              });

              // Company name and main headers
              const mainHeaders = clonedElement.querySelectorAll('h1, h2, h3');
              mainHeaders.forEach((header: any) => {
                if (header.textContent?.includes('RECEIPT') || header.textContent?.includes('INVOICE')) {
                  header.style.fontSize = '24px';
                  header.style.fontWeight = '700';
                  header.style.color = '#111827';
                } else {
                  header.style.fontSize = fontSize.header;
                  header.style.fontWeight = fontWeight.header;
                  header.style.color = '#374151';
                }
                header.style.fontFamily = fontFamily;
                header.style.lineHeight = '1.2';
              });

              // Body text and paragraphs
              const bodyElements = clonedElement.querySelectorAll('p, span, div, td');
              bodyElements.forEach((el: any) => {
                if (!el.closest('h1, h2, h3, h4, h5, h6')) {
                  el.style.fontSize = fontSize.body;
                  el.style.fontWeight = fontWeight.body;
                  el.style.fontFamily = fontFamily;
                  el.style.lineHeight = '1.4';
                  
                  // Set appropriate colors based on content
                  if (el.classList.contains('text-gray-500') || el.classList.contains('text-gray-600')) {
                    el.style.color = '#6b7280';
                  } else if (el.classList.contains('text-gray-900')) {
                    el.style.color = '#111827';
                  } else if (el.classList.contains('text-green-600')) {
                    el.style.color = '#059669';
                  } else if (el.classList.contains('text-red-600')) {
                    el.style.color = '#dc2626';
                  } else {
                    el.style.color = '#374151';
                  }
                }
              });

              // Table styling
              const tables = clonedElement.querySelectorAll('table');
              tables.forEach((table: any) => {
                table.style.width = '100%';
                table.style.borderCollapse = 'collapse';
                table.style.fontFamily = fontFamily;

                // Table headers
                const headers = table.querySelectorAll('th');
                headers.forEach((th: any) => {
                  th.style.backgroundColor = '#f9fafb';
                  th.style.color = '#6b7280';
                  th.style.fontSize = '9px';
                  th.style.fontWeight = '600';
                  th.style.padding = '8px 12px';
                  th.style.borderBottom = '1px solid #e5e7eb';
                  th.style.textTransform = 'uppercase';
                  th.style.letterSpacing = '0.05em';
                });

                // Table cells
                const cells = table.querySelectorAll('td');
                cells.forEach((td: any) => {
                  td.style.fontSize = '10px';
                  td.style.padding = '8px 12px';
                  td.style.borderBottom = '1px solid #f3f4f6';
                  td.style.color = '#374151';
                  
                  // Bold amounts in last column
                  if (td.cellIndex === td.parentElement.children.length - 1) {
                    td.style.fontWeight = '500';
                    td.style.color = '#111827';
                  }
                });
              });

              // Status badges
              const badges = clonedElement.querySelectorAll('.bg-green-100, .bg-yellow-100, .bg-red-100');
              badges.forEach((badge: any) => {
                badge.style.padding = '4px 8px';
                badge.style.borderRadius = '9999px';
                badge.style.fontSize = '8px';
                badge.style.fontWeight = '500';
                
                if (badge.classList.contains('bg-green-100')) {
                  badge.style.backgroundColor = '#dcfce7';
                  badge.style.color = '#166534';
                } else if (badge.classList.contains('bg-yellow-100')) {
                  badge.style.backgroundColor = '#fef3c7';
                  badge.style.color = '#92400e';
                } else if (badge.classList.contains('bg-red-100')) {
                  badge.style.backgroundColor = '#fee2e2';
                  badge.style.color = '#991b1b';
                }
              });

              // Footer text
              const footerElements = clonedElement.querySelectorAll('[class*="text-center"] p, .text-sm');
              footerElements.forEach((el: any) => {
                if (el.textContent?.includes('Thank you') || 
                    el.textContent?.includes('generated on') || 
                    el.textContent?.includes('Powered by')) {
                  el.style.fontSize = fontSize.footer;
                  el.style.fontWeight = fontWeight.footer;
                  el.style.color = '#6b7280';
                  el.style.fontFamily = fontFamily;
                }
              });

              // Ensure proper spacing and borders
              const borderElements = clonedElement.querySelectorAll('[class*="border"]');
              borderElements.forEach((el: any) => {
                if (el.classList.contains('border-gray-200')) {
                  el.style.borderColor = '#e5e7eb';
                } else if (el.classList.contains('border-gray-300')) {
                  el.style.borderColor = '#d1d5db';
                }
              });

              // Background colors
              const bgElements = clonedElement.querySelectorAll('[class*="bg-gray"]');
              bgElements.forEach((el: any) => {
                if (el.classList.contains('bg-gray-50')) {
                  el.style.backgroundColor = '#f9fafb';
                } else if (el.classList.contains('bg-gray-100')) {
                  el.style.backgroundColor = '#f3f4f6';
                }
                el.style.printColorAdjust = 'exact';
                el.style.webkitPrintColorAdjust = 'exact';
              });
            }
          }
        });

        // Restore original styles
        Object.assign(receipt.style, originalStyles);

        // Generate PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        // Add image to PDF with proper margins
        const margin = 10;
        const maxWidth = pdfWidth - (margin * 2);
        const maxHeight = 297 - (margin * 2); // A4 height minus margins
        
        if (pdfHeight <= maxHeight) {
          // Single page
          pdf.addImage(imgData, 'JPEG', margin, margin, maxWidth, pdfHeight, undefined, 'MEDIUM');
        } else {
          // Multiple pages
          const totalPages = Math.ceil(pdfHeight / maxHeight);
          
          for (let page = 0; page < totalPages; page++) {
            if (page > 0) {
              pdf.addPage();
            }
            
            const sourceY = (page * maxHeight * canvas.height) / pdfHeight;
            const sourceHeight = Math.min(
              (maxHeight * canvas.height) / pdfHeight,
              canvas.height - sourceY
            );
            
            const pageCanvas = document.createElement('canvas');
            const pageCtx = pageCanvas.getContext('2d');
            
            pageCanvas.width = canvas.width;
            pageCanvas.height = sourceHeight;
            
            if (pageCtx) {
              pageCtx.drawImage(
                canvas,
                0, sourceY, canvas.width, sourceHeight,
                0, 0, canvas.width, sourceHeight
              );
              
              const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
              const pageHeight = (sourceHeight * maxWidth) / canvas.width;
              
              pdf.addImage(pageImgData, 'JPEG', margin, margin, maxWidth, pageHeight, undefined, 'MEDIUM');
            }
          }
        }
        
        const fileName = `receipt-${orderNumber}.pdf`;
        pdf.save(fileName);

        // Reset button state
        if (originalButton) {
          originalButton.disabled = false;
          originalButton.innerHTML = '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2-2z"></path></svg>Download';
        }

      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('There was an error generating the PDF. Please try again.');
        
        const originalButton = document.querySelector('[data-download-button]') as HTMLButtonElement;
        if (originalButton) {
          originalButton.disabled = false;
          originalButton.innerHTML = '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2-2z"></path></svg>Download';
        }
      }
    }
  }, [orderNumber, fontFamily, fontSize, fontWeight]);

  useEffect(() => {
    if (isDownloadable) {
      handleDownload();
    }
  }, [isDownloadable, handleDownload]);

  return (
    <button
      data-download-button
      onClick={handleDownload}
      className="flex justify-center items-center gap-2 lg:w-[50%] w-full px-4 py-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download size={16} />
      {title}
    </button>
  );
};

export default DownloadButton;