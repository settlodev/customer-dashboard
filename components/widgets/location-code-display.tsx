"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Copy, RefreshCw, Key, Shield } from "lucide-react";
import { generateLocationCode } from "@/lib/actions/location-actions";
import { useToast } from "@/hooks/use-toast";

interface LocationCodeData {
  code: string;
  expiresAt: string;
  validityMinutes: number;
  locationId: string;
}

export function LocationCodeDisplay() {
  const [codeData, setCodeData] = useState<LocationCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!codeData) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(codeData.expiresAt).getTime();
      return Math.max(0, Math.floor((expiry - now) / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (newTimeLeft === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [codeData]);

  const generateCode = async () => {
    setIsLoading(true);
    try {
      const response = await generateLocationCode();
      if (response.success && response.data) {
        setCodeData(response.data);
        toast({
          title: "Code Generated",
          description: response.message,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate location code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate location code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (codeData?.code) {
      await navigator.clipboard.writeText(codeData.code);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Location code copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const isExpired = timeLeft === 0;
  const isActive = codeData && !isExpired;

  return (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg border">
            <Key className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Authentication Code</h3>
            <p className="text-sm text-muted-foreground">
              Generate codes for location access for Application
            </p>
          </div>
        </div>
        <Button
          onClick={generateCode}
          disabled={isLoading}
          size="lg"
          variant="default"
          className="shadow-sm hover:shadow-md transition-all duration-200"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          {isLoading ? "Generating..." : "Generate Code"}
        </Button>
      </div>

      {/* Code Display Card */}
      {isActive && (
        <Card className="relative overflow-hidden border-2">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Code Display */}
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    YOUR LOCATION CODE
                  </span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <div className="text-4xl lg:text-5xl font-bold tracking-wider bg-gray-50 border-2 px-4 py-3 rounded-lg">
                    {codeData.code.match(/.{1,2}/g)?.join(" ") || codeData.code}
                  </div>
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    variant={isCopied ? "default" : "outline"}
                    className="h-12 w-12 p-0 rounded-lg transition-all duration-200"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Timer and Info */}
              <div className="flex flex-col items-center lg:items-end gap-3">
                {/* Countdown Timer */}
                <div className="text-center lg:text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-muted-foreground">
                      EXPIRES IN
                    </span>
                  </div>
                  <div
                    className={`text-2xl font-mono font-bold ${
                      timeLeft < 60
                        ? "text-gray-900 animate-pulse"
                        : "text-gray-700"
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </div>
                </div>

                {/* Validity Badge */}
                <Badge
                  variant="outline"
                  className="px-3 py-1 text-xs bg-gray-50"
                >
                  Valid for {codeData.validityMinutes} minutes
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!codeData && (
        <Card className="border-2 border-dashed">
          <CardContent className="p-8 text-center">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold text-lg mb-2">No Active Code</h4>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Generate a temporary authentication code to provide secure access
              to your location.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Expired State */}
      {codeData && isExpired && (
        <Card className="border-2 border-dashed">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="font-semibold">Code Expired</span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              This code is no longer valid. Generate a new one for continued
              access.
            </p>
            <Button onClick={generateCode} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate New Code
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
