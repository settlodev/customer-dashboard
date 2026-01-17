// // "use client";
// //
// // import { EyeIcon, MoreHorizontal } from "lucide-react";
// // import { useRouter } from "next/navigation";
// // import React from "react";
// // import { Button } from "@/components/ui/button";
// // import {
// //   DropdownMenu,
// //   DropdownMenuContent,
// //   DropdownMenuItem,
// //   DropdownMenuLabel,
// //   DropdownMenuTrigger,
// // } from "@/components/ui/dropdown-menu";
// // import { Device } from "@/types/device/type";
// //
// // interface CellActionProps {
// //   data: Device;
// // }
// //
// // export const CellAction: React.FC<CellActionProps> = ({ data }) => {
// //   const router = useRouter();
// //
// //   return (
// //     <>
// //       <div className="relative flex items-center gap-2">
// //         <DropdownMenu modal={false}>
// //           <DropdownMenuTrigger asChild>
// //             <Button className="h-8 w-8 p-0" variant="ghost">
// //               <span className="sr-only">Actions</span>
// //               <MoreHorizontal className="h-4 w-4" />
// //             </Button>
// //           </DropdownMenuTrigger>
// //           <DropdownMenuContent align="end">
// //             <DropdownMenuLabel>Actions</DropdownMenuLabel>
// //             <DropdownMenuItem
// //               onClick={() => router.push(`/invoices/${data.id}`)}
// //             >
// //               <EyeIcon className="mr-2 h-4 w-4" /> View
// //             </DropdownMenuItem>
// //           </DropdownMenuContent>
// //         </DropdownMenu>
// //       </div>
// //     </>
// //   );
// // };
//
// "use client";
//
// import { LogOut, Key, X, Copy, Check } from "lucide-react";
// import { useRouter } from "next/navigation";
// import React, { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
//
// import { Device } from "@/types/device/type";
// import { generateLocationCode } from "@/lib/actions/location-actions";
// import { Alert } from "@chakra-ui/alert";
// import { AlertDescription } from "@/components/ui/alert";
//
// interface CellActionProps {
//   data: Device;
// }
//
// export const CellAction: React.FC<CellActionProps> = ({ data }) => {
//   const router = useRouter();
//   const [showCodeModal, setShowCodeModal] = useState(false);
//   const [showLogoutAlert, setShowLogoutAlert] = useState(false);
//   const [deviceCode, setDeviceCode] = useState<string | null>(null);
//   const [expiresAt, setExpiresAt] = useState<string | null>(null);
//   const [validityMinutes, setValidityMinutes] = useState<number>(0);
//   const [timeRemaining, setTimeRemaining] = useState<number>(0);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [copied, setCopied] = useState(false);
//
//   // Calculate time remaining
//   useEffect(() => {
//     if (!expiresAt) return;
//
//     const interval = setInterval(() => {
//       const now = new Date().getTime();
//       const expiry = new Date(expiresAt).getTime();
//       const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
//
//       setTimeRemaining(remaining);
//
//       if (remaining === 0) {
//         clearInterval(interval);
//       }
//     }, 1000);
//
//     return () => clearInterval(interval);
//   }, [expiresAt]);
//
//   const handleGenerateCode = async () => {
//     setIsGenerating(true);
//     try {
//       const response = await generateLocationCode();
//       if (response.success && response.data) {
//         setDeviceCode(response.data.code);
//         setExpiresAt(response.data.expiresAt);
//         setValidityMinutes(response.data.validityMinutes);
//         setShowCodeModal(true);
//       }
//     } catch (error) {
//       console.error("Failed to generate code:", error);
//       // You can add toast notification here
//     } finally {
//       setIsGenerating(false);
//     }
//   };
//
//   const handleLogout = () => {
//     setShowLogoutAlert(true);
//   };
//
//   const confirmLogout = () => {
//     // Implement your logout logic here
//     console.log("Logging out device:", data.id);
//     // Example: await logoutDevice(data.id);
//     setShowLogoutAlert(false);
//   };
//
//   const handleCopyCode = async () => {
//     if (deviceCode) {
//       await navigator.clipboard.writeText(deviceCode);
//       setCopied(true);
//       setTimeout(() => setCopied(false), 2000);
//     }
//   };
//
//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, "0")}`;
//   };
//
//   const handleCloseModal = () => {
//     setShowCodeModal(false);
//     setDeviceCode(null);
//     setExpiresAt(null);
//     setTimeRemaining(0);
//     setCopied(false);
//   };
//
//   return (
//     <>
//       <div className="flex items-center gap-2">
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={handleGenerateCode}
//           disabled={isGenerating}
//           className="h-8"
//         >
//           <Key className="mr-2 h-4 w-4" />
//           {isGenerating ? "Generating..." : "Generate Code"}
//         </Button>
//
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={handleLogout}
//           className="h-8 text-destructive hover:text-destructive"
//         >
//           <LogOut className="mr-2 h-4 w-4" />
//           Logout Device
//         </Button>
//       </div>
//
//       {/* Device Code Modal */}
//       <Dialog open={showCodeModal} onOpenChange={handleCloseModal}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>Device Authentication Code</DialogTitle>
//             <DialogDescription>
//               Use this code to authenticate your device. Valid for{" "}
//               {validityMinutes} minutes.
//             </DialogDescription>
//           </DialogHeader>
//
//           <div className="flex flex-col items-center space-y-4 py-4">
//             <div className="relative w-full">
//               <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
//                 <span className="text-4xl font-bold tracking-wider font-mono">
//                   {deviceCode}
//                 </span>
//               </div>
//             </div>
//
//             <div className="flex items-center gap-2 text-sm">
//               {timeRemaining > 0 ? (
//                 <>
//                   <span className="text-muted-foreground">Expires in:</span>
//                   <span
//                     className={`font-semibold ${timeRemaining < 60 ? "text-destructive" : "text-foreground"}`}
//                   >
//                     {formatTime(timeRemaining)}
//                   </span>
//                 </>
//               ) : (
//                 <span className="text-destructive font-semibold">
//                   Code expired
//                 </span>
//               )}
//             </div>
//
//             <div className="flex gap-2 w-full">
//               <Button
//                 onClick={handleCopyCode}
//                 className="flex-1"
//                 variant="outline"
//                 disabled={timeRemaining === 0}
//               >
//                 {copied ? (
//                   <>
//                     <Check className="mr-2 h-4 w-4" />
//                     Copied!
//                   </>
//                 ) : (
//                   <>
//                     <Copy className="mr-2 h-4 w-4" />
//                     Copy Code
//                   </>
//                 )}
//               </Button>
//
//               <Button
//                 onClick={handleCloseModal}
//                 variant="secondary"
//                 className="flex-1"
//               >
//                 Close
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//
//       {/*Logout Confirmation Alert */}
//       <Alert open={showLogoutAlert} onOpenChange={setShowLogoutAlert}>
//         {/*<AlertDialogContent>*/}
//           {/*<AlertDialogHeader>*/}
//             <AlertDialogTitle>Logout Device</AlertDialogTitle>
//             <AlertDescription>
//               Are you sure you want to logout this device? You will be logged
//               out from{" "}
//               <span className="font-semibold">{data.name || data.id}</span> and
//               will need to authenticate again to use it.
//             </AlertDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={confirmLogout}
//               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//             >
//               Logout Device
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </Alert>
//     </>
//   );
// };

