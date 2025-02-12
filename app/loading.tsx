import React from 'react';
import { Loader2Icon } from "lucide-react";

const Loading = () => {
    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
            <Loader2Icon className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-emerald-600 font-medium">Loading...</p>
        </div>
    );
};

export default Loading;
