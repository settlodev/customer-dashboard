
'use client';

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { uploadCSV } from "@/lib/actions/product-actions";
import { Icon } from "@iconify/react/dist/iconify.js";

export function DialogDemo() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [ ,setIsUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false); // New state for dialog open/close
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const fileText = await selectedFile.text();
      setFileContent(fileText); 
    }
  };

  const handleUpload = async () => {
    if (file && fileContent) {
      try {
        await uploadCSV({ fileData: fileContent, fileName: file.name });
        setIsUploaded(true);
        resetForm();
        setIsOpen(false); 
      } catch (error) {
        setError("Failed to upload file: " + (error as Error).message);
        console.error("Error uploading file:", error);
      }
    }
  };

  const resetForm = () => {
    setFile(null);
    setFileContent(null);
    setIsUploaded(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} >
      <DialogTrigger asChild>
        <Button className="h-8 gap-1" size="sm" variant="outline" onClick={() => setIsOpen(true)}>
          <Icon className="h-3.5 w-3.5" icon="mdi:file-import" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Upload CSV</DialogTitle>
          <DialogDescription>
            Select a CSV file to upload. Please ensure that the file is formatted correctly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
         
            <Input
              ref={fileInputRef}
              id="csv"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="col-span-3 w-full"
            />
          </div>
          {fileContent && (
            <div className="overflow-auto max-h-60">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    {fileContent.split('\n')[0].split(',').map((header, index) => (
                      <th key={index} className="border px-2 py-1 bg-gray-100">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fileContent.split('\n').slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.split(',').map((cell, cellIndex) => (
                        <td key={cellIndex} className="border px-2 py-1">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <DialogFooter className="flex  flex-col items-center lg:flex-row justify-between">
        
            <Button
              onClick={() => window.open("/csv/product-template.csv", "_blank")}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <Icon className="h-3.5 w-3.5" icon="mdi:file-download" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Download Template</span>
            </Button>
          
          <Button type="submit" onClick={handleUpload} disabled={!file}>
            Upload CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}