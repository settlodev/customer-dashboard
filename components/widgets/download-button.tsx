
'use client';

import React, { useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DownloadButtonProps {
  orderNumber: string;
  isDownloadable?: boolean;
  fontFamily?: string;
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
  fontFamily = 'Arial, sans-serif', 
  fontSize = {
    header: '24px',
    body: '14px',
    footer: '12px'
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
        };

        // Temporarily modify styles for better capture
        receipt.style.width = '794px';
        receipt.style.maxWidth = 'none';
        receipt.style.margin = '0';
        receipt.style.padding = '20px';
        receipt.style.transform = 'none';
        receipt.style.position = 'relative';

        await new Promise(resolve => setTimeout(resolve, 100));
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        receipt.offsetHeight;

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
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          width: 794,
          height: receipt.scrollHeight + 100,
          windowWidth: 1400,
          windowHeight: receipt.scrollHeight + 200,
          scrollX: 0,
          scrollY: 0,
          imageTimeout: 15000,
          removeContainer: true,
          foreignObjectRendering: false,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.getElementById('receipt-content');
            if (clonedElement) {
              // Apply consistent styling
              clonedElement.style.width = '794px';
              clonedElement.style.maxWidth = 'none';
              clonedElement.style.margin = '0';
              clonedElement.style.padding = '20px';
              clonedElement.style.transform = 'none';
              clonedElement.style.position = 'relative';
              clonedElement.style.display = 'block';
              clonedElement.style.backgroundColor = 'white';
              clonedElement.style.minHeight = receipt.scrollHeight + 'px';
              
              // Apply global font family to the entire receipt
              clonedElement.style.fontFamily = fontFamily;
              
              // Fix all elements visibility and colors
              const allElements = clonedElement.querySelectorAll('*');
              allElements.forEach((el: any) => {
                if (el.style) {
                  el.style.visibility = 'visible';
                  el.style.opacity = '1';
                  el.style.printColorAdjust = 'exact';
                  el.style.webkitPrintColorAdjust = 'exact';
                  el.style.colorAdjust = 'exact';
                  // Apply font family to all elements
                  el.style.fontFamily = fontFamily;
                }
              });

              // ENHANCED HEADER STYLING - Professional Invoice/Receipt Header
              const headerElements = clonedElement.querySelectorAll('.receipt-header, .invoice-header, [data-receipt-header]');
              headerElements.forEach((header: any) => {
                // Ensure gradient background is solid for PDF
                header.style.background = 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)';
                header.style.backgroundColor = '#10b981'; // Fallback
                header.style.color = '#ffffff';
                header.style.padding = '24px 32px';
                header.style.borderRadius = '12px 12px 0 0';
                header.style.printColorAdjust = 'exact';
                header.style.webkitPrintColorAdjust = 'exact';
                header.style.colorAdjust = 'exact';
                header.style.fontFamily = fontFamily;
                
                // Add subtle shadow for depth
                header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              });

              // Header company name/title styling
              const headerTitles = clonedElement.querySelectorAll('.receipt-header h1, .receipt-header .company-name, .invoice-header h1, .invoice-header .company-name, [data-receipt-header] h1, [data-receipt-header] .company-name');
              headerTitles.forEach((title: any) => {
                title.style.color = '#ffffff !important';
                title.style.fontSize = '18px';
                title.style.fontWeight = '700';
                title.style.fontFamily = fontFamily;
                title.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
                title.style.letterSpacing = '0.5px';
                title.style.margin = '0 0 4px 0';
              });

              // Header subtitle/tagline styling
              const headerSubtitles = clonedElement.querySelectorAll('.receipt-header .tagline, .receipt-header .subtitle, .invoice-header .tagline, .invoice-header .subtitle, [data-receipt-header] .tagline, [data-receipt-header] .subtitle');
              headerSubtitles.forEach((subtitle: any) => {
                subtitle.style.color = '#ffffff !important';
                subtitle.style.fontSize = '14px';
                subtitle.style.fontWeight = '400';
                subtitle.style.fontFamily = fontFamily;
                subtitle.style.margin = '0';
              });

              // Header contact info styling
              const headerContact = clonedElement.querySelectorAll('.receipt-header .contact-info, .invoice-header .contact-info, [data-receipt-header] .contact-info');
              headerContact.forEach((contact: any) => {
                contact.style.color = '#ffffff !important';
                contact.style.fontSize = '13px';
                contact.style.fontWeight = '400';
                contact.style.fontFamily = fontFamily;
      
                contact.style.lineHeight = '1.4';
              });

              // Invoice/Receipt number and date in header
              const headerMeta = clonedElement.querySelectorAll('.receipt-header .receipt-number, .receipt-header .receipt-date, .invoice-header .invoice-number, .invoice-header .invoice-date, [data-receipt-header] .receipt-number, [data-receipt-header] .receipt-date');
              headerMeta.forEach((meta: any) => {
                meta.style.color = '#ffffff !important';
                meta.style.fontSize = '16px';
                meta.style.fontWeight = '600';
                meta.style.fontFamily = fontFamily;
                meta.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                meta.style.padding = '8px 16px';
                meta.style.borderRadius = '6px';
                meta.style.border = '1px solid rgba(255, 255, 255, 0.2)';
              });

              // Force white color on ALL text within header sections
              const allHeaderText = clonedElement.querySelectorAll('.receipt-header *, .invoice-header *, [data-receipt-header] *');
              allHeaderText.forEach((textEl: any) => {
                if (textEl.textContent && textEl.textContent.trim()) {
                  textEl.style.color = '#ffffff !important';
                  textEl.style.fontFamily = fontFamily;
                }
              });

              // Header elements (h1, h2, h3, company name, etc.) - General styling for non-header sections
              const generalHeaderElements = clonedElement.querySelectorAll('h1:not(.receipt-header h1):not(.invoice-header h1):not([data-receipt-header] h1), h2, h3, h4, .text-2xl, .text-xl, .text-lg, [class*="font-bold"]:not(.receipt-header [class*="font-bold"]):not(.invoice-header [class*="font-bold"]), [class*="font-semibold"]:not(.receipt-header [class*="font-semibold"]):not(.invoice-header [class*="font-semibold"])');
              generalHeaderElements.forEach((el: any) => {
                el.style.fontFamily = fontFamily;
                el.style.fontSize = fontSize.header;
                el.style.fontWeight = fontWeight.header;
                el.style.color = el.style.color || '#1f2937'; // Default dark color for non-header elements
              });

              // Body text elements
              const bodyElements = clonedElement.querySelectorAll('p:not(.receipt-header p):not(.invoice-header p):not([data-receipt-header] p), span:not(.receipt-header span):not(.invoice-header span):not([data-receipt-header] span), div:not(.text-center):not(.receipt-header):not(.invoice-header):not([data-receipt-header]), td, th, .text-sm, .text-base');
              bodyElements.forEach((el: any) => {
                if (!el.classList.contains('text-lg') && !el.classList.contains('text-xl') && !el.classList.contains('text-2xl')) {
                  el.style.fontFamily = fontFamily;
                  el.style.fontSize = fontSize.body;
                  el.style.fontWeight = fontWeight.body;
                  if (!el.closest('.receipt-header') && !el.closest('.invoice-header') && !el.closest('[data-receipt-header]')) {
                    el.style.color = el.style.color || '#374151';
                  }
                }
              });

              // Additional fix for any remaining text elements (excluding header sections)
              const allTextElements = clonedElement.querySelectorAll('p:not(.receipt-header p):not(.invoice-header p):not([data-receipt-header] p), span:not(.receipt-header span):not(.invoice-header span):not([data-receipt-header] span), div:not(.receipt-header):not(.invoice-header):not([data-receipt-header]), h1:not(.receipt-header h1):not(.invoice-header h1):not([data-receipt-header] h1), h2, h3, h4, h5, h6');
              allTextElements.forEach((textEl: any) => {
                if (textEl.textContent && textEl.textContent.trim()) {
                  textEl.style.visibility = 'visible';
                  textEl.style.opacity = '1';
                  textEl.style.fontFamily = fontFamily;
                  if (!textEl.closest('.receipt-header') && !textEl.closest('.invoice-header') && !textEl.closest('[data-receipt-header]')) {
                    textEl.style.color = textEl.style.color || '#1f2937';
                  }
                }
              });

              // Ensure gradients are visible - Enhanced gradient handling
              const gradientElements = clonedElement.querySelectorAll('[class*="bg-gradient"], [class*="from-emerald"], [class*="to-emerald"], .receipt-header, .invoice-header, [data-receipt-header]');
              gradientElements.forEach((el: any) => {
                el.style.background = 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)';
                el.style.backgroundColor = '#10b981'; // Strong fallback
                el.style.printColorAdjust = 'exact';
                el.style.webkitPrintColorAdjust = 'exact';
                el.style.colorAdjust = 'exact';
              });

              // Fix background colors for other elements
              const bgElements = clonedElement.querySelectorAll('[class*="bg-gray"], [class*="bg-white"], [class*="bg-emerald"]:not(.receipt-header):not(.invoice-header):not([data-receipt-header])');
              bgElements.forEach((el: any) => {
                if (el.classList.contains('bg-gray-50') || el.classList.contains('bg-gray-100')) {
                  el.style.backgroundColor = '#f9fafb';
                } else if (el.classList.contains('bg-white')) {
                  el.style.backgroundColor = 'white';
                } else if (el.classList.contains('bg-emerald-50')) {
                  el.style.backgroundColor = '#ecfdf5';
                }
                el.style.printColorAdjust = 'exact';
                el.style.webkitPrintColorAdjust = 'exact';
              });

              // Professional table styling if present
              const tables = clonedElement.querySelectorAll('table');
              tables.forEach((table: any) => {
                table.style.borderCollapse = 'collapse';
                table.style.width = '100%';
                table.style.fontFamily = fontFamily;
                
                // Table headers
                const headers = table.querySelectorAll('th');
                headers.forEach((th: any) => {
                  th.style.backgroundColor = '#f8fafc';
                  th.style.fontWeight = '600';
                  th.style.padding = '12px 16px';
                  th.style.borderBottom = '2px solid #e2e8f0';
                  th.style.textAlign = 'left';
                  th.style.color = '#475569';
                  th.style.fontSize = '14px';
                });

                // Table cells
                const cells = table.querySelectorAll('td');
                cells.forEach((td: any) => {
                  td.style.padding = '10px 16px';
                  td.style.borderBottom = '1px solid #e2e8f0';
                  td.style.color = '#64748b';
                  td.style.fontSize = '14px';
                });
              });
            }
          }
        });

        // Restore original styles
        Object.assign(receipt.style, originalStyles);

        // Create PDF with enhanced compression for better quality
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfWidth = 210;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        const maxPageHeight = 297;
        const totalPages = Math.ceil(pdfHeight / maxPageHeight);
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'A4',
          compress: true
        });

        if (totalPages === 1) {
          const finalHeight = Math.min(pdfHeight, maxPageHeight - 10);
          pdf.addImage(imgData, 'JPEG', 5, 5, pdfWidth - 10, finalHeight, undefined, 'SLOW');
        } else {
          for (let page = 0; page < totalPages; page++) {
            if (page > 0) {
              pdf.addPage();
            }
            
            const sourceY = (page * (maxPageHeight - 10) * canvas.height) / pdfHeight;
            const sourceHeight = Math.min(
              ((maxPageHeight - 10) * canvas.height) / pdfHeight,
              canvas.height - sourceY
            );
            
            const pageCanvas = document.createElement('canvas');
            const pageCtx = pageCanvas.getContext('2d');
            
            pageCanvas.width = canvas.width;
            pageCanvas.height = sourceHeight;
            
            if (pageCtx) {
              pageCtx.imageSmoothingEnabled = true;
              pageCtx.imageSmoothingQuality = 'high';
              
              pageCtx.drawImage(
                canvas,
                0, sourceY, canvas.width, sourceHeight,
                0, 0, canvas.width, sourceHeight
              );
              
              const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
              const pageHeight = (sourceHeight * (pdfWidth - 10)) / canvas.width;
              
              pdf.addImage(pageImgData, 'JPEG', 5, 5, pdfWidth - 10, pageHeight, undefined, 'SLOW');
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
      className="flex justify-center items-center gap-1 lg:w-[50%] w-full px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download size={16} />
      Download
    </button>
  );
};

export default DownloadButton;