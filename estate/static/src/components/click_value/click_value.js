/** @odoo-module **/

import { Component } from "@odoo/owl";

export class ClickValue extends Component {
    static template = "estate.ClickValue";
    static props = { 
        value: { type: Number, optional: true } 
    };

    get displayValue() {
        const val = this.props.value ?? 0;
        if (val >= 1000000) {
            return (val / 1000000).toFixed(1) + "M";
        }
        if (val >= 1000) {
            return (val / 1000).toFixed(1) + "K";
        }
        return val.toString();
    }

    get fullValue() {
        return (this.props.value ?? 0).toLocaleString();
    }
}