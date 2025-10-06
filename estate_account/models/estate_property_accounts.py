from odoo import models, _, Command
from odoo.exceptions import UserError

class EstateProperty(models.Model):
    _inherit = "estate.property"

    def action_sell(self):
        res = super().action_sell()

        AccountMove = self.env["account.move"]
        Journal = self.env["account.journal"]

        for prop in self:
            if not prop.buyer_id or not prop.selling_price or prop.selling_price <= 0:
                continue
            
            existing = AccountMove.search([
                ("move_type", "=", "out_invoice"),
                ("partner_id", "=", prop.buyer_id.id),
                ("invoice_origin", "=", prop.name),
                ("state", "in", ("draft", "posted")),
                ("company_id", "=", prop.company_id.id),
            ], limit=1)
            if existing:
                continue

            journal = Journal.search([
                ("type", "=", "sale"),
                ("company_id", "=", prop.company_id.id),
            ], limit=1)
            if not journal:
                raise UserError(_("Please configure a Sales Journal to create invoices."))

            commission = prop.currency_id.round(prop.selling_price * 0.06)
            admin_fee = prop.currency_id.round(100.0)

            move_vals = {
                "move_type": "out_invoice",
                "company_id": prop.company_id.id,
                "currency_id": prop.currency_id.id,
                "partner_id": prop.buyer_id.id,
                "journal_id": journal.id,
                "invoice_origin": prop.name,
                "invoice_line_ids": [
                    Command.create({
                        "name": _("Commission (6%) - %s") % prop.name,
                        "quantity": 1.0,
                        "price_unit": commission,
                    }),
                    Command.create({
                        "name": _("Administrative fees"),
                        "quantity": 1.0,
                        "price_unit": admin_fee,
                    }),
                ],
                "narration": _(
                    "Property: %(prop)s | Expected: %(exp).2f | Sold: %(sold).2f"
                ) % {"prop": prop.name, "exp": prop.expected_price or 0.0, "sold": prop.selling_price or 0.0},
            }

            move = AccountMove.with_context(default_move_type="out_invoice").create(move_vals)
            move.action_post()  # postează factura

        return res