import { Bell, Building2, CalendarClock, CalendarOff, CreditCard, Link2, MapPin, Palette, Printer, Receipt, Settings2, Smartphone, Star, Sun, UtensilsCrossed } from "lucide-react";

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
    {
        id: 'business',
        label: 'Business',
        icon: Building2,
        description: 'Business details & info'
    },
    {
        id: 'business-settings',
        label: 'Business Settings',
        icon: Palette,
        description: 'Branding, defaults & operations'
    },
    {
        id: 'location',
        label: 'Location',
        icon: MapPin,
        description: 'Location details & hours'
    },
    {
        id: 'location-settings',
        label: 'Location Settings',
        icon: Settings2,
        description: 'Operations, POS, orders & tax'
    },
    {
        id: 'day-sessions',
        label: 'Day Sessions',
        icon: Sun,
        description: 'Open & close daily operations'
    },
    {
        id: 'closure-dates',
        label: 'Closure Dates',
        icon: CalendarOff,
        description: 'Scheduled closures & holidays'
    },
    {
        id: 'printing',
        label: 'Printing & Receipts',
        icon: Printer,
        description: 'Dockets, receipts & invoices'
    },
    {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        description: 'Email, SMS & push alerts'
    },
    {
        id: 'loyalty-points',
        label: 'Loyalty Points',
        icon: Star,
        description: 'Customer & staff rewards'
    },
    {
        id: 'efd',
        label: 'EFD',
        icon: Receipt,
        description: 'Tax & fiscal compliance'
    },
    {
        id: 'reservations',
        label: 'Reservations',
        icon: CalendarClock,
        description: 'Booking rules & questions'
    },
    {
        id: 'digital-menu',
        label: 'Digital Menu',
        icon: UtensilsCrossed,
        description: 'Online ordering menus'
    },
    {
        id: 'payments',
        label: 'Payments',
        icon: CreditCard,
        description: 'Accepted payment methods'
    },
    {
        id: 'devices',
        label: 'Devices',
        icon: Smartphone,
        description: 'Linked devices & access'
    },
    {
        id: 'integrations',
        label: 'Integrations',
        icon: Link2,
        description: 'Payment & service integrations'
    },
];
