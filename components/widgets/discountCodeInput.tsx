import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Tag, Loader2, Check, X } from 'lucide-react';
import { Control } from 'react-hook-form';

interface DiscountCodeInputProps {
  control: Control<any>;
  isValidating: boolean;
  isValid: boolean | null;
  onClear: () => void;
}

const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({
  control,
  isValidating,
  isValid,
  onClear
}) => {
  return (
    <FormField
      control={control}
      name="discountCode"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-700 font-medium">
            Discount Code (Optional)
          </FormLabel>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <Tag size={18} />
            </div>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  className={`pl-10 pr-10 ${isValidating ? 'bg-gray-50' : ''}`}
                  placeholder="Enter discount code"
                  disabled={isValidating}
                />
                {field.value && (
                  <div className="absolute right-3 top-2">
                    {isValidating ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    ) : isValid === true ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : isValid === false ? (
                      <X 
                        className="h-5 w-5 text-red-500 cursor-pointer" 
                        onClick={() => {
                          field.onChange('');
                          onClear();
                        }} 
                      />
                    ) : null}
                  </div>
                )}
              </div>
            </FormControl>
            {isValid === false && (
              <p className="text-sm text-red-500 mt-1">
                Invalid discount code
              </p>
            )}
            {isValid === true && (
              <p className="text-sm text-green-600 mt-1">
                Discount applied successfully
              </p>
            )}
            <FormMessage className="text-sm" />
          </div>
        </FormItem>
      )}
    />
  );
};

export default DiscountCodeInput;