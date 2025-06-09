import React from 'react';
import { Tag, Clock, AlertCircle } from 'lucide-react';
import { ActiveSubscription } from '@/types/subscription/type';

interface CurrentSubscriptionStatusProps {
  activeSubscription: ActiveSubscription;
}

const CurrentSubscriptionStatus: React.FC<CurrentSubscriptionStatusProps> = ({ 
  activeSubscription 
}) => {
  const daysUntilExpiration = () => {
    if (!activeSubscription?.endDate) return 0;
    const end = new Date(activeSubscription.endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = () => {
    const days = daysUntilExpiration();
    if (days <= 7) return "text-red-500";
    if (days <= 30) return "text-amber-500";
    return "text-emerald-500";
  };

  const days = daysUntilExpiration();

  return (
    <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center mb-2">
            <Tag className="text-emerald-500 mr-2" size={20} />
            Current Plan: 
            <span className="ml-2 font-bold text-emerald-600">
              {activeSubscription.subscription.packageName}
            </span>
          </h2>
          <p className="text-gray-600 mb-4">
            Your subscription will {days < 0 ? 'expired' : 'expire'} on {
              activeSubscription.endDate 
                ? new Date(activeSubscription.endDate).toLocaleDateString() 
                : 'N/A'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
          <Clock className={getStatusColor()} size={18} />
          <span className={`font-medium ${getStatusColor()}`}>
            {days < 0 
              ? 'Expired'
              : days <= 0 
                ? 'Expires today' 
                : `${days} days remaining`
            }
          </span>
        </div>
      </div>
      
      {days <= 14 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
          <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-amber-800">
              {days < 0 
                ? 'Your subscription has expired.' 
                : 'Your subscription is ending soon.'}
            </p>
            <p className="text-amber-700 text-sm mt-1">
              Renew now to avoid service interruption and continue enjoying all features.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentSubscriptionStatus;