/** @odoo-module **/
import { Component, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

function isValidDomain(v) {
    if (v == null) return true;
    if (typeof v === "string") {
        try {
            const arr = JSON.parse(v);
            return Array.isArray(arr);
        } catch {
            return false;
        }
    }
    if (!Array.isArray(v)) return false;
    return v.every((clause) => Array.isArray(clause));
}

export class Counter extends Component {
    static template = "estate.Counter";
    static props = {
        label: { type: String },
        model: { type: String },
        domain: { type: [Array, String], optional: true, validate: isValidDomain },
        openAction: { type: Boolean, optional: true },
        count: { type: Number, optional: true, validate: (v) => v == null || v >= 0 },
    };

    static defaultProps = {
        openAction: true,
    };

    setup() {
        this.orm = useService("orm");
        this.action = useService("action");
        this.state = useState({ value: 0, loading: true });
        this._domain = [];
        this._model = this.props.model;

        onWillStart(async () => {
            this._domain =
                typeof this.props.domain === "string"
                    ? JSON.parse(this.props.domain)
                    : (this.props.domain || []);
            if (this.props.count !== undefined) {
                this.state.value = this.props.count;
                this.state.loading = false;
            } else {
                this.state.value = await this.orm.searchCount(this._model, this._domain);
                this.state.loading = false;
            }
        });
    }

    async openList() {
        if (this.props.openAction === false) return;
        await this.action.doAction({
            type: "ir.actions.act_window",
            name: this.props.label || "Records",
            res_model: this._model,
            domain: this._domain || [],
            views: [[false, "list"], [false, "form"], [false, "kanban"]],
            view_mode: "list,form,kanban",
            target: "current",
        });
    }
}
