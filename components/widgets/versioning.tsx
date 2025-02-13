import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Box, GitBranch } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { getBuildInfo } from '@/lib/utils';

const VersionDisplay = () => {
    const buildInfo = getBuildInfo();
    const isProd = buildInfo.environment === 'production';

    const getEnvironmentColor = () => {
        switch (buildInfo.environment) {
            case 'production':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
            case 'preview':
                return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
            default:
                return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
        }
    };

    if (isProd) {
        return (
            <div className="w-full mt-7">
                <Badge
                    variant="outline"
                    className="flex items-center gap-2 px-3 py-1.5 rounded w-full bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                >
                    <span className="text-emerald-600">Version:</span>
                    <Box className="w-3 h-3" />
                    <span className="font-mono">{buildInfo.buildId?.slice(0, 7)}</span>
                </Badge>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="w-full mt-7">
                        <Badge
                            variant="outline"
                            className={`flex items-center gap-2 px-3 py-1.5 rounded w-full ${getEnvironmentColor()}`}
                        >
                            <GitBranch className="w-3 h-3" />
                            <span>Version:</span>
                            <span className="font-mono">{buildInfo.buildId?.slice(0, 7)}</span>
                        </Badge>
                    </div>
                </TooltipTrigger>
                <TooltipContent
                    side="bottom"
                    className="flex flex-col gap-1 bg-white border shadow-lg"
                >
                    <p className="font-medium text-gray-900">Build Information</p>
                    <div className="text-xs space-y-1">
                        <p className="text-gray-600">Commit: <span className="font-mono">{buildInfo.buildId}</span></p>
                        <p className="text-gray-600">Environment: <span className="font-medium">{buildInfo.environment}</span></p>
                        {buildInfo.buildNumber && (
                            <p className="text-gray-600">Branch: <span className="font-medium">{buildInfo.buildNumber}</span></p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default VersionDisplay;
