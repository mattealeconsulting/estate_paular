/** @odoo-module **/
import { registry } from "@web/core/registry";
import { Component, onWillStart, useState } from "@odoo/owl";
import { loadBundle } from "@web/core/assets";

class LazyDashboard extends Component {
    static template = "estate.LazyLoader";
    setup() {
        this.state = useState({ Component: null, error: null });
        onWillStart(async () => {
            try {
                await loadBundle("estate.dashboard_assets");
                const mod = odoo.loader.modules.get("@estate/components/dashboard/dashboard");
                this.state.Component = mod?.EstateDashboard || mod?.default;
                if (!this.state.Component) throw new Error("EstateDashboard export not found");
            } catch (e) { this.state.error = e; }
        });
    }
}
registry.category("actions").add("estate.dashboard", LazyDashboard);
