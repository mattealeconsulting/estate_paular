/** @odoo-module **/
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";
import { _t } from "@web/core/l10n/translation";
import { useClicker } from "../hooks/use_clicker";
import { ClickValue } from "@estate/components/click_value/click_value";

class ClickerSystrayDropdown extends Component {
  static template = "estate.ClickerSystrayDropdown";
  static components = { Dropdown, DropdownItem, ClickValue };
  static props = {}

  setup() {
    this.clicker = useClicker();
  }
  get s() { return this.clicker.state; }
  get totalTrees() { return (this.s.pearTrees || 0) + (this.s.cherryTrees || 0) + (this.s.peachTrees || 0); }
  get totalFruits() { return (this.s.pearFruits || 0) + (this.s.cherryFruits || 0) + (this.s.peachFruits || 0); }

  openGame() {
    this.env.services.action.doAction({
      type: "ir.actions.client",
      tag: "estate.clicker_game_action",
      name: _t("Clicker Game"),
    });
  }
  buyClickBot() {
    if (this.s.clicks >= this.clicker.BOT_COST) this.clicker.buyClickBot();
  }
}

registry.category("systray").add(
  "estate.clicker_systray_dropdown",
  { Component: ClickerSystrayDropdown },
  { sequence: 10 }
);
