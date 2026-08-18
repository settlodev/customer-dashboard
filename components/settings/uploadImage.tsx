"use client";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useUpload } from "@/lib/uploads/use-upload";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageUrl: string) => void;
  currentImage?: string;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentImage,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage || "");
  const { upload, isUploading, progress } = useUpload();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image under 2MB",
      });
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
  };

  const handleSave = async () => {
    if (!selectedFile) {
      if (previewUrl) {
        // User is keeping the existing image — bail out without uploading.
        onSave(previewUrl);
        onClose();
        return;
      }
      toast({
        variant: "destructive",
        title: "No image selected",
        description: "Please select an image to upload",
      });
      return;
    }

    try {
      const result = await upload({
        file: selectedFile,
        purpose: "RECEIPT_HEADER",
      });
      onSave(result.url);
      toast({
        variant: "success",
        title: "Success",
        description: "Receipt image uploaded successfully",
      });
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload image. Please try again.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Receipt Image</DialogTitle>
          <DialogDescription>
            Upload an image to display on customer receipts (logo, banner, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="image-upload">Receipt Image</Label>
            <div className="flex items-center gap-4">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="cursor-pointer"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: JPG, PNG, WebP. Max size: 2MB
            </p>
          </div>

          {previewUrl && (
            <div className="relative border rounded-lg p-4 bg-muted/50">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleRemoveImage}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 rounded object-contain"
                />
                <p className="text-sm text-muted-foreground">Image Preview</p>
              </div>
            </div>
          )}

          {!previewUrl && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No image selected</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!previewUrl || isUploading}>
            {isUploading
              ? progress
                ? `Uploading ${progress.percent}%`
                : "Uploading..."
              : "Save Image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
