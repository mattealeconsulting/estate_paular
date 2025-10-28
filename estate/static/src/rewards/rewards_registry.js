/** @odoo-module **/
import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";

const cat = registry.category("estate.clicker_rewards");

export const clickerRewards = {
    add(key, val) {
        cat.add(key, val);
    },
    get(key) {
        return cat.get(key);
    },
    getEntries() {
        if (typeof cat.getEntries === "function") {
            return cat.getEntries();
        }

        const map =
            cat._category?.items ||
            cat._items ||
            (cat._registry && cat._registry.items) ||
            null;

        if (map && typeof map.entries === "function") {
            return map.entries();
        }
        return [];
    },
};



clickerRewards.add("plus_1k", {
    label: _t("+1 000 clicks"),
    weight: 5,
    isAvailable: (model) => true,
    apply: (model) => model.grantClicks(1000),
});

clickerRewards.add("plus_10k", {
    label: _t("+10 000 clicks"),
    weight: 1,
    isAvailable: (model) => model.state.level >= 2,
    apply: (model) => model.grantClicks(10_000),
});

clickerRewards.add("clickbot", {
    label: _t("+1 clickbot"),
    weight: 3,
    isAvailable: (model) => model.state.level >= 1,
    apply: (model) => model.grantClickBots(1),
});

clickerRewards.add("bigbot", {
    label: _t("+1 bigbot"),
    weight: 2,
    isAvailable: (model) => model.state.level >= 2,
    apply: (model) => model.grantBigBots(1),
});

clickerRewards.add("power", {
    label: _t("+1 power"),
    weight: 1,
    isAvailable: (model) => model.state.level >= 3,
    apply: (model) => model.grantPower(1),
});