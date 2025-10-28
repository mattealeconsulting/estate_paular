/** @odoo-module **/

import { reactive } from "@odoo/owl";
import { browser } from "@web/core/browser/browser";

export const STATE_VERSION = 3;
export const STORAGE_KEY = "estate_clicker_state";

export const STATE_MIGRATIONS = [
    // {
    //     fromVersion: 1,
    //     toVersion: 2,
    //     apply(s) {
    //         if (s.power == null) s.power = 1;
    //         s.version = 2;
    //         return s;
    //     },
    // },
    // {
    //     fromVersion: 2,
    //     toVersion: 3,
    //     apply(s) {
    //         s.pearTrees ??= 0;
    //         s.cherryTrees ??= 0;
    //         s.pearFruits ??= 0;
    //         s.cherryFruits ??= 0;
    //         s.version = 3;
    //         return s;
    //     },
    // },
];

export function migrateState(raw) {
    if (!raw || typeof raw !== "object") return null;
    let s = { ...raw };
    let v = Number.isFinite(+s.version) ? +s.version : 1;

    if (v === STATE_VERSION) return s;

    while (v < STATE_VERSION) {
        const mig = STATE_MIGRATIONS.find((m) => m.fromVersion === v);
        if (!mig) {
            console.warn("[Clicker] Missing migration from version", v, "to", STATE_VERSION);
            s.version = STATE_VERSION;
            return s;
        }
        s = mig.apply({ ...s });
        v = mig.toVersion;
    }
    s.version = STATE_VERSION;
    return s;
}

// Constants
export const BOT_COST = 1_000;
export const BIGBOT_COST = 5_000;
export const POWER_COST = 50_000;
export const TREE_COST = 1_000_000;

const BOT_TICK_MS = 10_000;
const BOT_TICK_BASE = 10;
const BIGBOT_TICK_BASE = 100;

const TREE_TICK_MS = 30_000;
const FRUIT_PER_TICK_PER_TREE = 1;

// Rewards - static import
import { clickerRewards } from "@estate/rewards/rewards_registry";

export class ClickerModel {
    constructor() {
        this.state = reactive({
            version: STATE_VERSION,

            clicks: 0,
            power: 1,
            level: 0,

            clickBots: 0,
            bigBots: 0,

            pearTrees: 0,
            cherryTrees: 0,

            pearFruits: 0,
            cherryFruits: 0,
        });

        this._listeners = new Set();
        this.on = (cb) => {
            this._listeners.add(cb);
            return () => this._listeners.delete(cb);
        };
        this._emit = (payload) => {
            for (const cb of this._listeners) cb(payload);
        };

        this.#load();
        this.#attachGlobalClick();
        this.#attachTimers();
        this.#attachRewardsTimer();
        this.#attachTreesTimer();
    }

    // Mutations

    add(n = 1) {
        this.state.clicks += n;
        this.#checkMilestones();
        this.#save();
    }

    set(n = 0) {
        this.state.clicks = n;
        this.#checkMilestones();
        this.#save();
    }

    reset() {
        this.state.version = STATE_VERSION;
        this.state.clicks = 0;
        this.state.power = 1;
        this.state.level = 0;
        this.state.clickBots = 0;
        this.state.bigBots = 0;
        this.state.pearTrees = 0;
        this.state.cherryTrees = 0;
        this.state.pearFruits = 0;
        this.state.cherryFruits = 0;
        this.#save();
    }

    buyClickBot() {
        if (this.state.clicks >= BOT_COST) {
            this.state.clicks -= BOT_COST;
            this.state.clickBots += 1;
            if (this.state.level < 1) this.state.level = 1;
            this.#save();
        }
    }

    buyBigBot() {
        if (this.state.clicks >= BIGBOT_COST) {
            this.state.clicks -= BIGBOT_COST;
            this.state.bigBots += 1;
            if (this.state.level < 2) this.state.level = 2;
            this.#save();
        }
    }

    buyPower() {
        if (this.state.level >= 3 && this.state.clicks >= POWER_COST) {
            this.state.clicks -= POWER_COST;
            this.state.power += 1;
            this.#save();
        }
    }

    buyTree() {
        if (this.state.clicks < TREE_COST) return;
        this.state.clicks -= TREE_COST;
        if (Math.random() < 0.5) this.state.pearTrees += 1;
        else this.state.cherryTrees += 1;
        this.#save();
    }

    // Grants

    grantClicks(n) {
        if (!n) return;
        this.state.clicks += n;
        this.#checkMilestones();
        this.#save();
    }
    grantClickBots(n) {
        if (!n) return;
        this.state.clickBots += n;
        if (this.state.level < 1) this.state.level = 1;
        this.#save();
    }
    grantBigBots(n) {
        if (!n) return;
        this.state.bigBots += n;
        if (this.state.level < 2) this.state.level = 2;
        this.#save();
    }
    grantPower(n) {
        if (!n) return;
        this.state.power += n;
        if (this.state.level < 3) this.state.level = 3;
        this.#save();
    }

    // Getters

    get totalTrees() {
        return (this.state.pearTrees || 0) + (this.state.cherryTrees || 0);
    }
    get totalFruits() {
        return (this.state.pearFruits || 0) + (this.state.cherryFruits || 0);
    }

    // Rewards

    rollReward() {
        if (!clickerRewards) {
            console.info("Rewards system not available");
            return null;
        }
        try {
            const cand = this.getRewardCandidate();
            if (!cand) return null;
            this.applyReward(cand.key);
            return cand;
        } catch (e) {
            console.error("Error rolling reward:", e);
            return null;
        }
    }

