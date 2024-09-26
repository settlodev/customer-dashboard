import React from "react";

export default function DashboardLayout({children}: Readonly<{ children: React.ReactNode }>) {
    return (
        <div style={{padding: 50}}>
            <div>

            </div>
            <div>
                {children}
            </div>
        </div>
    )
}
