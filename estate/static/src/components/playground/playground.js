/** @odoo-module **/
import { Component, useState, onWillStart } from "@odoo/owl";
import { markup } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { Counter } from "@estate/components/counter/counter";
import { Card } from "@estate/components/card/card";
import { TodoList } from "@estate/components/todo_list/todo_list";

export class Playground extends Component {
  static template = "estate.Playground";
  static components = { Counter, Card, TodoList };
  static props = {};

  setup() {
    this.orm = useService("orm");
    this.state = useState({
      loading: true,
      availDomain: [["state", "in", ["new", "offer_received", "offer_accepted"]]],
      unavailDomain: [["state", "in", ["sold", "canceled"]]],
      available: 0,
      unavailable: 0,
      summaryHtml: null,
    });

    onWillStart(async () => {
      const [a, u] = await Promise.all([
        this.orm.searchCount("estate.property", this.state.availDomain),
        this.orm.searchCount("estate.property", this.state.unavailDomain),
      ]);
      this.state.available = a;
      this.state.unavailable = u;
      this.state.summaryHtml = markup(`
        <p class="mb-2">Current inventory status:</p>
        <p class="d-flex gap-2">
          <span class="badge bg-success">${a} Available</span>
          <span class="badge bg-danger">${u} Unavailable</span>
          <span class="badge bg-secondary">${a + u} Total</span>
        </p>
      `);
      this.state.loading = false;
    });
  }

  get total() {
    return (this.state.available ?? 0) + (this.state.unavailable ?? 0);
  }
}