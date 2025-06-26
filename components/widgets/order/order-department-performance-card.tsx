import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BriefcaseBusinessIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface DepartmentPerformanceProps {
    departmentData: Array<{
        name: string;
        value: number;
        profit: number;
        count: number;
    }>;
    colors: string[];
}

export const CompactDepartmentPerformance: React.FC<DepartmentPerformanceProps> = ({
    departmentData = [], // Add default empty array
    colors
}) => {
    // Early return if no data
    if (!departmentData || departmentData.length === 0) {
        return (
            <Card>
                <CardHeader className="border-b">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <BriefcaseBusinessIcon className="text-purple-600" size={20} />
                            Department Analysis
                        </h2>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="text-center text-gray-500 py-8">
                        No department data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Calculate totals and metrics
    const totalRevenue = departmentData.reduce((sum, dept) => sum + dept.value, 0);
    const totalProfit = departmentData.reduce((sum, dept) => sum + dept.profit, 0);
    const isOverallLoss = totalProfit < 0;

    const departmentMetrics = departmentData.map(dept => ({
        ...dept,
        profitMargin: ((dept.profit / dept.value) * 100).toFixed(1),
        isLoss: dept.profit < 0
    })).sort((a, b) => b.value - a.value);

    // Find top and bottom performing departments - now safe since we know array has data
    const topDepartment = departmentMetrics.reduce((prev, current) =>
        (current.profit > prev.profit) ? current : prev
    );

    const bottomDepartment = departmentMetrics.reduce((prev, current) =>
        (current.profit < prev.profit) ? current : prev
    );

    return (
        <Card>
            <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <BriefcaseBusinessIcon className="text-purple-600" size={20} />
                        Department Analysis
                    </h2>
                    <div className="flex items-center gap-2">
                        {isOverallLoss ? (
                            <TrendingDown className="text-red-600" size={18} />
                        ) : (
                            <TrendingUp className="text-emerald-600" size={18} />
                        )}
                        <Badge variant={isOverallLoss ? "destructive" : "default"}>
                            {((totalProfit / totalRevenue) * 100).toFixed(1)}% margin
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-4">
                    {/* Best & Worst Performers */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <span className="text-sm text-gray-600">Top Performer</span>
                            <p className="font-medium truncate">{topDepartment.name}</p>
                            <p className="text-sm text-emerald-600">
                                {parseFloat(topDepartment.profitMargin) > 0 && '+'}
                                {topDepartment.profitMargin}%
                            </p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg">
                            <span className="text-sm text-gray-600">Needs Attention</span>
                            <p className="font-medium truncate">{bottomDepartment.name}</p>
                            <p className="text-sm text-red-600">
                                {bottomDepartment.profitMargin}%
                            </p>
                        </div>
                    </div>

                    {/* Department List */}
                    <div className="space-y-2">
                        {departmentMetrics.map((dept, index) => (
                            <div
                                key={dept.name}
                                className="p-2 bg-gray-50 rounded-lg flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: colors[index % colors.length] }}
                                    />
                                    <span className="text-sm font-medium truncate max-w-[120px]">
                                        {dept.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600">
                                        {Intl.NumberFormat(undefined, {
                                            notation: 'compact',
                                            maximumFractionDigits: 1
                                        }).format(dept.value)}
                                    </span>
                                    <span className={`text-sm font-medium ${
                                        dept.isLoss ? 'text-red-600' : 'text-emerald-600'
                                    }`}>
                                        {dept.profitMargin}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default CompactDepartmentPerformance;