/** @odoo-module **/
const keyForUser = () => {
    const uid = (odoo && odoo.session_info && odoo.session_info.uid) || "anon";
    return `estate.dashboard.order.v1.${uid}`;
};

export function loadOrder(allKeys) {
    try {
        const raw = localStorage.getItem(keyForUser());
        if (!raw) return [...allKeys];
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [...allKeys];
        const setAll = new Set(allKeys);
        const filtered = arr.filter((k) => setAll.has(k));
        const missing = allKeys.filter((k) => !filtered.includes(k));
        return [...filtered, ...missing];
    } catch {
        return [...allKeys];
    }
}

export function saveOrder(orderArr) {
    try {
        localStorage.setItem(keyForUser(), JSON.stringify(orderArr || []));
    } catch { }
}
