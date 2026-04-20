import { ArrowLeftRight, Bell, Boxes, Building2, CalendarClock, CalendarOff, Calculator, CreditCard, Link2, MapPin, Monitor, Palette, Printer, Receipt, RotateCcw, ShoppingBag, Smartphone, Star, Sun, UtensilsCrossed } from "lucide-react";

export const taxClasses=
    [
        {
            "name" : "A",
            "displayName" : "Class A",
            "amount" : 18.0,
            "description" : "Standard Rate for VAT items"
        },
        {
            "name" : "B",
            "displayName" : "Class B",
            "amount" : 0.0,
            "description" : "Special Rate"
        },
        {
            "name" : "C",
            "displayName" : "Class C",
            "amount" : 0.0,
            "description" : "Zero rated for Non-VAT items"
        },
        {
            "name" : "D",
            "displayName" : "Class D",
            "amount" : 0.0,
            "description" : "Special Relief for relieved items"
        },
        {
            "name" : "E",
            "displayName" : "Class E",
            "amount" : 0.0,
            "description" : "Exempt items"
        },
        {
            "name" : "ZANZIBAR",
            "displayName" : "Zanzibar",
            "amount" : 15.0,
            "description" : "Zanzibar Tax Rates"
        }
    ];

export const businessTimes=
[
    {"name": "00:00", "label": "12:00 AM"},
    {"name": "01:00", "label": "01:00 AM"},
    {"name": "02:00", "label": "02:00 AM"},
    {"name": "03:00", "label": "03:00 AM"},
    {"name": "04:00", "label": "04:00 AM"},
    {"name": "05:00", "label": "05:00 AM"},
    {"name": "06:00", "label": "06:00 AM"},
    {"name": "07:00", "label": "07:00 AM"},
    {"name": "08:00", "label": "08:00 AM"},
    {"name": "09:00", "label": "09:00 AM"},
    {"name": "10:00", "label": "10:00 AM"},
    {"name": "11:00", "label": "11:00 AM"},
    {"name": "12:00", "label": "12:00 PM"},
    {"name": "13:00", "label": "01:00 PM"},
    {"name": "14:00", "label": "02:00 PM"},
    {"name": "15:00", "label": "03:00 PM"},
    {"name": "16:00", "label": "04:00 PM"},
    {"name": "17:00", "label": "05:00 PM"},
    {"name": "18:00", "label": "06:00 PM"},
    {"name": "19:00", "label": "07:00 PM"},
    {"name": "20:00", "label": "08:00 PM"},
    {"name": "21:00", "label": "09:00 PM"},
    {"name": "22:00", "label": "10:00 PM"},
    {"name": "23:00", "label": "11:00 PM"}
  ];


export const DefaultCountry = "02981a7e-f714-40d5-b132-5762c066e12c";
export const ItemStatuses = [
    {"name": "Active", "value": true},
    {"name": "In-Active", "value": false}
];

export const settingsNavItems = [
    // Business-level (not location scope)
    { id: 'business', label: 'Business', icon: Building2, description: 'Business details & info' },
    { id: 'business-settings', label: 'Business Settings', icon: Palette, description: 'Branding & business-wide defaults' },

    // Location-level — rebuilt against new Accounts Service location settings API
    { id: 'location', label: 'Location profile', icon: MapPin, description: 'Location details, currency, operating hours' },
    { id: 'orders-pos', label: 'Orders & POS', icon: ShoppingBag, description: 'How orders behave on the POS' },
    { id: 'dockets', label: 'Dockets & tickets', icon: Monitor, description: 'Kitchen / bar ticket formatting' },
    { id: 'receipts', label: 'Receipts & invoicing', icon: Printer, description: 'Receipts, invoices, tax' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email, SMS & push alerts' },
    { id: 'loyalty-points', label: 'Loyalty & rewards', icon: Star, description: 'Customer and staff points' },
    { id: 'stock-inventory', label: 'Stock & inventory', icon: Boxes, description: 'Deduction timing & inventory flags' },
    { id: 'day-sessions', label: 'Day sessions', icon: Sun, description: 'Open, close, settlement' },
    { id: 'closure-dates', label: 'Closure dates', icon: CalendarOff, description: 'Scheduled closures & holidays' },
    { id: 'accounting', label: 'Accounting mappings', icon: Calculator, description: 'Payment methods → GL & product revenue routing' },
    { id: 'exchange-rates', label: 'Exchange rates', icon: ArrowLeftRight, description: 'Manual rate overrides for multi-currency' },
    { id: 'danger-zone', label: 'Danger zone', icon: RotateCcw, description: 'Reset all location settings' },

    // Not in scope of this rebuild but still accessible
    { id: 'efd', label: 'EFD', icon: Receipt, description: 'Tax & fiscal compliance' },
    { id: 'reservations', label: 'Reservations', icon: CalendarClock, description: 'Booking rules & questions' },
    { id: 'digital-menu', label: 'Digital menu', icon: UtensilsCrossed, description: 'Online ordering menus' },
    { id: 'payments', label: 'Payment methods', icon: CreditCard, description: 'Accepted payment methods' },
    { id: 'devices', label: 'Devices', icon: Smartphone, description: 'Linked devices & access' },
    { id: 'integrations', label: 'Integrations', icon: Link2, description: 'Service integrations' },
];
