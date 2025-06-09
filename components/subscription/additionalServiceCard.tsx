import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Plus } from 'lucide-react';

interface AdditionalService {
  id: number;
  name: string;
  amount: number;
}

interface AdditionalServiceCardProps {
  service: AdditionalService;
  isAdded: boolean;
  onAdd: (service: AdditionalService) => void;
}

const AdditionalServiceCard: React.FC<AdditionalServiceCardProps> = ({
  service,
  isAdded,
  onAdd
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{service.name}</CardTitle>
        <div className="text-xl font-bold">
          TZS {service.amount.toLocaleString()}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          size="sm"
          onClick={() => onAdd(service)}
          className="w-full"
          disabled={isAdded}
        >
          {isAdded ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Added
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1" />
              Add Service
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdditionalServiceCard;