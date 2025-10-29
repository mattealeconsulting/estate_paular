/** @odoo-module **/

import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { rpc } from "@web/core/network/rpc";
import { browser } from "@web/core/browser/browser";
import {
    ClickerModel,
    BOT_COST, BIGBOT_COST, POWER_COST, TREE_COST, PEACH_TREE_COST,
    STORAGE_KEY, migrateState, STATE_VERSION,
} from "@estate/models/clicker_model";

function debounce(fn, wait = 800) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

function num(x, d = 0) { return Number.isFinite(+x) ? +x : d; }

function mergeStates(a = {}, b = {}) {
    const out = { ...a };
    const keysMax = [
        "clicks", "power", "level",
        "clickBots", "bigBots",
        "pearTrees", "cherryTrees", "peachTrees",
        "pearFruits", "cherryFruits", "peachFruits",
    ];
    for (const k of keysMax) {
        out[k] = Math.max(num(a[k]), num(b[k]));
    }
    out.version = STATE_VERSION;
    return out;
}


const clickerService = {
    dependencies: ["notification", "action", "effect"],

    async start(env, { notification: notify, action, effect }) {
        if (!window.__estateClickerModel__) {
            window.__estateClickerModel__ = new ClickerModel();
        }
        const model = window.__estateClickerModel__;

        const saveLocal = () => {
            try {
                browser.localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({ ...model.state, version: STATE_VERSION })
                );
                if (window.__estateClickerBC__) {
                    window.__estateClickerBC__.postMessage({ type: "state", payload: { ...model.state } });
                }
            } catch {}
        };
        const pushServer = debounce(async () => {
            try {
                await rpc("/estate/clicker/set", { state: { ...model.state, version: STATE_VERSION } });
            } catch { }
        }, 1200);

        let localState = null;
        try {
            const raw = browser.localStorage.getItem(STORAGE_KEY);
            if (raw) localState = migrateState(JSON.parse(raw));
        } catch { }

        let serverState = null;
        try {
            serverState = await rpc("/estate/clicker/get", {});
        } catch { }

        const initial = localState && serverState
            ? mergeStates(localState, serverState)
            : (localState || serverState);

        if (initial && typeof initial === "object") {
            model.state.version = num(initial.version, STATE_VERSION);
            model.state.clicks = num(initial.clicks);
            model.state.power = num(initial.power, 1);
            model.state.level = num(initial.level);
            model.state.clickBots = num(initial.clickBots);
            model.state.bigBots = num(initial.bigBots);
            model.state.pearTrees = num(initial.pearTrees);
            model.state.cherryTrees = num(initial.cherryTrees);
            model.state.peachTrees = num(initial.peachTrees);
            model.state.pearFruits = num(initial.pearFruits);
            model.state.cherryFruits = num(initial.cherryFruits);
            model.state.peachFruits = num(initial.peachFruits);

            saveLocal();
            pushServer();
        }

        if (!window.__estateClickerStorageSync__) {
            window.addEventListener("storage", (e) => {
                if (e.key !== STORAGE_KEY || !e.newValue) return;
                try {
                    const s = migrateState(JSON.parse(e.newValue));
                    if (!s) return;
                    model.state.version = num(s.version, STATE_VERSION);
                    model.state.clicks = num(s.clicks);
                    model.state.power = num(s.power, 1);
                    model.state.level = num(s.level);
                    model.state.clickBots = num(s.clickBots);
                    model.state.bigBots = num(s.bigBots);
                    model.state.pearTrees = num(s.pearTrees);
                    model.state.cherryTrees = num(s.cherryTrees);
                    model.state.peachTrees = num(s.peachTrees);
                    model.state.pearFruits = num(s.pearFruits);
                    model.state.cherryFruits = num(s.cherryFruits);
                    model.state.peachFruits = num(s.peachFruits);
                    pushServer();
                } catch { }
            });
            window.__estateClickerStorageSync__ = true;
        }

        if (!window.__estateClickerBC__) {
            try {
                window.__estateClickerBC__ = new BroadcastChannel("estate_clicker");
                window.__estateClickerBC__.addEventListener("message", (evt) => {
                    if (!evt?.data || evt.data.type !== "state") return;
                    const s = evt.data.payload || {};
                    model.state.version = num(s.version, STATE_VERSION);
                    model.state.clicks = num(s.clicks, model.state.clicks);
                    model.state.power = num(s.power, model.state.power);
                    model.state.level = num(s.level, model.state.level);
                    model.state.clickBots = num(s.clickBots, model.state.clickBots);
                    model.state.bigBots = num(s.bigBots, model.state.bigBots);
                    model.state.pearTrees = num(s.pearTrees, model.state.pearTrees);
                    model.state.cherryTrees = num(s.cherryTrees, model.state.cherryTrees);
                    model.state.peachTrees = num(s.peachTrees, model.state.peachTrees);
                    model.state.pearFruits = num(s.pearFruits, model.state.pearFruits);
                    model.state.cherryFruits = num(s.cherryFruits, model.state.cherryFruits);
                    model.state.peachFruits = num(s.peachFruits, model.state.peachFruits);
                });
            } catch { }
        }

        if (!model.__eventsBound__) {
            model.on((evt) => {
                if (evt?.type === "milestone" && evt.key === "bots_unlocked") {
                    env.services.effect?.add?.({ type: "rainbow_man", message: _t("Boom! Bots unlocked!") });
                    notify?.add?.(_t("You can now buy ClickBots (10 clicks / 10s)."),
                        { title: _t("Milestone reached"), type: "success" });
                }
                if (evt?.type === "milestone" && evt.key === "power_unlocked") {
                    notify?.add?.(_t("Power upgrades unlocked! Your bots get multiplied."),
                        { title: _t("Milestone reached"), type: "success" });
                }
                if (evt?.type === "reward") {
                    notify?.add?.(_t("Reward: ") + (evt.label || _t("Something good!")),
                        { title: _t("Lucky drop!"), type: "success" });
                }
            });
            model.__eventsBound__ = true;
        }

        if (!window.__estateClickerLS__) {
            window.__estateClickerLS__ = setInterval(() => {
                saveLocal();
                pushServer();
            }, 10_000);
        }

        if (!window.__estateClickerUnloadBound__) {
            const flush = () => { saveLocal(); try { rpc("/estate/clicker/set", { state: { ...model.state, version: STATE_VERSION } }); } catch { } };
            window.addEventListener("beforeunload", flush);
            document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
            window.__estateClickerUnloadBound__ = true;
        }

        return {
            state: model.state,
            add: (n) => { model.add(n); saveLocal(); pushServer(); },
            set: (n) => { model.set(n); saveLocal(); pushServer(); },
            reset: () => { model.reset(); saveLocal(); pushServer(); },
            buyClickBot: () => { model.buyClickBot(); saveLocal(); pushServer(); },
            buyBigBot: () => { model.buyBigBot(); saveLocal(); pushServer(); },
            buyPower: () => { model.buyPower(); saveLocal(); pushServer(); },
            buyTree: () => { model.buyTree(); saveLocal(); pushServer(); },
            buyPeachTree: () => { model.buyPeachTree(); saveLocal(); pushServer(); },
            rollReward: () => { const r = model.rollReward(); if (r) { saveLocal(); pushServer(); } return r; },
            getReward: () => {
                const cand = model.getRewardCandidate?.();
                if (!cand) return;
                notify?.add?.(_t("Reward available: ") + (cand.label || _t("Mystery reward")), {
                    title: _t("Lucky drop!"),
                    type: "success",
                    sticky: true,
                    buttons: [{
                        name: _t("Collect"),
                        primary: true,
                        onClick: () => {
                            model.applyReward(cand.key);
                            saveLocal(); pushServer();
                            action?.doAction?.({
                                type: "ir.actions.client",
                                tag: "estate.clicker_game_action",
                                name: "Clicker Game",
                            });
                        },
                    }],
                });
            },
            BOT_COST, BIGBOT_COST, POWER_COST, TREE_COST, PEACH_TREE_COST,
        };
    },
};

registry.category("services").add("clicker", clickerService);