"use client";

import { LogOut, Key, X, Copy, Check, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Device } from "@/types/device/type";
import { generateLocationCode } from "@/lib/actions/location-actions";

interface CellActionProps {
  data: Device;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [validityMinutes, setValidityMinutes] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Calculate time remaining
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const response = await generateLocationCode();
      if (response.success && response.data) {
        setDeviceCode(response.data.code);
        setExpiresAt(response.data.expiresAt);
        setValidityMinutes(response.data.validityMinutes);
        setShowCodeModal(true);
      }
    } catch (error) {
      console.error("Failed to generate code:", error);
      // You can add toast notification here
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutAlert(true);
  };

  const confirmLogout = () => {
    // Implement your logout logic here
    console.log("Logging out device:", data.id);
    // Example: await logoutDevice(data.id);
    setShowLogoutAlert(false);
  };

  const handleCopyCode = async () => {
    if (deviceCode) {
      await navigator.clipboard.writeText(deviceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCloseModal = () => {
    setShowCodeModal(false);
    setDeviceCode(null);
    setExpiresAt(null);
    setTimeRemaining(0);
    setCopied(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateCode}
          disabled={isGenerating}
          className="h-8"
        >
          <Key className="mr-2 h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate Code"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="h-8 text-destructive hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout Device
        </Button>
      </div>

      {/* Logout Confirmation Alert */}
      {showLogoutAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Logout Device Confirmation</AlertTitle>
              <AlertDescription>
                <p className="mb-3">
                  Are you sure you want to logout this device? You will be
                  logged out from{" "}
                  <span className="font-semibold">{data.name || data.id}</span>{" "}
                  and will need to authenticate again to use it.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLogoutAlert(false)}
                    className="bg-background"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={confirmLogout}
                  >
                    Logout Device
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Device Code Modal */}
      <Dialog open={showCodeModal} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Device Authentication Code</DialogTitle>
            <DialogDescription>
              Use this code to authenticate your device. Valid for{" "}
              {validityMinutes} minutes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="relative w-full">
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
                <span className="text-4xl font-bold tracking-wider font-mono">
                  {deviceCode}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {timeRemaining > 0 ? (
                <>
                  <span className="text-muted-foreground">Expires in:</span>
                  <span
                    className={`font-semibold ${timeRemaining < 60 ? "text-destructive" : "text-foreground"}`}
                  >
                    {formatTime(timeRemaining)}
                  </span>
                </>
              ) : (
                <span className="text-destructive font-semibold">
                  Code expired
                </span>
              )}
            </div>

            <div className="flex gap-2 w-full">
              <Button
                onClick={handleCopyCode}
                className="flex-1"
                variant="outline"
                disabled={timeRemaining === 0}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Code
                  </>
                )}
              </Button>

              <Button
                onClick={handleCloseModal}
                variant="secondary"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
