import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const highlights = [
  "No credit card required",
  "Free 7-day trial",
  "Cancel anytime",
];

export const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden -mt-16">
      {/* Background — extends behind the navbar */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-light via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(235,127,68,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(235,127,68,0.06),transparent_50%)]" />
      {/* Bottom fade to white */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />

      <div className="relative pt-36 pb-16 md:pt-44 md:pb-24 px-4">
        <div className="mx-auto max-w-[85rem] w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image — shown first on mobile */}
            <div className="relative lg:hidden">
              <Image
                src="/images/1.png"
                alt="Settlo POS Interface"
                width={600}
                height={400}
                className="w-full h-auto drop-shadow-xl"
                priority
              />
            </div>

            {/* Text Content */}
            <div className="space-y-6 md:space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight text-gray-900 dark:text-gray-100">
                Run your entire business smarter&mdash;{" "}
                <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                  All in one POS
                </span>
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">
                Save time, cut costs and eliminate guesswork with an efficient
                platform built for modern businesses.
                <br />
                <br />
                Settlo combines market-leading inventory management, a seamless
                point-of-sale system and flexible access business funding&mdash;
                all in one place. <br />
                <span className="font-semibold text-primary">
                  Kesho Yako Ni Kubwa.
                </span>
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/contact-us"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg font-medium border border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:bg-primary-light dark:hover:bg-gray-700 transition-all duration-200"
                >
                  Talk to Sales
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                {highlights.map((text) => (
                  <span
                    key={text}
                    className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* Image — desktop only */}
            <div className="relative hidden lg:block">
              <Image
                src="/images/11.png"
                alt="Settlo POS Interface"
                width={600}
                height={400}
                className="w-full h-auto drop-shadow-xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
