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
        answer: "Settlo is a mobile POS solution that allows businesses to accept payments, manage inventory, and track sales. It is a powerful tool that can help businesses increase their sales and customer base."
    },
    {
        question: "How does Settlo work?",
        answer: "Settlo works by allowing businesses to accept payments, manage inventory, and track sales. It is a powerful tool that can help businesses increase their sales and customer base."
    },
    {
        question: "What features does Settlo offer?",
        answer: "Settlo offers a range of features, including inventory management, sales reporting, and customer relationship management."
    },
    {
        question: "What payment methods does Settlo support?",
        answer: "Settlo supports multiple payment methods, including cash, cards, and mobile payments."
    },
    {
        question: "Can I use Settlo for my business?",
        answer: "Yes, Settlo is a powerful tool that can help businesses increase their sales and customer base. It is available for both online and in-store sales."
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
