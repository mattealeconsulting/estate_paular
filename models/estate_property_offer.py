from odoo import api, fields, models
from odoo.exceptions import ValidationError


class EstatePropertyOffer(models.Model):
    _name = "estate.property.offer"
    _description = "Property Offer"
    _order = "price desc, id desc"

    price = fields.Float(required=True)
    partner_id = fields.Many2one("res.partner", string="Buyer", ondelete="set null")
    property_id = fields.Many2one(
        "estate.property",
        string="Property",
        required=True,
        ondelete="cascade",
        index=True,
    )
    status = fields.Selection(
        [("accepted", "Accepted"), ("refused", "Refused")],
        string="Status",
        copy=False,
    )

    validity = fields.Integer(string="Validity (days)", default=7)
    date_deadline = fields.Date(
        string="Deadline",
        compute="_compute_date_deadline",
        inverse="_inverse_date_deadline",
        store=True,
    )

    def _compute_date_deadline(self):
        for rec in self:
            base = fields.Date.context_today(rec)
            if rec.create_date:
                base = fields.Datetime.context_timestamp(rec, rec.create_date).date()
            rec.date_deadline = fields.Date.add(base, days=rec.validity or 0)

    def _inverse_date_deadline(self):
        for rec in self:
            base = fields.Date.context_today(rec)
            if rec.create_date:
                base = fields.Datetime.context_timestamp(rec, rec.create_date).date()
            if rec.date_deadline:
                rec.validity = (rec.date_deadline - base).days

    def _apply_accept_logic(self):
        for offer in self:
            prop = offer.property_id
            prop.write({
                "selling_price": offer.price,
                "buyer_id": offer.partner_id.id,
            })
            (prop.offer_ids - offer).filtered(lambda o: o.status != "refused").write({
                "status": "refused"
            })

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        for rec, vals in zip(records, vals_list):
            if vals.get("status") == "accepted":
                rec._apply_accept_logic()
        return records

    def write(self, vals):
        changing_status_to_accepted = vals.get("status") == "accepted" if "status" in vals else False
        res = super().write(vals)
        if "status" in vals:
            for rec in self:
                if rec.status == "accepted":
                    rec._apply_accept_logic()
                else:
                    accepted = rec.property_id.offer_ids.filtered(lambda o: o.status == "accepted")
                    if accepted:
                        rec.property_id.write({
                            "selling_price": accepted[0].price,
                            "buyer_id": accepted[0].partner_id.id,
                        })
                    else:
                        rec.property_id.write({"selling_price": 0.0, "buyer_id": False})
        return res

    @api.constrains("status", "property_id")
    def _check_single_accepted(self):
        for rec in self:
            if rec.status == "accepted":
                others = rec.property_id.offer_ids.filtered(lambda o: o.status == "accepted" and o.id != rec.id)
                if others:
                    raise ValidationError("Only one accepted offer is allowed per property.")

    _sql_constraints = [
        ("positive_price", "CHECK(price > 0)", "Offer price must be strictly positive."),
    ]
