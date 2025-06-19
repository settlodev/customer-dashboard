import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PhoneInput } from '@/components/ui/phone-input';
import { Separator } from "@/components/ui/separator";
import { Receipt, DollarSign, Loader2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { InvoiceItem } from '@/types/invoice/type';
import DiscountCodeInput from '../widgets/discountCodeInput';
import InvoiceItemCard from './invoiceItemCard';


interface InvoiceSummaryProps {
  form: UseFormReturn<any>;
  invoiceItems: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  isLoading: boolean;
  isValidatingDiscount: boolean;
  discountValid: boolean | null;
  onRemoveItem: (id: number) => void;
  onUpdateMonths: (id: number, months: number) => void;
  onClearDiscount: () => void;
  onSubmit: (data: any) => void;
  onFormError: (errors: any) => void;
}

const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
  form,
  invoiceItems,
  subtotal,
  discountAmount,
  total,
  isLoading,
  isValidatingDiscount,
  discountValid,
  onRemoveItem,
  onUpdateMonths,
  onClearDiscount,
  onSubmit,
  onFormError
}) => {
  return (
    <Card className="sticky top-6 border-t-4 border-t-emerald-500">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Receipt className="mr-2" size={20} />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onFormError)} className="space-y-4">
            {/* Customer Details */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Email *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="customer@example.com" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Phone *</FormLabel>
                    <FormControl>
                      <PhoneInput
                        placeholder="Enter phone number"
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Invoice Items */}
            <div className="space-y-3">
              <h4 className="font-semibold">Items</h4>
              {invoiceItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No items added yet</p>
              ) : (
                <div className="space-y-3">
                  {invoiceItems.map((item) => (
                    <InvoiceItemCard
                      key={item.id}
                      item={item}
                      onRemove={onRemoveItem}
                      onUpdateMonths={onUpdateMonths}
                    />
                  ))}
                </div>
              )}
            </div>

            {invoiceItems.length > 0 && (
              <>
                <Separator />
                
                {/* Discount */}
                <div className="space-y-3">
                  <DiscountCodeInput
                    control={form.control}
                    isValidating={isValidatingDiscount}
                    isValid={discountValid}
                    onClear={onClearDiscount}
                  />
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>TZS {subtotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>-TZS {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>TZS {total.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || invoiceItems.length === 0}
                  className="w-full"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Processing</span>
                    </div>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Pay Now
                    </>
                  )}
                </Button>
              </>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default InvoiceSummary;