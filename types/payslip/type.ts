import { UUID } from "crypto";

export declare interface Payslip {
    id:UUID;
    baseSalary:string;
    netSalary:string;
    startPeriod:string;
    endPeriod:string;
    location:string;
    staff:string;
    staffName:string;
    salary:string;
    status:boolean;
    canDelete:boolean;
    isArchived:boolean
}