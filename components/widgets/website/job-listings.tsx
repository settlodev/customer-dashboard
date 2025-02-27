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
import {Job} from "@/types/careers/type";


const JOBS:Job[] = [];

export function JobListings() {
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [locationFilter, setLocationFilter] = useState("all");

    // Get unique departments and locations for filters
    const departments = ["all", ...new Set(JOBS.map(job => job.department))];
    const locations = ["all", ...new Set(JOBS.map(job => job.locationType))];

    // Filter jobs based on selected filters
    const filteredJobs = JOBS.filter(job => {
        const matchesDepartment = departmentFilter === "all" || job.department === departmentFilter;
        const matchesLocation = locationFilter === "all" || job.locationType === locationFilter;
        return matchesDepartment && matchesLocation;
    });

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                    <Select
                        value={departmentFilter}
                        onValueChange={setDepartmentFilter}
                    >
                        <SelectTrigger>
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
                    <Select
                        value={locationFilter}
                        onValueChange={setLocationFilter}
                    >
                        <SelectTrigger>
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

            {/* Job Listings */}
            <div className="grid grid-cols-1 gap-6">
                {filteredJobs.length > 0 ? (
                    filteredJobs.map(job => (
                        <Card key={job.id}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{job.title}</CardTitle>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {job.department} • {job.location}
                                        </div>
                                    </div>
                                    <Badge variant={
                                        job.locationType === "Remote" ? "default" :
                                            job.locationType === "Hybrid" ? "outline" : "secondary"
                                    }>
                                        {job.locationType}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{job.description}</p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {job.tags.map(tag => (
                                        <Badge key={tag} variant="secondary">{tag}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Link href={`/careers/${job.id}`} className="w-full">
                                    <Button variant="outline" className="w-full">
                                        View Position
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No positions found matching your filters.</p>
                        <Button
                            variant="ghost"
                            className="mt-2"
                            onClick={() => {
                                setDepartmentFilter("all");
                                setLocationFilter("all");
                            }}
                        >
                            Reset Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
