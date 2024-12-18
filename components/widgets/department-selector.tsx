"use client"

import React, { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Plus, Tag } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Department } from "@/types/department/type";
import { fectchAllDepartments, createDepartment } from "@/lib/actions/department-actions";
import { FormError } from "@/components/widgets/form-error";
import { usePathname } from 'next/navigation';
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import { Card, CardContent } from "../ui/card";

interface DepartmentSelectorProps {
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
}

const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
                                                                   placeholder,
                                                                   isRequired,
                                                                   value,
                                                                   isDisabled,
                                                                   description,
                                                                   onChange,
                                                               }) => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDepartmentName, setNewDepartmentName] = useState("");
    const [color, setColor] = useState("#000000");
    const [imageUrl, setImageUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const pathname = usePathname();

    const loadDepartments = async () => {
        try {
            setIsLoading(true);
            const fetchedDepartments = await fectchAllDepartments();
            setDepartments(fetchedDepartments ?? []);
        } catch (error: any) {
            console.log("Error fetching departments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDepartments();
    }, []);

    const resetForm = () => {
        setNewDepartmentName("");
        setColor("#000000");
        setImageUrl("");
        setError("");
    };

    const handleAddDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDepartmentName.trim()) return;
        setError("");

        setIsSubmitting(true);
        try {
            const response = await createDepartment(
                {
                    name: newDepartmentName,
                    color: color,
                    status: true,
                    image: imageUrl,
                },
                pathname,
            );

            if (response.responseType === "success" && response.data) {
                await loadDepartments();
                const newDepartmentId = response.data.id;
                onChange(newDepartmentId);
                resetForm();
                setIsModalOpen(false);
            } else {
                setError(response.message ?? "Failed to create department");
            }
        } catch (error: any) {
            console.error("Error creating department:", error);
            setError(error.message ?? "Failed to create department");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
                <Select
                    defaultValue={value}
                    disabled={isDisabled || isLoading}
                    value={value}
                    required={isRequired}
                    onValueChange={onChange}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={placeholder || "Select department"} />
                    </SelectTrigger>
                    <SelectContent>
                        {departments.map((department) => (
                            <SelectItem key={department.id} value={department.id}>
                                {department.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {description && (
                    <p className="text-sm text-gray-500">{description}</p>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={(open) => {
                setIsModalOpen(open);
                if (!open) resetForm();
            }}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={isDisabled}
                        className="flex-shrink-0"
                        type="button"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Department</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddDepartment} className="space-y-6">
                        <FormError message={error} />

                        <Card>
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-[110px_1fr] gap-6 items-start">
                                    <div className="space-y-4">
                                        <Label>Image</Label>
                                        <div className="bg-gray-50 rounded-lg p-4 content-center">
                                            <UploadImageWidget
                                                imagePath="departments"
                                                displayStyle="default"
                                                displayImage={true}
                                                showLabel={false}
                                                label="Image"
                                                setImage={setImageUrl}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="departmentName">Department Name</Label>
                                            <div className="relative">
                                                <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    id="departmentName"
                                                    value={newDepartmentName}
                                                    onChange={(e) => setNewDepartmentName(e.target.value)}
                                                    placeholder="Enter department name"
                                                    className="pl-10"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="departmentColor">Department Color</Label>
                                                <Input
                                                    id="departmentColor"
                                                    type="color"
                                                    value={color}
                                                    onChange={(e) => setColor(e.target.value)}
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !newDepartmentName.trim()}
                            >
                                {isSubmitting ? "Processing..." : "Create Department"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DepartmentSelector;
