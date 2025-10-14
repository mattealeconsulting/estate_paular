/** @odoo-module **/
import { registry } from "@web/core/registry";

export const DASHBOARD_ITEMS_CATEGORY = "estate.dashboard.items";

export function getDashboardEntries() {
  const cat = registry.category(DASHBOARD_ITEMS_CATEGORY);
  const raw = cat.getEntries ? cat.getEntries() : Object.entries(cat._registry || {});
  return raw
    .map(([key, item]) => ({ key, ...item }))
    .sort((a, b) => (a.sequence || 100) - (b.sequence || 100));
}

export function getDashboardItems() {
  return getDashboardEntries().map(({ key, ...item }) => item);
}
