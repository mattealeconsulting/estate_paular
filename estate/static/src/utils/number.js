/** @odoo-module **/

export function humanize(value) {
    if (value == null || value === 0) return "0";
    
    const num = Number(value);
    if (!isFinite(num)) return "0";
    
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
}