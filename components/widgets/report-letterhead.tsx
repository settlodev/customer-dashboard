import React from "react";
import { Building2, MapPin, Phone, Mail } from "lucide-react";
import { Business } from "@/types/business/type";
import { Location } from "@/types/location/type";

interface ReportLetterheadProps {
  business: Business;
  location: Location;
}

const ReportLetterhead = ({ business, location }: ReportLetterheadProps) => {
  const hasAddress = location.address || location.region;
  const hasTaxDetails = business.identifier;

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-4 rounded-lg bg-gray-100 dark:bg-gray-800 px-5 py-4">
      {/* Business / Location info */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {business.name}
          </span>
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          {location.name}
        </p>
        {hasAddress && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-muted-foreground">
              {[location.address, location.region]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 pl-6">
          {location.phoneNumber && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-muted-foreground">
                {location.phoneNumber}
              </span>
            </div>
          )}
          {location.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-muted-foreground">
                {location.email}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tax details */}
      {hasTaxDetails && (
        <div className="sm:text-right space-y-1">
          {business.identifier && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-gray-900 dark:text-gray-100">ID:</span>{" "}
              {business.identifier}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportLetterhead;
