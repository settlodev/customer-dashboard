export function CareerHero() {
    return (
        <section className="relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-pattern-gray/20 -z-10 pointer-events-none" />

            <div className="relative bg-gradient-to-b from-primary/10 to-background rounded-xl p-8 md:p-12 overflow-hidden">
                <div className="max-w-3xl">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
                        Join our team
                    </h1>
                    <p className="text-xl text-muted-foreground mb-6">
                        We are building a culture where innovative minds thrive. Join us in creating solutions that matter and shape the future together.
                    </p>
                </div>

                {/* Decorative Element */}
                <div className="hidden md:block absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-primary/20 to-transparent -z-10" />
            </div>
        </section>
    );
}
