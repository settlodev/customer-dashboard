"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Briefcase } from "lucide-react";
import { Job } from "@/types/careers/type";

const JOBS: Job[] = [];

export function JobListings() {
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [locationFilter, setLocationFilter] = useState("all");

    const departments = ["all", ...new Set(JOBS.map(job => job.department))];
    const locations = ["all", ...new Set(JOBS.map(job => job.locationType))];

    const filteredJobs = JOBS.filter(job => {
        const matchesDepartment = departmentFilter === "all" || job.department === departmentFilter;
        const matchesLocation = locationFilter === "all" || job.locationType === locationFilter;
        return matchesDepartment && matchesLocation;
    });

    return (
        <div className="space-y-6">
            {JOBS.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-1/3">
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map(dept => (
                                    <SelectItem key={dept} value={dept}>
                                        {dept === "all" ? "All Departments" : dept}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-1/3">
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Location Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map(loc => (
                                    <SelectItem key={loc} value={loc}>
                                        {loc === "all" ? "All Locations" : loc}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-5">
                {filteredJobs.length > 0 ? (
                    filteredJobs.map(job => (
                        <Card key={job.id} className="rounded-xl border-gray-200 dark:border-gray-800 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {job.department} &middot; {job.location}
                                        </div>
                                    </div>
                                    <Badge
                                        variant={
                                            job.locationType === "Remote" ? "default" :
                                                job.locationType === "Hybrid" ? "outline" : "secondary"
                                        }
                                        className="rounded-lg"
                                    >
                                        {job.locationType}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{job.description}</p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {job.tags.map(tag => (
                                        <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-primary/5 text-primary font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Link href={`/careers/${job.id}`} className="w-full">
                                    <Button variant="outline" className="w-full rounded-xl">
                                        View Position
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                            <Briefcase className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            No open positions right now
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-sm">
                            We&lsquo;re not hiring at the moment, but check back soon. New opportunities are always around the corner.
                        </p>
                        {JOBS.length > 0 && (
                            <Button
                                variant="ghost"
                                className="mt-4 text-sm text-primary hover:text-primary/80"
                                onClick={() => {
                                    setDepartmentFilter("all");
                                    setLocationFilter("all");
                                }}
                            >
                                Reset Filters
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