    getRewardCandidate() {
        if (!clickerRewards || typeof clickerRewards.getEntries !== "function") {
            return null;
        }
        try {
            const entries = clickerRewards.getEntries();
            const avail = [];
            for (const [key, r] of entries) {
                if (r && typeof r.isAvailable === "function" && r.isAvailable(this)) {
                    avail.push({ key, r });
                }
            }
            if (!avail.length) return null;

            const total = avail.reduce((s, it) => s + (it.r.weight || 1), 0);
            let pick = Math.random() * total;
            let choice = avail[0];
            for (const it of avail) {
                pick -= it.r.weight || 1;
                if (pick <= 0) {
                    choice = it;
                    break;
                }
            }
            return { key: choice.key, label: choice.r.label };
        } catch (e) {
            console.error("Error getting reward candidate:", e);
            return null;
        }
    }

    applyReward(key) {
        if (!clickerRewards) return false;
        try {
            const entry = clickerRewards.get(key);
            if (!entry) return false;
            if (typeof entry.apply === "function") {
                entry.apply(this);
                this._emit({ type: "reward", label: entry.label, key });
                return true;
            }
            return false;
        } catch (e) {
            console.error("Error applying reward:", e);
            return false;
        }
    }

    // Milestones/Save

    #checkMilestones() {
        if (this.state.level === 0 && this.state.clicks >= 1_000) {
            this.state.level = 1;
            this._emit({ type: "milestone", key: "bots_unlocked", level: 1, clicks: this.state.clicks });
        }
        if (this.state.level < 2 && this.state.clicks >= 10_000) {
            this.state.level = 2;
        }
        if (this.state.level < 3 && this.state.clicks >= 100_000) {
            this.state.level = 3;
            this._emit({ type: "milestone", key: "power_unlocked", level: 3, clicks: this.state.clicks });
        }
        if (this.state.level < 4 && this.state.clicks >= 1_000_000) {
            this.state.level = 4;
        }
    }

    #save() {
        try {
            const toSave = { ...this.state, version: STATE_VERSION };
            browser.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch {
        }
    }

    #load() {
        try {
            const raw = browser.localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const parsed = JSON.parse(raw);
            const migrated = migrateState(parsed) || parsed;

            this.state.version = Number.isFinite(+migrated.version) ? +migrated.version : STATE_VERSION;
            this.state.clicks = Number.isFinite(+migrated.clicks) ? +migrated.clicks : 0;
            this.state.power = Number.isFinite(+migrated.power) ? +migrated.power : 1;
            this.state.level = Number.isFinite(+migrated.level) ? +migrated.level : 0;
            this.state.clickBots = Number.isFinite(+migrated.clickBots) ? +migrated.clickBots : 0;
            this.state.bigBots = Number.isFinite(+migrated.bigBots) ? +migrated.bigBots : 0;
            this.state.pearTrees = Number.isFinite(+migrated.pearTrees) ? +migrated.pearTrees : 0;
            this.state.cherryTrees = Number.isFinite(+migrated.cherryTrees) ? +migrated.cherryTrees : 0;
            this.state.pearFruits = Number.isFinite(+migrated.pearFruits) ? +migrated.pearFruits : 0;
            this.state.cherryFruits = Number.isFinite(+migrated.cherryFruits) ? +migrated.cherryFruits : 0;

            if (this.state.version !== parsed.version) {
                this.#save();
            }
        } catch {
        }
    }

    // Timers

    #attachGlobalClick() {
        const isInteractive = (el) =>
            el.closest(
                ".o_clicker_systray," +
                ".dropdown-menu," + 
                ".o-dropdown--menu," +
                ".modal," +
                ".o_control_panel," +
                ".o_menu_systray," +
                "button,.btn,a,input,textarea,select,[contenteditable],[role='button']," +
                "[data-clicker-ignore]"
            );

        const handler = (ev) => {
            if (isInteractive(ev.target)) return;
            this.add(1);
        };

        const attach = () => {
            if (!document.body.__estateClickerBound__) {
                document.body.addEventListener("click", handler, { capture: true });
                document.body.__estateClickerBound__ = true;
            }
        };
        document.body ? attach() : window.addEventListener("DOMContentLoaded", attach, { once: true });
    }


    #attachTimers() {
        if (!window.__estateClickerBotsTimer__) {
            window.__estateClickerBotsTimer__ = setInterval(() => {
                const base =
                    this.state.clickBots * BOT_TICK_BASE +
                    this.state.bigBots * BIGBOT_TICK_BASE;
                if (base) {
                    this.state.clicks += base * this.state.power;
                    this.#checkMilestones();
                    this.#save();
                }
            }, BOT_TICK_MS);
        }
    }

    #attachRewardsTimer() {
        if (!window.__estateClickerRewardsTimer__) {
            window.__estateClickerRewardsTimer__ = setInterval(() => {
                if (clickerRewards && Math.random() < 0.3) {
                    this.rollReward();
                }
            }, 30_000);
        }
    }

    #attachTreesTimer() {
        if (!window.__estateClickerTreesTimer__) {
            window.__estateClickerTreesTimer__ = setInterval(() => {
                const { pearTrees, cherryTrees } = this.state;
                if (pearTrees || cherryTrees) {
                    this.state.pearFruits += pearTrees * FRUIT_PER_TICK_PER_TREE;
                    this.state.cherryFruits += cherryTrees * FRUIT_PER_TICK_PER_TREE;
                    this.#save();
                }
            }, TREE_TICK_MS);
        }
    }
}