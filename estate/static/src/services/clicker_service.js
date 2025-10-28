/** @odoo-module **/

import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { rpc } from "@web/core/network/rpc";
import { browser } from "@web/core/browser/browser";
import {
    ClickerModel,
    BOT_COST,
    BIGBOT_COST,
    POWER_COST,
    TREE_COST,
    STORAGE_KEY,
    migrateState,
    STATE_VERSION,
} from "@estate/models/clicker_model";

function debounce(fn, wait = 1200) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

const clickerService = {
    dependencies: ["notification", "action", "effect"],

    async start(env, { notification: notify, action, effect }) {
        // console.log("[Clicker Service] Starting with services:", {
        //     notification: !!notify,
        //     action: !!action,
        //     effect: !!effect
        // });

        if (!window.__estateClickerModel__) {
            window.__estateClickerModel__ = new ClickerModel();
        }
        const model = window.__estateClickerModel__;

        try {
            const raw = browser.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const s = migrateState(JSON.parse(raw));
                if (s) {
                    model.state.version = Number.isFinite(+s.version) ? +s.version : STATE_VERSION;
                    model.state.clicks = Number.isFinite(+s.clicks) ? +s.clicks : 0;
                    model.state.power = Number.isFinite(+s.power) ? +s.power : 1;
                    model.state.level = Number.isFinite(+s.level) ? +s.level : 0;
                    model.state.clickBots = Number.isFinite(+s.clickBots) ? +s.clickBots : 0;
                    model.state.bigBots = Number.isFinite(+s.bigBots) ? +s.bigBots : 0;
                    model.state.pearTrees = Number.isFinite(+s.pearTrees) ? +s.pearTrees : 0;
                    model.state.cherryTrees = Number.isFinite(+s.cherryTrees) ? +s.cherryTrees : 0;
                    model.state.pearFruits = Number.isFinite(+s.pearFruits) ? +s.pearFruits : 0;
                    model.state.cherryFruits = Number.isFinite(+s.cherryFruits) ? +s.cherryFruits : 0;

                    browser.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...model.state, version: STATE_VERSION }));
                }
            }
        } catch { }

        try {
            const serverState = await rpc("/estate/clicker/get", {});
            if (serverState && typeof serverState === "object") {
                if (Number.isFinite(+serverState.clicks)) model.state.clicks = +serverState.clicks;
                if (Number.isFinite(+serverState.power)) model.state.power = +serverState.power;
                if (Number.isFinite(+serverState.level)) model.state.level = +serverState.level;
                if (Number.isFinite(+serverState.clickBots)) model.state.clickBots = +serverState.clickBots;
                if (Number.isFinite(+serverState.bigBots)) model.state.bigBots = +serverState.bigBots;
                if (Number.isFinite(+serverState.pearTrees)) model.state.pearTrees = +serverState.pearTrees;
                if (Number.isFinite(+serverState.cherryTrees)) model.state.cherryTrees = +serverState.cherryTrees;
                if (Number.isFinite(+serverState.pearFruits)) model.state.pearFruits = +serverState.pearFruits;
                if (Number.isFinite(+serverState.cherryFruits)) model.state.cherryFruits = +serverState.cherryFruits;
            }
        } catch (e) {
            console.warn("Clicker: could not load server state (continuing locally)", e);
        }

        if (!model.__eventsBound__) {
            model.on((evt) => {
               //console.log("[Clicker Service] Event received:", evt);

                if (evt?.type === "milestone" && evt.key === "bots_unlocked") {
                    if (effect && effect.add) {
                       // console.log("[Clicker Service] Adding rainbow_man effect");
                        effect.add({ type: "rainbow_man", message: _t("Boom! Bots unlocked!") });
                    }
                    if (notify && notify.add) {
                        notify.add(_t("You can now buy ClickBots (10 clicks / 10s)."),
                            { title: _t("Milestone reached"), type: "success" });
                    }
                }
                if (evt?.type === "milestone" && evt.key === "power_unlocked") {
                    if (notify && notify.add) {
                        notify.add(_t("Power upgrades unlocked! Your bots get multiplied."),
                            { title: _t("Milestone reached"), type: "success" });
                    }
                }
                if (evt?.type === "reward") {
                    if (notify && notify.add) {
                        notify.add(_t("Reward: ") + (evt.label || _t("Something good!")),
                            { title: _t("Lucky drop!"), type: "success" });
                    }
                }
            });
            model.__eventsBound__ = true;
        }

        if (!window.__estateClickerLS__) {
            window.__estateClickerLS__ = setInterval(() => {
                try {
                    browser.localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify({ ...model.state, version: STATE_VERSION })
                    );
                } catch { }
            }, 10_000);
        }

        return {
            state: model.state,
            add: (n) => model.add(n),
            set: (n) => model.set(n),
            reset: () => model.reset(),
            buyClickBot: () => model.buyClickBot(),
            buyBigBot: () => model.buyBigBot(),
            buyPower: () => model.buyPower(),
            buyTree: () => model.buyTree(),
            rollReward: () => model.rollReward(),
            getReward: () => {
                const cand = model.getRewardCandidate?.();
                if (!cand) return;

                if (!notify || !notify.add || !action || !action.doAction) {
                    console.error("[Clicker Service] Cannot show reward - services not available");
                    return;
                }

                notify.add(
                    _t("Reward available: ") + (cand.label || _t("Mystery reward")),
                    {
                        title: _t("Lucky drop!"),
                        type: "success",
                        sticky: true,
                        buttons: [{
                            name: _t("Collect"),
                            primary: true,
                            onClick: () => {
                                model.applyReward(cand.key);
                                action.doAction({
                                    type: "ir.actions.client",
                                    tag: "estate.clicker_game_action",
                                    name: "Clicker Game",
                                });
                            },
                        }],
                    }
                );
            },
            BOT_COST,
            BIGBOT_COST,
            POWER_COST,
            TREE_COST,
        };
    },
};

registry.category("services").add("clicker", clickerService);