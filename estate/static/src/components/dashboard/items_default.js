/** @odoo-module **/
import { registry } from "@web/core/registry";
import { DASHBOARD_ITEMS_CATEGORY } from "./items_registry";
import { Counter } from "../counter/counter";
import { PieChart } from "../pie_chart/pie_chart";

registry.category(DASHBOARD_ITEMS_CATEGORY).add("kpi_available", {
    sequence: 10,
    size: 1,
    title: "Available",
    Component: Counter,
    props: () => ({
        model: "estate.property",
        domain: [["state", "in", ["new", "offer_received", "offer_accepted"]]],
        openAction: true,
    }),
});

registry.category(DASHBOARD_ITEMS_CATEGORY).add("kpi_unavailable", {
    sequence: 20,
    size: 1,
    title: "Unavailable",
    Component: Counter,
    props: () => ({
        model: "estate.property",
        domain: [["state", "in", ["sold", "canceled"]]],
        openAction: true,
    }),
});

registry.category(DASHBOARD_ITEMS_CATEGORY).add("kpi_all", {
    sequence: 30,
    size: 1,
    title: "All",
    Component: Counter,
    props: () => ({
        model: "estate.property",
        domain: [],
        openAction: true,
    }),
});

registry.category(DASHBOARD_ITEMS_CATEGORY).add("pie_by_state", {
    sequence: 40,
    size: 2,
    title: "By state (pie)",
    Component: PieChart,
    props: ({ stats }) => ({ data: stats?.by_state || {}, height: 420 }),
});
