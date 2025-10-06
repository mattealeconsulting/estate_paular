
from odoo import api, fields, models, _
from odoo.exceptions import UserError, ValidationError


class EstatePropertyOffer(models.Model):
    _name = "estate.property.offer"
    _description = "Property Offer"
    _order = "price desc, id desc"
    _inherit = ["estate.manager.guard"]

    property_id = fields.Many2one(
        "estate.property", string="Property", required=True, ondelete="cascade", index=True
    )
    property_type_id = fields.Many2one(
        "estate.property.type",
        related="property_id.property_type_id",
        store=True,
        index=True,
        readonly=True,
        string="Property Type",
    )
    company_id = fields.Many2one("res.company", related="property_id.company_id", store=True, readonly=True, index=True)
    currency_id = fields.Many2one("res.currency", related="property_id.currency_id", store=True, readonly=True)

    price = fields.Monetary(required=True, currency_field="currency_id")
    partner_id = fields.Many2one("res.partner", string="Buyer", ondelete="set null")
    status = fields.Selection(
        [
            ("pending", "Pending"),
            ("accepted", "Accepted"),
            ("refused", "Refused"),
        ],
        default="pending",
        string="Status",
        copy=False,
        index=True,
    )


    validity = fields.Integer(string="Validity (days)", default=7, help="Number of days the offer remains valid.")
    date_deadline = fields.Date(
        string="Deadline",
        compute="_compute_date_deadline",
        inverse="_inverse_date_deadline",
        store=True,
    )

    # Constraints 
    _sql_constraints = [
        ('positive_price', 'CHECK(price > 0)', 'Offer price must be strictly positive.'),
        ('unique_offer_per_partner',
        'UNIQUE(property_id, partner_id)',
        'A partner can only make one offer per property.'),
    ]

    @api.depends("validity", "create_date")
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
                rec.validity = max((rec.date_deadline - base).days, 0)

    @api.onchange("validity")
    def _onchange_validity(self):
        for rec in self:
            rec._compute_date_deadline()

    @api.onchange("date_deadline")
    def _onchange_date_deadline(self):
        for rec in self:
            rec._inverse_date_deadline()

    def _apply_accept_logic(self):
        for offer in self:
            prop = offer.property_id
            prop.write({
                "selling_price": offer.price,
                "buyer_id": offer.partner_id.id,
                "state": "offer_accepted", 
            })
            (prop.offer_ids - offer).filtered(lambda o: o.status != "refused").write({
                "status": "refused"
            })

    @api.model_create_multi
    def create(self, vals_list):
        prop_ids = {vals.get("property_id") for vals in vals_list if vals.get("property_id")}
        props_by_id ={}
        if prop_ids:
            props = self.env["estate.property"].browse([pid for pid in prop_ids if pid])
            for p in props:
                if p.state in ("sold", "canceled"):
                    raise UserError(_("You cannot create an offer for a sold or canceled property."))
                props_by_id[p.id] = p
        for vals in vals_list:
            prop_id = vals.get("property_id")
            price = vals.get("price", 0.0)
            if prop_id and price is not None:
                prop = props_by_id.get(prop_id)
                min_allowed = 0.90 * (prop.expected_price or 0.0)
                if price < min_allowed:
                    raise ValidationError(
                        _("Offer must be at least 90%% of expected price (minimum: %.2f).") % min_allowed
                    )
        records = super().create(vals_list)
        for rec in records:
            if rec.property_id and rec.property_id.state == "new":
                rec.property_id.write({"state": "offer_received"})
        return records

    def write(self, vals):
        if vals.get("status") == "accepted":
            for rec in self:
                prop = rec.property_id
                if (prop.offer_ids - rec).filtered(lambda o: o.status == "accepted"):
                    raise ValidationError(_("Only one offer can be accepted."))
        res = super().write(vals)
        if "status" in vals:
            for rec in self:
                prop = rec.property_id
                if rec.status == "accepted":
                    rec._apply_accept_logic()
                elif rec.status == "refused":
                    accepted = prop.offer_ids.filtered(lambda o: o.status == "accepted")
                    if not accepted:
                        prop.write({
                            "selling_price": 0.0,
                            "buyer_id": False,
                            "state": ("offer_received" if prop.offer_ids else "new"),
                        })
        return res

    # Status
    def action_accept(self):
        self._ensure_estate_manager()
        for rec in self:
            if (rec.property_id.offer_ids - rec).filtered(lambda o: o.status == "accepted"):
                raise ValidationError(_("Only one offer can be accepted."))
            rec.write({"status": "accepted"})
        return True

    def action_refuse(self):
        self._ensure_estate_manager()
        self.write({"status": "refused"})
        return True

    @api.constrains("validity")
    def _check_validity_non_negative(self):
        for rec in self:
            if rec.validity is not None and rec.validity < 0:
                raise ValidationError(_("Validity (days) must be >= 0."))

    @api.constrains("status", "property_id")
    def _check_single_accepted(self):
        for rec in self:
            if rec.status == "accepted":
                others = rec.property_id.offer_ids.filtered(
                    lambda o: o.status == "accepted" and o.id != rec.id
                )
                if others:
                    raise ValidationError(_("Only one accepted offer is allowed per property."))
    
    @api.constrains("status", "partner_id")
    def _check_partner_on_accept(self):
        for rec in self:
            if rec.status == "accepted" and not rec.partner_id:
                raise ValidationError(_("An accepted offer must have a buyer."))
    
    @api.constrains("price", "property_id")
    def _check_not_lower_than_existing(self):
        for rec in self:
            if not rec.property_id or rec.price is None:
                continue
            others = (rec.property_id.offer_ids - rec).sorted(key=lambda o: o.price, reverse=True)
            if others and rec.price < others[0].price:
                raise ValidationError(
                    _("You cannot set an offer lower than the current best offer (%.2f).") % others[0].price
                )