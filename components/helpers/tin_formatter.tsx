export const formatTinForDisplay = (tin: string): string => {
    const digits = tin.replace(/\D/g, ''); 
    if (digits.length >= 6) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`;
    } else if (digits.length >= 3) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return digits;
};