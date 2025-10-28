/** @odoo-module **/
import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";

registry.category("command_provider").add("estate.clicker.commands", {
    provide(env, options) {
        const clicker = env.services.clicker;
        
        if (!clicker) {
            return [];
        }

        const state = clicker.state || {};
        const clicks = state.clicks ?? 0;
        const level = state.level ?? 0;

        return [
            {
                name: _t("Clicker: Open Game"),
                action() {
                    env.services.action.doAction({
                        type: "ir.actions.client",
                        tag: "estate.clicker_game_action",
                        name: _t("Clicker Game"),
                    });
                },
            },
            {
                name: _t("Clicker: Add +10 clicks"),
                action() {
                    clicker.add(10);
                },
            },
            {
                name: _t("Clicker: Roll random reward"),
                action() {
                    const result = clicker.rollReward();
                    if (!result) {
                        env.services.notification.add(
                            _t("No rewards available"),
                            { type: "info" }
                        );
                    }
                },
            },
            {
                name: _t("Clicker: Reset game"),
                action() {
                    if (confirm(_t("Reset your clicker progress?"))) {
                        clicker.reset();
                    }
                },
            },
            ...(clicks >= clicker.BOT_COST ? [{
                name: _t("Clicker: Buy ClickBot (1,000 clicks)"),
                action() {
                    clicker.buyClickBot();
                },
            }] : []),
            ...(clicks >= clicker.BIGBOT_COST ? [{
                name: _t("Clicker: Buy BigBot (5,000 clicks)"),
                action() {
                    clicker.buyBigBot();
                },
            }] : []),
            ...(level >= 3 && clicks >= clicker.POWER_COST ? [{
                name: _t("Clicker: Buy Power Upgrade (50,000 clicks)"),
                action() {
                    clicker.buyPower();
                },
            }] : []),
        ];
    },
});