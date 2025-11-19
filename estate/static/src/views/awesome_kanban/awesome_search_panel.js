/** @odoo-module **/

import { Component } from "@odoo/owl";
import { CustomerList } from "@estate/views/awesome_kanban/customer_list";

export class AwesomeSearchPanel extends Component {
    static template = "estate.AwesomeSearchPanelComponent";
    static components = { CustomerList };
    static props = {
        controller: Object,
    };
}
