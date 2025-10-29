/** @odoo-module **/
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { Notebook } from "@web/core/notebook/notebook";
import { useClicker } from "@estate/hooks/use_clicker";
import { ClickValue } from "@estate/components/click_value/click_value";

export class ClickerClientAction extends Component {
  static template = "estate.ClickerClientAction";
  static components = { Notebook, ClickValue };

  setup() { this.clicker = useClicker(); }

  get state() { return this.clicker.state; }
  get defaultNotebookPage() {
    return this.state.level >= 4 ? "page_trees" : "page_clicks";
  }

  increment() { this.clicker.add(10); }
  reset() { this.clicker.reset(); }
  buyBot() { this.clicker.buyClickBot(); }
  buyBigBot() { this.clicker.buyBigBot(); }
  buyPower() { this.clicker.buyPower(); }
  buyTree() { this.clicker.buyTree(); }
  buyPeachTree() { this.clicker.buyPeachTree(); }
  rollReward() { this.clicker.rollReward(); }
}

registry.category("actions").add("estate.clicker_game_action", ClickerClientAction);
