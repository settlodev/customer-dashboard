"use client";

import React, { useState, useEffect } from "react";
import {
  Edit,
  MapPin,
  Phone,
  Mail,
  Clock,
  Building,
  Calendar,
  Plus,
  Warehouse,
} from "lucide-react";
import { getWarehouse } from "@/lib/actions/warehouse/list-warehouse";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Loading from "@/components/ui/loading";
import { cn } from "@/lib/utils";

const formatTime = (time: string): string =>
  new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
      {title}
    </p>
    {children}
  </div>
);

const MetricTile = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-3.5 h-3.5 text-gray-400" />
      <p className="text-xs text-gray-400">{label}</p>
    </div>
    <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
  </div>
);

const WarehouseProfile = () => {
  const [warehouse, setWarehouse] = useState<Warehouses | undefined>();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await getWarehouse();
        if (data) setWarehouse(data);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  if (loading) return <Loading />;

  if (!warehouse) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-12">
        <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
            No warehouse found
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Get started by adding your first warehouse.
          </p>
          <Button onClick={() => router.push("/warehouse-profile/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Add warehouse
          </Button>
        </div>
      </div>
    );
  }

  const isActive = warehouse.subscriptionStatus === "OK";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-light dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
              <Warehouse className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-medium text-gray-900 dark:text-white">
                  {warehouse.name}
                </h1>
                <span
                  className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full border",
                    isActive
                      ? "bg-primary-light text-primary border-primary"
                      : "bg-red-50 text-red-700 border-red-200",
                  )}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                {warehouse.city}
                {warehouse.region ? `, ${warehouse.region}` : ""}
                {warehouse.dateCreated
                  ? ` · Since ${formatDate(warehouse.dateCreated)}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => router.push(`/warehouse-profile/${warehouse.id}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit details
            </button>
            <button
              onClick={() => router.push("/warehouse-profile/new")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary  text-white  border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add warehouse
            </button>
          </div>
        </div>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricTile icon={Phone} label="Phone" value={warehouse.phone || "-"} />
        <MetricTile icon={Mail} label="Email" value={warehouse.email || "-"} />
        <MetricTile
          icon={Clock}
          label="Operating hours"
          value={
            warehouse.openingTime && warehouse.closingTime
              ? `${formatTime(warehouse.openingTime)} – ${formatTime(warehouse.closingTime)}`
              : "-"
          }
        />
        <MetricTile
          icon={Calendar}
          label="Date created"
          value={
            warehouse.dateCreated ? formatDate(warehouse.dateCreated) : "-"
          }
        />
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SectionCard title="Location">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
                {warehouse.address || "-"}
              </p>
              <p className="text-sm text-gray-400">
                {warehouse.city}
                {warehouse.region ? `, ${warehouse.region}` : ""}
              </p>
            </div>
          </div>
        </SectionCard>

        {warehouse.description && (
          <SectionCard title="Description">
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border-l-2 border-gray-300 dark:border-gray-600 leading-relaxed">
              {warehouse.description}
            </p>
          </SectionCard>
        )}
      </div>
    </div>
  );
};

export default WarehouseProfile;
