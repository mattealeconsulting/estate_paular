/** @odoo-module **/
import { registry } from "@web/core/registry";
import { Component, onWillStart, useState } from "@odoo/owl";
import { loadBundle } from "@web/core/assets";

class LazyPlayground extends Component {
    static template = "estate.LazyLoader";

    static props = {
        action: { type: Object, optional: true },
        actionId: { type: [Number, String], optional: true },
        updateActionState: { type: Function, optional: true },
        className: { type: String, optional: true },
    };

    setup() {
        this.state = useState({ Component: null });
        onWillStart(async () => {
            await loadBundle("estate.playground_assets");
            const module = odoo.loader.modules.get("@estate/components/playground/playground");
            this.state.Component = module.Playground;
        });
    }
}

registry.category("actions").add("estate.playground", LazyPlayground);
