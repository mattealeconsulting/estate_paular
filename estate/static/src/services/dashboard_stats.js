/** @odoo-module **/
import { registry } from "@web/core/registry";
import { memoize } from "@web/core/utils/functions";
import { rpc } from "@web/core/network/rpc";
import { reactive } from "@odoo/owl";

export const dashboardStatsService = {
    start() {
        const state = reactive({
            loading: true,
            data: null,
            error: null,
            lastUpdated: null,
        });

        const loadOnce = memoize(async () => rpc("/estate/dashboard/statistics", {}));

        async function load({ refresh = false } = {}) {
            try {
                state.loading = true;
                const data = refresh || !state.data ? await rpc("/estate/dashboard/statistics", {})
                    : await loadOnce();
                state.data = data;
                state.error = null;
                state.lastUpdated = new Date();
            } catch (e) {
                state.error = e;
            } finally {
                state.loading = false;
            }
            return state.data;
        }

        const REFRESH_MS = 10 * 60 * 1000;
        setInterval(() => load({ refresh: true }), REFRESH_MS);

        return { state, load };
    },
};

registry.category("services").add("estate.dashboardStatistics", dashboardStatsService);
