import { Customer, CustomerPreference, CUSTOMER_SOURCE_LABELS, CUSTOMER_CREATED_FROM_LABELS } from "@/types/customer/type";
import { getCustomerById, fetchCustomerPreferences } from "@/lib/actions/customer-actions";
import { UUID } from "node:crypto";
import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomerSummary from "@/components/widgets/customer-summary";
import CustomerForm from "@/components/forms/customer_form";
import Link from "next/link";
import {
  Edit,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Building2,
  User,
  CreditCard,
  Star,
  Bell,
  BellOff,
  FileText,
} from "lucide-react";
import { CustomerSource, CustomerCreatedFrom } from "@/types/enums";

type Params = Promise<{ id: string }>;

export default async function CustomerPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";

  if (isNewItem) {
    const breadCrumbItems = [
      { title: "Customers", link: "/customers" },
      { title: "New", link: "" },
    ];
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="relative flex-1">
            <BreadcrumbsNav items={breadCrumbItems} />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Add Customer</CardTitle>
            <CardDescription>Add a new customer to your business</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerForm item={null} />
          </CardContent>
        </Card>
      </div>
    );
  }

  let item: Customer | null = null;
  let preferences: CustomerPreference[] = [];

  try {
    const customerId = resolvedParams.id as UUID;
    const [customer, prefs] = await Promise.all([
      getCustomerById(customerId),
      fetchCustomerPreferences(customerId),
    ]);
    item = customer;
    preferences = prefs ?? [];
  } catch (error) {
    console.log(error);
    throw new Error("Failed to load customer details");
  }

  if (!item) notFound();

  const breadCrumbItems = [
    { title: "Customers", link: "/customers" },
    { title: item.firstName + " " + item.lastName, link: "" },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1">
          <BreadcrumbsNav items={breadCrumbItems} />
        </div>
        <Link href={`/customers/${item.id}/edit`}>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Customer
          </Button>
        </Link>
      </div>

      {/* Customer Name & Status */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {item.firstName} {item.lastName}
          </h1>
          {item.customerAccountNumber && (
            <p className="text-sm text-muted-foreground font-mono">
              {item.customerAccountNumber}
            </p>
          )}
        </div>
        <Badge
          variant={item.status ? "default" : "secondary"}
          className={
            item.status
              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              : ""
          }
        >
          {item.status ? "Active" : "Inactive"}
        </Badge>
        {item.customerGroupName && (
          <Badge variant="secondary">{item.customerGroupName}</Badge>
        )}
      </div>

      {/* Summary Cards */}
      <CustomerSummary customer={item} />

      {/* Detail Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow icon={Phone} label="Phone" value={item.phoneNumber} />
            <DetailRow icon={Mail} label="Email" value={item.email} />
            <DetailRow label="Gender" value={item.gender} />
            <DetailRow
              icon={Calendar}
              label="Date of Birth"
              value={
                item.dateOfBirth
                  ? new Date(item.dateOfBirth).toLocaleDateString()
                  : null
              }
            />
            <DetailRow label="Seating Preference" value={item.seatingPreference} />
            <DetailRow
              label="Source"
              value={
                item.source
                  ? CUSTOMER_SOURCE_LABELS[item.source as CustomerSource]
                  : null
              }
            />
            <DetailRow
              label="Created From"
              value={
                item.createdFrom
                  ? CUSTOMER_CREATED_FROM_LABELS[item.createdFrom as CustomerCreatedFrom]
                  : null
              }
            />
            <DetailRow
              label="Notifications"
              value={item.allowNotifications ? "Enabled" : "Disabled"}
              icon={item.allowNotifications ? Bell : BellOff}
            />
          </CardContent>
        </Card>

        {/* Financial & Loyalty */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Financial & Loyalty
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow
              label="Credit Limit"
              value={
                item.creditLimit != null
                  ? item.creditLimit.toLocaleString()
                  : null
              }
            />
            <DetailRow
              icon={Star}
              label="Loyalty Points"
              value={
                item.loyaltyPoints != null
                  ? item.loyaltyPoints.toLocaleString()
                  : "0"
              }
            />
            <DetailRow
              label="No-Show Count"
              value={item.noShowCount?.toString()}
            />
            <DetailRow
              label="Last Visit"
              value={
                item.lastVisit
                  ? new Date(item.lastVisit).toLocaleDateString()
                  : null
              }
            />
            <DetailRow
              label="Last Reservation"
              value={
                item.lastReservationDate
                  ? new Date(item.lastReservationDate).toLocaleDateString()
                  : null
              }
            />
          </CardContent>
        </Card>

        {/* Identification */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Identification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="ID Type" value={item.idType} />
            <DetailRow label="ID Number" value={item.idNumber} />
            <DetailRow label="TIN Number" value={item.tinNumber} />
            <DetailRow label="VRN" value={item.vrn} />
          </CardContent>
        </Card>

        {/* Company Association */}
        {item.isCompanyAssociated && (
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Company Association
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Company Name" value={item.companyName} />
              <DetailRow
                label="Registration Number"
                value={item.companyRegistrationNumber}
              />
              <DetailRow
                label="Company Email"
                value={item.companyEmailAddress}
              />
              <DetailRow
                label="Physical Address"
                value={item.companyPhysicalAddress}
              />
            </CardContent>
          </Card>
        )}

        {/* Addresses */}
        {item.addresses && item.addresses.length > 0 && (
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.addresses.map((addr) => (
                <div
                  key={addr.id as string}
                  className="flex items-start justify-between"
                >
                  <div>
                    <p className="text-sm">{addr.addressLine}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {addr.addressType}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Preferences */}
        {preferences.length > 0 && (
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {preferences.map((pref) => (
                <DetailRow
                  key={pref.id as string}
                  label={pref.preferenceKey}
                  value={pref.preferenceValue}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes */}
      {item.notes && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              Staff Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {item.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {value || "—"}
      </span>
    </div>
  );
}
