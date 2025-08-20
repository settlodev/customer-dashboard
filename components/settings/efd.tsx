'use client'
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { EfdSettingsFormData } from "@/types/efd/schema";
import EfdSettingsForm from "../forms/efd_setting_form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const EFDSettings = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [initialData] = useState<Partial<EfdSettingsFormData>>({});
    const session = useSession();

   
    useEffect(() => {
        const loadSettings = async () => {
            
            if (session.status === "loading") return;
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setIsLoading(false);
        };

        loadSettings();
    }, [session.status, session.data]);
  
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
                        
                        initialData={initialData}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default EFDSettings;