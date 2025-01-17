import React from 'react';
import { MapPin, Clock, Phone, Mail } from 'lucide-react';

export const LocationSection = () => {
    return (
        <section className="relative w-full h-[800px]">
            <div className="absolute inset-0 w-full h-full">
                <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.8880255231497!2d39.2491219!3d-6.7793289!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x185c4d1423209e71%3A0xf723736fe933f716!2sSettlo%20Technologies%20Ltd!5e0!3m2!1sen!2s!4v1705520169789!5m2!1sen!2s"
                    className="w-full h-full grayscale"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </div>

            <div className="absolute inset-0 bg-emerald-400/10 z-10" />

            {/* Content container */}
            <div className="relative z-20 container mx-auto px-4 h-full pt-24">
                <div className="ml-auto w-full max-w-lg">
                    <div className="bg-white rounded-2xl p-8 shadow-xl space-y-8">
                        {/* Title Section */}
                        <div className="border-b border-gray-100 pb-6">
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                                Visit Our Office
                            </h2>
                            <p className="text-lg text-gray-600">
                                Come visit us at our headquarters in Dar Es Salaam
                            </p>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="rounded-full p-2 bg-emerald-100 mt-1">
                                    <MapPin className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-gray-900">Address</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        8th Floor Noble Center Building,<br />
                                        Plot # 89 Block 45B,<br />
                                        P.O. Box 8059,<br />
                                        Dar Es Salaam, United Republic of Tanzania
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="rounded-full p-2 bg-emerald-100 mt-1">
                                    <Clock className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-gray-900">Business Hours</h3>
                                    <p className="text-gray-600">
                                        Monday - Friday: 9:00 AM - 5:00 PM<br />
                                        Saturday - Sunday: Closed
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="rounded-full p-2 bg-emerald-100 mt-1">
                                    <Phone className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-gray-900">Phone</h3>
                                    <a
                                        href="tel:+255788000000"
                                        className="text-emerald-600 hover:text-emerald-700 transition-colors"
                                    >
                                        +255 788 000 000
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="rounded-full p-2 bg-emerald-100 mt-1">
                                    <Mail className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-gray-900">Email</h3>
                                    <a
                                        href="mailto:support@settlo.co.tz"
                                        className="text-emerald-600 hover:text-emerald-700 transition-colors"
                                    >
                                        support@settlo.co.tz
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                                Need help? Visit our{' '}
                                <a href="/help" className="text-emerald-600 hover:text-emerald-700 transition-colors">
                                    Help Center
                                </a>
                                {' '}or{' '}
                                <a href="/contact" className="text-emerald-600 hover:text-emerald-700 transition-colors">
                                    contact support
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
