

function CustomerLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
        <main className="lg:pl-[256px]">
            {children}
        </main>
        </>
    )
}

export default CustomerLayout
