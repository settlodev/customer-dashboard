'use client'
import { useState } from "react";
import { EfdSettingsFormData } from "@/types/efd/schema";
import EfdSettingsForm from "../forms/efd_setting_form";

const EFDSettings = () => {
    const [initialData] = useState<Partial<EfdSettingsFormData>>({});

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">EFD</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Electronic Fiscal Device configuration and tax compliance
                </p>
            </div>

            <EfdSettingsForm initialData={initialData} />
        </div>
    );
};

export default EFDSettings;
