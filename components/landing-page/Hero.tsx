import Link from 'next/link';
import Image from 'next/image';
import {ArrowRight} from "lucide-react";

export const Hero = () => {
    return (
        <section className="relative w-full overflow-hidden">
            {/* Background gradient with animation */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50 to-emerald-100 opacity-70">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.15),transparent_50%)]" />
            </div>

            <div className="relative pt-32 pb-16 px-4">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                                Transform your business with{' '}
                                <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                  the ultimate POS solution
                </span>
                            </h1>

                            <p className="text-xl text-gray-600 leading-relaxed">
                                Streamline operations, boost sales, and gain powerful insights with Settlo's
                                intuitive point-of-sale system designed for modern businesses.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <Link href="/register">
                                    <button className="px-8 py-3 bg-emerald-500 text-white rounded-full font-medium hover:bg-emerald-600 transition-all duration-200 transform hover:scale-105 flex items-center">
                                        Start Free Trial
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </button>
                                </Link>
                                <Link href="/contact">
                                    <button className="px-8 py-3 bg-white text-gray-800 rounded-full font-medium border-2 border-emerald-500 hover:bg-emerald-50 transition-all duration-200">
                                        Talk to Sales
                                    </button>
                                </Link>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-emerald-300/10 rounded-2xl blur-xl" />
                            <Image
                                className="relative rounded-2xl shadow-xl"
                                src="/images/user/hero3.jpg"
                                alt="Settlo POS Interface"
                                width={600}
                                height={400}
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

