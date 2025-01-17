"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MessageCircle } from 'lucide-react';

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
    isOpen: boolean;
    onClick: () => void;
}> = ({ item, isOpen, onClick }) => {
    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                className="w-full py-6 text-left transition-all duration-200 hover:text-emerald-600"
                onClick={onClick}
            >
                <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">{item.question}</span>
                    <ChevronDown
                        className={`w-5 h-5 text-emerald-500 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                        }`}
                    />
                </div>
            </button>
            <div
                className={`grid transition-all duration-300 ${
                    isOpen ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
                <div className="overflow-hidden">
                    <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                </div>
            </div>
        </div>
    );
};

export const FAQS: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="relative w-full overflow-hidden py-24">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-white" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.1),transparent_50%)]" />
            </div>

            <div className="relative container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 max-w-7xl mx-auto">
                    <div className="lg:sticky lg:top-8 lg:self-start space-y-8">
                        <div className="space-y-6 max-w-xl">
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                                Frequently Asked Questions
                            </h2>
                            <p className="text-xl text-gray-600">
                                We&lsquo;ve compiled answers to some of the most common questions to help you get started.
                                If you can&lsquo;t find what you&lsquo;re looking for, our support team is here to help.
                            </p>
                        </div>

                        <div className="flex flex-col space-y-4">
                            <Link
                                href="/contact"
                                className="inline-flex items-center px-6 py-3 bg-emerald-500 text-white rounded-full font-medium hover:bg-emerald-600 transition-all duration-200 transform hover:scale-105 w-fit"
                            >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Talk to Sales
                            </Link>
                            <span className="text-sm text-gray-500">
                                Available Monday to Friday, 9am to 5pm EAT
                            </span>
                        </div>
                    </div>

                    {/* Right Column - FAQ Items */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-emerald-100/20">
                        <div className="space-y-1 divide-y divide-gray-100">
                            {questions.map((item, index) => (
                                <AccordionItem
                                    key={index}
                                    item={item}
                                    isOpen={openIndex === index}
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
