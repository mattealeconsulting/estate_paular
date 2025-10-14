from datetime import datetime, time
from odoo import http, fields
from odoo.http import request

class EstateDashboardController(http.Controller):

    @http.route("/estate/dashboard/statistics", type="json", auth="user")
    def statistics(self):
        env = request.env
        P = env["estate.property"].sudo()
        O = env["estate.property.offer"].sudo()

        avail = [("state", "in", ["new", "offer_received", "offer_accepted"])]
        unavail = [("state", "in", ["sold", "canceled"])]

        available = P.search_count(avail)
        unavailable = P.search_count(unavail)
        pending = O.search_count([("status", "=", "pending")])

        grouped = P.read_group([], ["state"], ["state"])
        by_state = {}
        for rec in grouped:
            key = rec.get("state") or "unknown"
            count = rec.get("state_count")
            if count is None:
                count = rec.get("id_count", 0)
            by_state[key] = count


        first_day = fields.Date.context_today(env.user).replace(day=1)
        start_dt = datetime.combine(first_day, time.min)
        start_dt_str = fields.Datetime.to_string(start_dt)
        new_this_month = P.search_count([("create_date", ">=", start_dt_str)])

        return {
            "available": available,
            "unavailable": unavailable,
            "total": available + unavailable,
            "pending_offers": pending,
            "by_state": by_state,
            "new_this_month": new_this_month,
        }
