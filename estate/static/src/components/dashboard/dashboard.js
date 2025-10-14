/** @odoo-module **/
import { Component, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

import { DashboardItem } from "../dashboard_item/dashboard_item";
import { Counter } from "../counter/counter";
import { PieChart } from "../pie_chart/pie_chart";

import { getDashboardEntries } from "./items_registry";
import { loadEnabledKeys, saveEnabledKeys } from "./items_prefs";
import { loadOrder, saveOrder } from "./items_order";

function toSet(v, fallback = []) {
    return v instanceof Set ? v : new Set(Array.isArray(v) ? v : fallback);
}

export class EstateDashboard extends Component {
    static template = "estate.Dashboard";
    static components = { DashboardItem, Counter, PieChart };

    setup() {
        this.action = useService("action");
        this.statsSvc = useService("estate.dashboardStatistics");
        this.state = useState(this.statsSvc.state);

        this.entries = getDashboardEntries();
        const allKeys = this.entries.map((e) => e.key);

        const enabledInitial = toSet(loadEnabledKeys(allKeys), allKeys);
        const orderInitial = loadOrder(allKeys);

        this.prefs = useState({
            customizeOpen: false,
            enabled: enabledInitial,
            order: orderInitial,
            draggingKey: null,
        });

        onWillStart(async () => {
            await this.statsSvc.load();
        });

        this.toggleCustomize = this.toggleCustomize.bind(this);
        this.onToggleKey = this.onToggleKey.bind(this);
        this.savePrefs = this.savePrefs.bind(this);
        this.resetPrefs = this.resetPrefs.bind(this);

        this.onDragStart = this.onDragStart.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    get visibleEntries() {
        const enabled = toSet(this.prefs.enabled);
        if (!(this.prefs.enabled instanceof Set)) this.prefs.enabled = enabled;

        const byKey = new Map(this.entries.map((e) => [e.key, e]));
        const ordered = [];
        for (const k of this.prefs.order) {
            const it = byKey.get(k);
            if (it && enabled.has(k)) ordered.push(it);
        }
        for (const it of this.entries) {
            if (enabled.has(it.key) && !this.prefs.order.includes(it.key)) {
                ordered.push(it);
            }
        }
        return ordered;
    }

    toggleCustomize() {
        this.prefs.customizeOpen = !this.prefs.customizeOpen;
    }

    onToggleKey(key, ev) {
        if (ev) ev.stopPropagation();
        const enabled = new Set(this.prefs.enabled);
        if (enabled.has(key)) enabled.delete(key);
        else enabled.add(key);
        this.prefs.enabled = enabled;
    }

    savePrefs() {
        saveEnabledKeys(toSet(this.prefs.enabled));
        saveOrder(this.prefs.order.slice());
        this.prefs.customizeOpen = false;
    }

    resetPrefs() {
        const all = this.entries.map((e) => e.key);
        this.prefs.enabled = new Set(all);
        this.prefs.order = [...all];
        saveEnabledKeys(this.prefs.enabled);
        saveOrder(this.prefs.order);
    }

    onDragStart(key, ev) {
        this.prefs.draggingKey = key;
        try { ev.dataTransfer.setData("text/plain", key); } catch { }
    }

    onDragOver(ev) {
        if (ev) ev.preventDefault();
    }

    onDrop(targetKey, ev) {
        ev.preventDefault();
        const src = this.prefs.draggingKey || (ev.dataTransfer && ev.dataTransfer.getData("text/plain"));
        this.prefs.draggingKey = null;
        if (!src || src === targetKey) return;

        const order = this.prefs.order.slice();
        const fromIdx = order.indexOf(src);
        const toIdx = order.indexOf(targetKey);
        if (fromIdx === -1 || toIdx === -1) return;

        order.splice(fromIdx, 1);
        const insertAt = fromIdx < toIdx ? order.indexOf(targetKey) : toIdx;
        order.splice(insertAt, 0, src);

        this.prefs.order = order;
    }

    //quick actions
    openAllProperties() {
        this.action.doAction({
            type: "ir.actions.act_window",
            name: "All Properties",
            res_model: "estate.property",
            domain: [],
            views: [[false, "list"], [false, "kanban"], [false, "form"]],
            view_mode: "list,kanban,form",
            target: "current",
        });
    }

    openAvailableProperties() {
        this.action.doAction({
            type: "ir.actions.act_window",
            name: "Available Properties",
            res_model: "estate.property",
            domain: [["state", "in", ["new", "offer_received", "offer_accepted"]]],
            views: [[false, "list"], [false, "kanban"], [false, "form"]],
            view_mode: "list,kanban,form",
            target: "current",
        });
    }

    openUnavailableProperties() {
        this.action.doAction({
            type: "ir.actions.act_window",
            name: "Unavailable Properties",
            res_model: "estate.property",
            domain: [["state", "in", ["sold", "canceled"]]],
            views: [[false, "list"], [false, "kanban"], [false, "form"]],
            view_mode: "list,kanban,form",
            target: "current",
        });
    }

    openCustomers() {
        this.action.doAction({
            type: "ir.actions.act_window",
            name: "Customers",
            res_model: "res.partner",
            domain: [["active", "=", true]],
            views: [[false, "list"], [false, "form"]],
            view_mode: "list,form",
            target: "current",
        });
    }

    openCrmLeads() {
        this.action.doAction({
            type: "ir.actions.act_window",
            name: "Leads (CRM)",
            res_model: "crm.lead",
            domain: [],
            views: [[false, "kanban"], [false, "list"], [false, "form"]],
            view_mode: "kanban,list,form",
            target: "current",
        });
    }
}
