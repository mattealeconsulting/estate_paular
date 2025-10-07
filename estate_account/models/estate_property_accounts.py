from odoo import models, _, Command
from odoo.exceptions import UserError

class EstateProperty(models.Model):
    _inherit = "estate.property"

    def action_sell(self):
        res = super().action_sell()
        AccountMove = self.env["account.move"]
        Journal = self.env["account.journal"]
        journal_cache = {}

        for prop in self:
            if prop.state != "sold":
                continue
            if not prop.buyer_id or not prop.selling_price or prop.selling_price <= 0:
                continue

            company = prop.company_id or self.env.company
            existing = AccountMove.search([
                ("move_type", "=", "out_invoice"),
                ("partner_id", "=", prop.buyer_id.id),
                ("invoice_origin", "=", prop.name or ""),
                ("state", "in", ("draft", "posted")),
                ("company_id", "=", company.id),
            ], limit=1)
            if existing:
                continue

            if company.id not in journal_cache:
                journal_cache[company.id] = Journal.search([
                    ("type", "=", "sale"),
                    ("company_id", "=", company.id),
                ], limit=1)
            journal = journal_cache[company.id]
            if not journal:
                raise UserError(_("Please configure a Sales Journal to create invoices."))

            commission = prop.currency_id.round((prop.selling_price or 0.0) * 0.06)
            admin_fee = prop.currency_id.round(100.0)

            move_vals = {
                "move_type": "out_invoice",
                "company_id": company.id,
                "currency_id": prop.currency_id.id,
                "partner_id": prop.buyer_id.id,
                "journal_id": journal.id,
                "invoice_origin": prop.name or "",
                "invoice_line_ids": [
                    Command.create({
                        "name": _("Commission (6%) - %s") % (prop.name or ""),
                        "quantity": 1.0,
                        "price_unit": commission,
                    }),
                    Command.create({
                        "name": _("Administrative fee"),
                        "quantity": 1.0,
                        "price_unit": admin_fee,
                    }),
                ],
                "narration": _(
                    "Property: %(prop)s | Expected: %(exp).2f | Sold: %(sold).2f"
                ) % {
                    "prop": prop.name or "",
                    "exp": prop.expected_price or 0.0,
                    "sold": prop.selling_price or 0.0,
                },
            }

            move = AccountMove.with_context(default_move_type="out_invoice").create(move_vals)
            move.action_post()

        return res