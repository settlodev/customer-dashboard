'use client';
import React from 'react';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface PaginationComponentProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPrev: () => void;
    onNext: () => void;
    getPageRange: (currentPage: number, totalPages: number) => (number | string)[];
}

const PaginationComponent: React.FC<PaginationComponentProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    onPrev,
    onNext,
    getPageRange,
}) => {
    if (totalPages <= 1) return null;

    const pages = getPageRange(currentPage, totalPages);

    return (
        <div className="mt-4">
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={onPrev}
                            className={cn(
                                currentPage === 1 && "pointer-events-none opacity-50"
                            )}
                        />
                    </PaginationItem>

                    {pages.map((page, index) => (
                        <PaginationItem key={index}>
                            {page === '...' ? (
                                <span className="px-4 py-2">...</span>
                            ) : (
                                <PaginationLink
                                    onClick={() => onPageChange(page as number)}
                                    isActive={currentPage === page}
                                >
                                    {page}
                                </PaginationLink>
                            )}
                        </PaginationItem>
                    ))}

                    <PaginationItem>
                        <PaginationNext
                            onClick={onNext}
                            className={cn(
                                currentPage === totalPages && "pointer-events-none opacity-50"
                            )}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
};

export default PaginationComponent;
