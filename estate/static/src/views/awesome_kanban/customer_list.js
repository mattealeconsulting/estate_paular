/** @odoo-module **/

import { Component, useState, onWillUpdateProps } from "@odoo/owl";
import { fuzzyLookup } from "@web/core/utils/search";
import { Pager } from "@web/core/pager/pager";

export class CustomerList extends Component {
    static template = "estate.CustomerList";
    static components = { Pager };
    static props = {
        customers: { type: Array },
        selectCustomer: Function,
        selectedCustomerId: { type: Number, optional: true },
        clearFilter: Function,
        activeCustomersOnly: { type: Boolean },
        toggleActiveCustomers: Function,
    };

    setup() {
        this.state = useState({
            searchString: "",
            offset: 0,
            limit: 20,
        });

        onWillUpdateProps((nextProps) => {
            if (nextProps.customers.length !== this.props.customers.length) {
                this.state.offset = 0;
            }
        });
    }

    get filteredCustomers() {
        let customers = this.props.customers;

        if (this.state.searchString) {
            customers = fuzzyLookup(this.state.searchString, customers, (customer) => customer.name);
        }

        return customers;
    }

    get displayedCustomers() {
        const filtered = this.filteredCustomers;
        return filtered.slice(this.state.offset, this.state.offset + this.state.limit);
    }

    get pagerProps() {
        const total = this.filteredCustomers.length;
        return {
            offset: this.state.offset,
            limit: this.state.limit,
            total: total,
            onUpdate: (newState) => {
                this.state.offset = newState.offset;
                this.state.limit = newState.limit;
            },
        };
    }

    onCustomerClick(customer) {
        this.props.selectCustomer(customer.id, customer.name);
    }

    onAllClick() {
        this.props.clearFilter();
    }

    onActiveCustomersChange() {
        this.state.offset = 0;
        this.props.toggleActiveCustomers();
    }

    onSearchStringChange() {
        this.state.offset = 0;
    }
}