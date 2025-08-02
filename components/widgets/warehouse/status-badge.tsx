import { Clock, CheckCircle, XCircle } from 'lucide-react';
  
export const StatusBadge = ({ status }: { status: string }) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'PENDING':
          return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
        case 'APPROVED':
          return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
        case 'CANCELLED':
          return { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle };
        default:
          return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock };
      }
    };
  
    const config = getStatusConfig(status);
    const Icon = config.icon;
  
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon className="w-4 h-4" />
        {status}
      </span>
    );
  };
  
