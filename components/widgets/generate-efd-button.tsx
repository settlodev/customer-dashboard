'use client';

import { generateEfd } from '@/lib/actions/order-actions';
import { useState } from 'react';

interface GenerateEfdButtonProps {
  orderId: string;
  location: string;
  onSuccess?: () => void;
}

const GenerateEfdButton = ({ orderId, location, onSuccess }: GenerateEfdButtonProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleGenerateEfd = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const efdGenerated = await generateEfd(orderId, location);

      console.log("The Efd generated is",efdGenerated)
      
      if (efdGenerated.status === 200) {
        if (onSuccess) {
          onSuccess();
        } else {
          // Default behavior: reload after 3 seconds
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      } else {
        // Extract the error message from the response
        const errorMessage = efdGenerated.message || 'Failed to generate EFD receipt';
        setError(errorMessage);
      }
    } catch (error: any) {
      console.log("Error while generating EFD", error);
      
      // Handle different error response formats
      let errorMessage = 'An unexpected error occurred while generating EFD receipt';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details?.message) {
        errorMessage = error.details.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.statusText) {
        errorMessage = error.statusText;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleGenerateEfd}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
          isLoading 
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
      >
        {isLoading ? 'Generating EFD...' : 'Generate EFD Receipt'}
      </button>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">EFD Generation Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateEfdButton;