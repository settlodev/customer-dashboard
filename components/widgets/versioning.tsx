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
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 dark:hover:bg-emerald-950/50';
            case 'preview':
                return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900 dark:hover:bg-amber-950/50';
            default:
                return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-950/50';
        }
    };

    if (isProd) {
        return (
            <div className="w-full mt-7">
                <Badge
                    variant="outline"
                    className="flex items-center gap-2 px-3 py-1.5 rounded w-full bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 dark:hover:bg-emerald-950/50"
                >
                    <span className="text-emerald-600 dark:text-emerald-400">Version:</span>
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
                    className="flex flex-col gap-1 bg-background border shadow-lg"
                >
                    <p className="font-medium text-ink">Build Information</p>
                    <div className="text-xs space-y-1">
                        <p className="text-ink-2">Commit: <span className="font-mono">{buildInfo.buildId}</span></p>
                        <p className="text-ink-2">Environment: <span className="font-medium">{buildInfo.environment}</span></p>
                        {buildInfo.buildNumber && (
                            <p className="text-ink-2">Branch: <span className="font-medium">{buildInfo.buildNumber}</span></p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default VersionDisplay;
