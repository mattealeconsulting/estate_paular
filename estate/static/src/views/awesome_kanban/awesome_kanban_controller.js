/** @odoo-module **/

import { KanbanController } from "@web/views/kanban/kanban_controller";
import { kanbanView } from "@web/views/kanban/kanban_view";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";
import { AwesomeSearchPanel } from "@estate/views/awesome_kanban/awesome_search_panel";
import { onWillStart, useState } from "@odoo/owl";

export class AwesomeKanbanController extends KanbanController {
    static template = "estate.AwesomeKanbanView";
    static components = {
        ...KanbanController.components,
        AwesomeSearchPanel,
    };

    setup() {
        super.setup();
        this.orm = useService("orm");

        this.state = useState({
            customers: [],
            selectedCustomerId: null,
            activeCustomersOnly: false,
        });

        onWillStart(async () => {
            await this.loadCustomers();
        });
    }

    async loadCustomers() {
        let offerDomain = [];

        if (this.state.activeCustomersOnly) {
            offerDomain = [["property_id.state", "not in", ["sold", "cancelled"]]];
        }

        const offers = await this.orm.searchRead(
            "estate.property.offer",
            offerDomain,
            ["partner_id"],
            { limit: 1000 }
        );

        const buyerMap = new Map();
        for (const offer of offers) {
            if (offer.partner_id && Array.isArray(offer.partner_id)) {
                const [id, name] = offer.partner_id;
                if (!buyerMap.has(id)) {
                    buyerMap.set(id, { id, name });
                }
            }
        }

        this.state.customers = Array.from(buyerMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }

    selectCustomer(customerId, customerName) {
        this.state.selectedCustomerId = customerId;

        const customerFilters = this.env.searchModel.getSearchItems((searchItem) =>
            searchItem.isFromAwesomeKanban
        );

        for (const customerFilter of customerFilters) {
            if (customerFilter.isActive) {
                this.env.searchModel.toggleSearchItem(customerFilter.id);
            }
        }

        let domain = [["offer_ids.partner_id", "=", customerId]];

        if (this.state.activeCustomersOnly) {
            domain.push(["state", "not in", ["sold", "cancelled"]]);
        }

        this.env.searchModel.createNewFilters([{
            description: customerName,
            domain: domain,
            isFromAwesomeKanban: true,
        }]);
    }

    clearFilter() {
        this.state.selectedCustomerId = null;

        const customerFilters = this.env.searchModel.getSearchItems((searchItem) =>
            searchItem.isFromAwesomeKanban
        );

        for (const customerFilter of customerFilters) {
            if (customerFilter.isActive) {
                this.env.searchModel.toggleSearchItem(customerFilter.id);
            }
        }

        if (this.state.activeCustomersOnly) {
            this.env.searchModel.createNewFilters([{
                description: _t("Available properties"),
                domain: [["state", "not in", ["sold", "cancelled"]]],
                isFromAwesomeKanban: true,
            }]);
        }
    }

    async toggleActiveCustomers() {
        this.state.activeCustomersOnly = !this.state.activeCustomersOnly;

        await this.loadCustomers();

        if (this.state.selectedCustomerId) {
            const selectedCustomer = this.state.customers.find(c => c.id === this.state.selectedCustomerId);
            if (selectedCustomer) {
                this.selectCustomer(selectedCustomer.id, selectedCustomer.name);
            } else {
                this.clearFilter();
            }
        } else {
            this.clearFilter();
        }
    }
}

export const awesomeKanbanView = {
    ...kanbanView,
    Controller: AwesomeKanbanController,
};

registry.category("views").add("awesome_kanban", awesomeKanbanView);