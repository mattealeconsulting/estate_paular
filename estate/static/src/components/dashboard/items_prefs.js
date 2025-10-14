/** @odoo-module **/
const keyForUser = () => {
    const uid = (odoo && odoo.session_info && odoo.session_info.uid) || "anon";
    return `estate.dashboard.enabledItems.v1.${uid}`;
};

export function loadEnabledKeys(allKeys) {
    try {
        const raw = localStorage.getItem(keyForUser());
        if (!raw) return new Set(allKeys);
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr.filter((k) => allKeys.includes(k)));
        return new Set(allKeys);
    } catch {
        return new Set(allKeys);
    }
}

export function saveEnabledKeys(enabledSet) {
    try {
        const arr = enabledSet instanceof Set ? Array.from(enabledSet) : [];
        localStorage.setItem(keyForUser(), JSON.stringify(arr));
    } catch { }
}

export function resetEnabledKeys(allKeys) {
    saveEnabledKeys(new Set(allKeys));
}
