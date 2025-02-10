'use client'
import React from "react";
import { Share2, Copy, Mail, MessageCircle } from "lucide-react";

const ShareButton = ({ url }: { url: string }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Order Receipt",
          text: "Check out this order receipt!",
          url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      alert("Sharing is not supported on this browser.");
    }
  };

  return (
    <div className="grid grid-cols-2 mt-2 lg:flex gap-2">
      {/* Share Button */}
      <button
        onClick={handleShare}
        className="flex justify-center items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-[#101829] rounded-lg "
      >
        <Share2 size={16} />
        Share
      </button>

      {/* Copy Link Button */}
      <button
        onClick={handleCopy}
        className="flex justify-center items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
      >
        <Copy size={16} />
        Copy Link
      </button>

      {/* WhatsApp Share */}
      <a
        href={`https://wa.me/?text=Check%20this%20receipt%20${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex justify-center items-center gap-1 px-3 py-2 text-sm font-medium text-green-600 border border-green-600 rounded-lg hover:bg-green-100"
      >
        <MessageCircle size={16} />
        WhatsApp
      </a>

      {/* Email Share */}
      <a
        href={`mailto:?subject=Order Receipt&body=Here is your receipt: ${encodeURIComponent(url)}`}
        className="flex justify-center items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-500 rounded-lg hover:bg-gray-100"
      >
        <Mail size={16} />
        Email
      </a>
    </div>
  );
};

export default ShareButton;
