/** @odoo-module **/
import { useService } from "@web/core/utils/hooks";
import { useState } from "@odoo/owl";

export function useClicker() {
    const svc = useService("clicker");
    const state = useState(svc.state);
    return {
        state,
        add: svc.add,
        reset: svc.reset,
        buyClickBot: svc.buyClickBot,
        buyBigBot: svc.buyBigBot,
        buyPower: svc.buyPower,
        rollReward: svc.rollReward,
        buyTree: svc.buyTree,
        buyPeachTree: svc.buyPeachTree,
        BOT_COST: svc.BOT_COST,
        BIGBOT_COST: svc.BIGBOT_COST,
        POWER_COST: svc.POWER_COST,
        TREE_COST: svc.TREE_COST,
        PEACH_TREE_COST: svc.PEACH_TREE_COST,
    };
}
