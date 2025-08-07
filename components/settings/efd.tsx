'use client'
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { EfdSettingsFormData } from "@/types/efd/schema";
import EfdSettingsForm from "../forms/efd_setting_form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const EFDSettings = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [initialData, setInitialData] = useState<Partial<EfdSettingsFormData>>({});
    const session = useSession();

    // Load existing settings
    useEffect(() => {
        const loadSettings = async () => {
            // Wait for session to load first
            if (session.status === "loading") return;
            
            // Simulate API call to load existing EFD settings
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // You can set existing values here if they exist
            // const existingSettings = {
            //     isEfdEnabled: true,
            //     businessName: "Example Business",
            //     tin: "123456789",
            //     email: session.data?.user?.email || "business@example.com",
            //     phoneNumber: session.data?.user?.phoneNumber || "+255712345678",
            // };
            // setInitialData(existingSettings);
            
            setIsLoading(false);
        };

        loadSettings();
    }, [session.status, session.data]);

    const handleSubmit = async (data: EfdSettingsFormData) => {
        try {
            console.log("Submitting EFD settings:", data);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Handle success - you can show a toast notification here
            alert("EFD settings saved successfully!");
        } catch (error) {
            console.error("Error saving EFD settings:", error);
            // Handle error - you can show an error toast here
            alert("Failed to save EFD settings. Please try again.");
        }
    };
    
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-semibold">EFD Settings</h2>
                    <p className="text-muted-foreground mt-1">
                        Loading EFD settings...
                    </p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>EFD Configuration</CardTitle>
                    <CardDescription>
                        Enable EFD for your business and provide the required information
                        to comply with tax regulations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EfdSettingsForm 
                        onSubmit={handleSubmit}
                        initialData={initialData}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default EFDSettings;