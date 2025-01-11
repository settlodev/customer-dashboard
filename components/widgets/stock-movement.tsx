import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, MapPin, User, Archive } from 'lucide-react';


const StockMovementCard = ({ movement }: { movement: any }) => {
  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'SALE':
        return 'bg-red-100 text-red-800';
      case 'PURCHASE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div className="space-y-1">
          <h3 className="text-2xl font-semibold">{movement.stockName}</h3>
          <p className="text-sm text-gray-500">{movement.stockVariantName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={getMovementTypeColor(movement.stockMovementType)}
          >
            {movement.stockMovementType}
          </Badge>
          {movement.isArchived && (
            <Badge variant="secondary" className="bg-gray-100">
              <Archive className="w-4 h-4 mr-1" />
              Archived
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Quantity and Value Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Quantity Change</p>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              <span className="text-lg font-medium">{movement.quantity}</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Value</p>
            <p className="text-lg font-medium">
              ${movement.value.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Stock Details Section */}
        <div className="space-y-4">
          <h4 className="font-medium">Stock Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Previous Quantity</p>
              <p>{movement.previousTotalQuantity}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">New Quantity</p>
              <p>{movement.newTotalQuantity}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Previous Avg. Value</p>
              <p>${movement.previousAverageValue.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">New Avg. Value</p>
              <p>${movement.newAverageValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Location and Staff Section */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm">{movement.locationName || 'No location'}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm">{movement.staffName || 'No staff assigned'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockMovementCard;