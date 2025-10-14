/** @odoo-module **/
import { Component } from "@odoo/owl";

export class DashboardItem extends Component {
    static template = "estate.DashboardItem";
    static props = {
        title: { type: String, optional: true },
        size: { type: Number, optional: true },
        slots: { optional: true },
    };
    static defaultProps = { size: 1 };

    get widthStyle() {
        const s = Math.max(1, Math.min(this.props.size || 1, 3));
        return `width: ${s * 18}rem`;
    }
}
