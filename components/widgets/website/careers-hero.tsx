export function CareerHero() {
    return (
        <section className="pt-4 md:pt-8">
            <h1
                className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4"
                style={{ lineHeight: "1.35" }}
            >
                Join our{" "}
                <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                    team
                </span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
                We are building a culture where innovative minds thrive.
                Join us in creating solutions that matter and shape the future together.
            </p>
        </section>
    );
}
