"use client"

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
}

const questions: FAQItem[] = [
    {
        question: "What is Settlo?",
        answer: "Settlo is an all-in-one business platform that combines point-of-sale, inventory management, and flexible business funding. It's built for businesses that need to sell, track stock, and manage operations from one place instead of stitching together separate tools."
    },
    {
        question: "How does Settlo work?",
        answer: "You sign up for a free 7-day trial (no credit card required), set up your business and locations, and start selling through the POS. Sales, stock levels, and staff activity sync in real time, so your inventory, reports, and cash flow always reflect what's actually happening in-store."
    },
    {
        question: "What features does Settlo offer?",
        answer: "Settlo covers point-of-sale and checkout, real-time inventory across multiple locations, procurement (RFQs, purchase orders, and goods receiving), full accounting (ledger, invoicing, and financial reports), sales and performance analytics, customer profiles and loyalty, and access to business funding — all in one platform."
    },
    {
        question: "What payment methods does Settlo support?",
        answer: "At checkout, Settlo accepts cash, card, and mobile money. For invoice and subscription payments, we support Airtel Money, Mixx by Yas, and Vodacom M-Pesa."
    },
    {
        question: "Can I use Settlo for my business?",
        answer: "Yes — Settlo scales from a single store to multiple locations and warehouses, with plans to match each stage. Start with a free 7-day trial, no credit card required, and cancel anytime."
    },
];

const AccordionItem: React.FC<{
    item: FAQItem;
    index: number;
    isOpen: boolean;
    onClick: () => void;
}> = ({ item, index, isOpen, onClick }) => {
    return (
        <div
            className={`rounded-2xl transition-all duration-300 ${
                isOpen
                    ? "bg-white dark:bg-gray-800 shadow-md"
                    : "bg-transparent hover:bg-white/60 dark:hover:bg-gray-800/60"
            }`}
        >
            <button
                className="w-full px-6 py-5 text-left flex items-center gap-4"
                onClick={onClick}
            >
                <span className="text-sm font-semibold text-primary/60 w-6 flex-shrink-0">
                    {String(index + 1).padStart(2, '0')}
                </span>
                <span className={`flex-grow text-base font-semibold transition-colors duration-200 ${
                    isOpen ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
                }`}>
                    {item.question}
                </span>
                <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        isOpen
                            ? "bg-primary text-white rotate-0"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    }`}
                >
                    {isOpen ? (
                        <Minus className="w-4 h-4" strokeWidth={2.5} />
                    ) : (
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                    )}
                </div>
            </button>
            <div
                className={`grid transition-all duration-300 ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
                <div className="overflow-hidden">
                    <p className="px-6 pb-6 pl-16 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {item.answer}
                    </p>
                </div>
            </div>
        </div>
    );
};

export const FAQS: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faqs" className="relative w-full overflow-hidden py-24">
            <div className="absolute inset-0 bg-gradient-to-b from-primary-light via-white to-primary-light dark:from-gray-900 dark:via-gray-950 dark:to-gray-900" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(235,127,68,0.06),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(235,127,68,0.08),transparent_50%)]" />

            <div className="relative max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-14">
                    <h2
                        className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4"
                        style={{ lineHeight: '1.35' }}
                    >
                        Frequently asked{" "}
                        <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                            questions
                        </span>
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                        Find quick and clear answers to the most common questions about Settlo.
                    </p>
                </div>

                {/* Accordion */}
                <div className="space-y-3">
                    {questions.map((item, index) => (
                        <AccordionItem
                            key={index}
                            item={item}
                            index={index}
                            isOpen={openIndex === index}
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
