/** @odoo-module **/
import { Component, useState } from "@odoo/owl";

export class Card extends Component {
    static template = "estate.Card";
    static props = {
        title: { type: String, optional: true },
        collapsible: { type: Boolean, optional: true },
        defaultCollapsed: { type: Boolean, optional: true },
        slots: { optional: true },
    };
    static defaultProps = { collapsible: false, defaultCollapsed: false };

    setup() {
        this.state = useState({ collapsed: !!this.props.defaultCollapsed });
    }

    toggle() {
        this.state.collapsed = !this.state.collapsed;
    }
}
