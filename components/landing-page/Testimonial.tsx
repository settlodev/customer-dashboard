import Image from "next/image";
import { Quote } from 'lucide-react';
import React from "react";
import { Button } from "@/components/ui/button"
import Link from "next/link";

interface Testimonial {
    id: number;
    name: string;
    title: string;
    text: string;
    image: string;
}

const testimonials: Testimonial[] = [
    {
        id: 1,
        name: 'Yolanda',
        title: 'Business Owner',
        text: 'I travel a lot, hivyo Settlo inanisaidia ku-access sales na pia kuangalia inventory. \n Lakini pia, huwa natumia app kuhakikisha kwamba naona kitu gani kinauzika zaidi. Hii inanisaidia kupanga ratiba yangu ya kutengeneza au kuagiza bidhaa, \n I will always choose Settlo.',
        image: 'https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=76&q=80',
    },
    {
        id: 2,
        name: 'White',
        title: 'Business Owner',
        text: 'Wafanyakazi waliiba na wakaiba tena. Baada ya kuweka Settlo wakaacha kazi....sababu ukitumia Settlo hata nisipokua dukani naona kila kinachoendelea',
        image: 'https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=76&q=80',
    },
    {
        id: 3,
        name: 'Roras',
        title: 'Sales manager',
        text: 'Settlo inanisaidia kufanya mauzo na kurekodi taarifa za mauzo ili kutoa ripoti kwa bosi wangu. \n Sababu ni kwamba hata kama hayupo dukani, anaweza kuona kinachoendelea. Hata kabla sijampigia simu, anaweza kuona kabisa ni bidhaa gani zimebaki na zipi zinahitaji kununuliwa.',
        image: 'https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=76&q=80',
    }
];

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => {
    return (
        <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            {/* Quote Icon */}
            <div className="absolute -top-4 -right-4 bg-emerald-500 rounded-full p-3 shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-300">
                <Quote className="w-5 h-5 text-white" />
            </div>

            {/* Testimonial Text */}
            <div className="mb-8">
                <p className="text-gray-700 leading-relaxed">
                    {testimonial.text}
                </p>
            </div>

            {/* Author Info */}
            <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-emerald-100">
                    <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                    />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600">{testimonial.title}</p>
                </div>
            </div>
        </div>
    );
};

export const Testimonials: React.FC = () => {
    return (
        <section id="testimonials" className="bg-white py-24 w-full">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                        What Our Clients Say
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Discover how Settlo is transforming businesses across Tanzania through the
                        experiences of our valued clients.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {testimonials.map((testimonial) => (
                        <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                    ))}
                </div>

                {/* Call to Action */}
                <div className="text-center mt-16">
                    <p className="text-gray-600 mb-6">
                        Join thousands of satisfied businesses using Settlo
                    </p>
                    <Button  asChild className="inline-flex items-center px-6 py-3 bg-emerald-500 text-white rounded-full font-medium hover:bg-emerald-600 transition-all duration-200 transform hover:scale-105">
                        <Link href="/register">Start Your Free Trial</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
};
