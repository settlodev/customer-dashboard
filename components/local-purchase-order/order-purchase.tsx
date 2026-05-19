"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";

export default function SharePurchaseOrder() {
  const params = useParams();
  const id = params.id as string;

  const generateShareLink = () => {
    return `${window.location.origin}/stock-purchases/share/${id}`;
  };

  const shareLink = generateShareLink();

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copied",
      description: "Purchase order link copied to clipboard",
    });
  };

  return (
    <Card className="mt-6 print:hidden">
      <CardHeader>
        <CardTitle className="text-lg">Share Purchase Order</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Share this purchase order with your supplier
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* URL display with better mobile handling */}
          <div className="relative">
            <div className="bg-gray-50 dark:bg-gray-800 border rounded-lg p-3 pr-12">
              <p className="text-sm font-mono break-all select-all">
                {shareLink}
              </p>
            </div>
            {/* Mobile-only copy button positioned absolutely */}
            <div className="sm:hidden absolute right-3 top-3">
              <Button
                onClick={copyShareLink}
                size="icon"
                variant="outline"
                className="h-8 w-8"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Desktop copy button (hidden on mobile) */}
          <div className="hidden sm:block">
            <Button onClick={copyShareLink} className="gap-2 w-full sm:w-auto">
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
