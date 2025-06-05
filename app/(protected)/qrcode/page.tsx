'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  X,
  QrCode,
  Share2,
  Printer,
  Download,
  Info,
  Smartphone,
  TrendingUp,
  Clock,
  Utensils,
  Zap,
  FileText,
  CheckCircle,
  Icon,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getCurrentLocation } from '@/lib/actions/business/get-current-business';
import { Location } from "@/types/location/type";

// QR Code Modal Component
const QRCodeModal = ({ isOpen, onClose, url, restaurantName, qrCodeOptions }: { isOpen: boolean; onClose: () => void; url: string; restaurantName: string; qrCodeOptions: any }) => {
    const qrRef = useRef<SVGSVGElement>(null);
  
  if (!isOpen) return null;
  
  const downloadQRCode = () => {
    if (qrRef.current) {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const svg = qrRef.current;
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgSize = svg.getBoundingClientRect();
      
      canvas.width = svgSize.width;
      canvas.height = svgSize.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Create an image from the SVG
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        
        // Convert canvas to PNG
        const pngUrl = canvas.toDataURL('image/png');
        
        // Download the PNG
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${restaurantName.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };
      
      img.src = url;
    }
  };
  
  const printQRCode = () => {
    const printWindow = window.open('', '', 'height=500,width=500');
    
    if (printWindow && qrRef.current) {
      const svgData = new XMLSerializer().serializeToString(qrRef.current);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const imageUrl = URL.createObjectURL(svgBlob);
      
      printWindow.document.write('<html><head><title>Print QR Code</title>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<div style="text-align: center; padding: 20px;">');
      printWindow.document.write(`<h2 style="margin-bottom: 10px;">${restaurantName} ${qrCodeOptions.purpose}</h2>`);
      printWindow.document.write(`<p style="margin-bottom: 20px;">Scan to view ${qrCodeOptions.purpose.toLowerCase()}</p>`);
      printWindow.document.write(`<img src="${imageUrl}" style="max-width: 300px;" />`);
      printWindow.document.write('</div>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        URL.revokeObjectURL(imageUrl);
      }, 250);
    }
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${restaurantName} ${qrCodeOptions.purpose}`,
          text: `Check out the ${qrCodeOptions.purpose.toLowerCase()} for ${restaurantName}`,
          url: url
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">{restaurantName} {qrCodeOptions.purpose}</h3>
          <p className="text-sm text-gray-600 mb-4">Scan this QR code to view {qrCodeOptions.purpose.toLowerCase()}</p>
          
          <div className="bg-white p-4 rounded-lg shadow-sm inline-block mb-4">
            <QRCodeSVG 
              ref={qrRef}
              value={url} 
              size={200}
              bgColor={qrCodeOptions.bgColor}
              fgColor={qrCodeOptions.fgColor}
              level={qrCodeOptions.errorCorrection}
              includeMargin={true}
            />
          </div>
          
          <div className="flex justify-center space-x-3 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQRCode}
              className="flex items-center gap-1"
            >
              <Download size={16} />
              <span>Download</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={printQRCode}
              className="flex items-center gap-1"
            >
              <Printer size={16} />
              <span>Print</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={shareQRCode}
              className="flex items-center gap-1"
            >
              <Share2 size={16} />
              <span>Share</span>
            </Button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-center">
            <Info size={12} className="mr-1" />
            <span>This QR code links directly to your {qrCodeOptions.purpose.toLowerCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({title, description }: { icon: React.ComponentType<any>, title: string, description: string }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg hover:translate-y-[-2px]">
      <div className="flex items-center mb-4">
        <div className="bg-emerald-100 p-3 rounded-full mr-4">
        <Icon size={24} className="text-emerald-600" iconNode={[]} />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

// Main QR Code Generator Component
const QRCodeGenerator = () => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [location, setLocation] = useState<Location | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("about");
  const [error, setError] = useState<string | null>(null);
  const [qrCodeOptions, setQrCodeOptions] = useState({
    purpose: "Menu",
    fgColor: "#10b981",
    bgColor: "#ffffff",
    errorCorrection: "H"
  });

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const locationCurrent = await getCurrentLocation();
        // console.log("Current Location:", locationCurrent);
        if (locationCurrent) {
          setLocation(locationCurrent);
        }
      } catch (error: any) {
        console.error("Error fetching location:", error);
        if (error?.details?.message) {
          setError(error.details.message);
        } else if (error?.message) {
          setError(error.message);
        } else {
          setError("An error occurred while fetching location data");
        }
      }
    };

    fetchLocation();
  }, []);
  
  const restaurantConfig = {
    name: location?.name || "Your Restaurant",
    tagline: "Authentic flavors, exceptional experience",
    logo: null,
    currency: "TZS"
  };
  
  // Generate menu URL with location ID
  const getMenuUrl = () => {
    if (typeof window !== 'undefined') {
      const baseUrl = `${window.location.origin}/menu`;
       
      if (location && location.id) {
        const fullUrl = `${baseUrl}/${location.id}`;
        
        return fullUrl;
      }
      
      return baseUrl;
    }
    return '';
  };

  
  
  const openQRModal = () => {
    setShowQRModal(true);
  };
  
  const closeQRModal = () => {
    setShowQRModal(false);
  };

  const updateQROption = (option: string, value: string) => {
    setQrCodeOptions({
      ...qrCodeOptions,
      [option]: value
    });
  };

  const features = [
    {
      icon: Smartphone,
      title: "Contactless Experience",
      description: "Provide a hygienic, modern experience with digital menus, eliminating the need for physical menus."
    },
    {
      icon: TrendingUp,
      title: "Increased Efficiency",
      description: "Reduce wait times and staff workload by allowing customers to browse menus on their own devices."
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Update your menu instantly without reprinting. Change prices, add specials, or remove unavailable items."
    },
    {
      icon: Utensils,
      title: "Enhanced Customer Experience",
      description: "Include detailed descriptions, photos, and dietary information to help customers make informed choices."
    },
    {
      icon: Zap,
      title: "Quick Implementation",
      description: "Generate, customize, and deploy QR codes in minutes. No complex setup or technical knowledge required."
    },
    {
      icon: FileText,
      title: "Beyond Menus",
      description: "Use QR codes for reservations, customer feedback, loyalty programs, and promotional content."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 mt-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Subscription Limit Reached</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="p-8 md:w-3/5">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">QR Code Solutions for Modern Business</h1>
            <p className="text-emerald-100 text-lg mb-6">Enhance your customer experience with instantly scannable QR codes for menus, specials, and more.</p>
            <Button 
              onClick={openQRModal} 
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-6 py-3 rounded-md"
            >
              <QrCode className="mr-2 h-5 w-5" />
              Generate QR Code Now
            </Button>
          </div>
          <div className="md:w-2/5 bg-emerald-800 p-8 flex items-center justify-center">
            <div className="relative">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <QRCodeSVG 
                  value={getMenuUrl()} 
                  size={150}
                  bgColor={qrCodeOptions.bgColor}
                  fgColor={qrCodeOptions.fgColor}
                
                  includeMargin={true}
                />
              </div>
              <div className="absolute -bottom-3 -right-3 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Scan Me!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mt-10 mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("about")}
            className={`pb-4 font-medium text-lg ${
              activeTab === "about"
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-gray-500 hover:text-emerald-600"
            }`}
          >
            About QR Codes
          </button>
          <button
            onClick={() => setActiveTab("generator")}
            className={`pb-4 font-medium text-lg ${
              activeTab === "generator"
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-gray-500 hover:text-emerald-600"
            }`}
          >
            QR Code Generator
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "about" && (
          <div>
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Why Use QR Codes for Your Restaurant?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <FeatureCard 
                    key={index} 
                    icon={feature.icon} 
                    title={feature.title} 
                    description={feature.description} 
                  />
                ))}
              </div>
            </div>

            <div className="bg-emerald-50 p-6 rounded-lg mb-10">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <span className="text-emerald-600 font-bold text-xl">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Generate QR Code</h3>
                  <p className="text-gray-600">Customize and create a QR code linking to your digital menu or other content.</p>
                </div>
                <div className="text-center p-4">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <span className="text-emerald-600 font-bold text-xl">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Display & Distribute</h3>
                  <p className="text-gray-600">Print QR codes on table tents, posters, receipts, or promotional materials.</p>
                </div>
                <div className="text-center p-4">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <span className="text-emerald-600 font-bold text-xl">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Customers Scan & Engage</h3>
                  <p className="text-gray-600">Customers simply scan the QR code with their smartphone camera to view your content.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {[
                  {
                    question: "Do customers need a special app to scan QR codes?",
                    answer: "No, most modern smartphones can scan QR codes directly through the camera app without requiring additional software."
                  },
                  {
                    question: "Can I customize the appearance of my QR code?",
                    answer: "Yes, you can customize the colors of your QR code to match your restaurant's branding while ensuring it remains scannable."
                  },
                  {
                    question: "Can I track how many people scan my QR code?",
                    answer: "Basic QR codes don't offer tracking capabilities, but you can implement analytics on the landing page it directs to."
                  },
                  {
                    question: "What happens if I need to change the menu or information?",
                    answer: "Since the QR code points to a URL, you can update the content at that URL anytime without changing the QR code itself."
                  }
                ].map((faq, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "generator" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Customize Your QR Code</h2>
            
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/2">
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">QR Code Purpose</label>
                  <select 
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={qrCodeOptions.purpose}
                    onChange={(e) => updateQROption('purpose', e.target.value)}
                  >
                    <option value="Menu">Restaurant Menu</option>
                    <option value="Specials">Daily Specials</option>
                    <option value="Drinks">Drinks Menu</option>
                    <option value="Desserts">Desserts Menu</option>
                    <option value="Ordering">Online Ordering</option>
                    <option value="Feedback">Customer Feedback</option>
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">QR Color (Foreground)</label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="color" 
                      value={qrCodeOptions.fgColor}
                      onChange={(e) => updateQROption('fgColor', e.target.value)}
                      className="h-10 w-10 border-0"
                    />
                    <span className="text-gray-600 text-sm">{qrCodeOptions.fgColor}</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Background Color</label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="color" 
                      value={qrCodeOptions.bgColor}
                      onChange={(e) => updateQROption('bgColor', e.target.value)}
                      className="h-10 w-10 border-0"
                    />
                    <span className="text-gray-600 text-sm">{qrCodeOptions.bgColor}</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Error Correction Level</label>
                  <select 
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={qrCodeOptions.errorCorrection}
                    onChange={(e) => updateQROption('errorCorrection', e.target.value)}
                  >
                    <option value="L">Low (7% recovery)</option>
                    <option value="M">Medium (15% recovery)</option>
                    <option value="Q">Quartile (25% recovery)</option>
                    <option value="H">High (30% recovery)</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">Higher correction levels make QR codes more reliable but also more complex.</p>
                </div>
              </div>
              
              <div className="md:w-1/2 flex flex-col items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
                  <QRCodeSVG 
                    value={getMenuUrl()} 
                    size={200}
                    bgColor={qrCodeOptions.bgColor}
                    fgColor={qrCodeOptions.fgColor}
                    
                    includeMargin={true}
                  />
                </div>
                
                <div className="text-center mb-6">
                  <h4 className="font-semibold text-lg">{restaurantConfig.name} {qrCodeOptions.purpose}</h4>
                  <p className="text-gray-600 text-sm">Preview of your customized QR code</p>
                </div>
                
                <Button 
                  onClick={openQRModal} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-md w-full"
                >
                  Generate & Download QR Code
                </Button>
              </div>
            </div>
            
            <div className="mt-12 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-xl mb-4">Tips for Effective QR Code Usage</h3>
              <ul className="space-y-3">
                {[
                  "Place QR codes in easily visible locations on tables, menus, or at the entrance",
                  "Include a brief instruction or call-to-action near the QR code",
                  "Test your QR code with different devices before distributing",
                  "Maintain adequate size (minimum 2x2 cm) for easy scanning",
                  "Ensure sufficient contrast between QR code and background",
                  "Consider adding your logo or a visual element to make your QR code distinctive"
                ].map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle size={18} className="text-emerald-500 mr-2 mt-1 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal 
        isOpen={showQRModal} 
        onClose={closeQRModal} 
        url={getMenuUrl()}
        restaurantName={restaurantConfig.name}
        qrCodeOptions={qrCodeOptions}
      />
    </div>
  );
};

export default QRCodeGenerator;