/** @odoo-module **/
import { registry } from "@web/core/registry";
import { Counter } from "../counter/counter";

const CAT = "estate.dashboard.items";

// KPI Pending Offers
registry.category(CAT).add("kpi_pending_offers", {
    sequence: 25,
    size: 1,
    title: "Pending Offers",
    Component: Counter,
    props: () => ({
        model: "estate.property.offer",
        domain: [["status", "=", "pending"]],
        openAction: true,
    }),
});
