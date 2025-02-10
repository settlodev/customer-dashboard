'use client'
import React from "react";
import { Share2} from "lucide-react";

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
   
      <button
        onClick={handleShare}
        className="flex justify-center lg:w-[50%] w-full items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-[#101829] rounded-lg mt-2 "
      >
        <Share2 size={16} />
        Share
      </button>
    // </div>
  );
};

export default ShareButton;
