import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from 'lucide-react';
import { InvoiceItem } from '@/types/invoice/type';

interface InvoiceItemCardProps {
  item: InvoiceItem;
  onRemove: (id: number) => void;
  onUpdateMonths: (id: number, months: number) => void;
}

const InvoiceItemCard: React.FC<InvoiceItemCardProps> = ({
  item,
  onRemove,
  onUpdateMonths
}) => {
  const getActionTypeColor = () => {
    switch (item.actionType) {
      case 'upgrade': return 'bg-blue-100 text-blue-700';
      case 'downgrade': return 'bg-orange-100 text-orange-700';
      case 'renew': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-gray-50 p-3 rounded border">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p className="font-medium text-sm">
            {item.name}
            {item.actionType && (
              <span className={`ml-2 text-xs px-2 py-1 rounded ${getActionTypeColor()}`}>
                {item.actionType.charAt(0).toUpperCase() + item.actionType.slice(1)}
              </span>
            )}
          </p>
          <p className="text-xs text-gray-600">
            TZS {item.unitPrice.toLocaleString()}
            {item.type === 'subscription' && '/month'}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onRemove(item.id)}
          className="p-1 h-auto text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      {item.type === 'subscription' && (
        <div className="flex items-center gap-2">
          <Label className="text-xs">Months:</Label>
          <Input
            type="number"
            min="1"
            max="12"
            value={item.months}
            onChange={(e) => onUpdateMonths(item.id, parseInt(e.target.value) || 1)}
            className="w-16 h-7 text-xs"
          />
        </div>
      )}
      
      <div className="text-right mt-2">
        <span className="font-semibold text-sm">
          TZS {item.totalPrice.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default InvoiceItemCard;