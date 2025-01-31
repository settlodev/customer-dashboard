import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

const VersionDisplay = ({ version = "1.0.0" }) => {
  return (
    <div className="flex items-center rounded-lg px-2 py-1.5 text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors duration-200 gap-2">
      <Info className="w-4 h-4 text-gray-500" />
      <Badge variant="secondary" className="bg-white">
        v{version}
      </Badge>
    </div>
  );
};

export default VersionDisplay;