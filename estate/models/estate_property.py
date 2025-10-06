from odoo import api, fields, models, _
from odoo.exceptions import UserError, ValidationError
from odoo.tools.float_utils import float_compare

class EstateProperty(models.Model):
    _name = "estate.property"
    _description = "Real Estate Property"
    _order = "state, id desc"
    _rec_name = "name"
    _inherit = ["estate.manager.guard"]

    # Multi-company &currency
    company_id = fields.Many2one(
        "res.company", required=True, default=lambda self: self.env.company, index=True
    )
    currency_id = fields.Many2one(
        "res.currency", related="company_id.currency_id", store=True, readonly=True
    )

    # Fields
    name = fields.Char(string="Title", required=True)
    description = fields.Text(string="Description")

    postcode = fields.Char(string="Postcode")
    date_availability = fields.Date(
        string="Available From",
         copy=False,
         default=lambda self: fields.Date.add(fields.Date.context_today(self), months=3),
         help="Default: today + 3 months.")

    expected_price = fields.Monetary(string="Expected Price", required=True, currency_field="currency_id")
    selling_price = fields.Monetary(string="Selling Price", currency_field="currency_id", copy=False)

    bedrooms = fields.Integer(string="Bedrooms")
    living_area = fields.Integer(string="Living Area (sqm)")
    facades = fields.Integer(string="Facades")
    garage = fields.Boolean(string="Garage")
    garden = fields.Boolean(string="Garden")
    garden_area = fields.Integer(string="Garden Area (sqm)")
    garden_orientation = fields.Selection(
        selection = [
            ("north", "North"),
            ("south","South"),
            ("east","East"),
            ("west","West"),
        ],
        string="Garden Orientation",
    )

    active = fields.Boolean(default=True)

    state = fields.Selection(
        [
            ("new", "New"),
            ("offer_received", "Offer Received"),
            ("offer_accepted", "Offer Accepted"),
            ("sold", "Sold"),
            ("canceled", "Canceled"),
        ],
        string="Status",
        required=True,
        default="new",
        copy=False,
        index=True,
    )

    # Relations
    property_type_id = fields.Many2one("estate.property.type", string="Property Type", ondelete="set null", index=True)
    tag_ids = fields.Many2many("estate.property.tag", "estate_property_tag_rel", "property_id", "tag_id", string="Tags")
    offer_ids = fields.One2many("estate.property.offer", "property_id", string="Offers")
    salesperson_id = fields.Many2one("res.users", string="Salesperson", default=lambda s: s.env.user)
    buyer_id = fields.Many2one("res.partner", string="Buyer", copy=False)

    # Computed fields

    total_area = fields.Integer(
        string="Total area (sqm)",
        compute="_compute_total_area",
        store=True,
    )
    best_price = fields.Monetary(
        string="Best offer",
        currency_field="currency_id",
        compute="_compute_best_price",
        store=True,
    )

    @api.depends("living_area", "garden", "garden_area")
    def _compute_total_area(self):
        for rec in self:
            rec.total_area = (rec.living_area or 0) + (rec.garden_area or 0  if rec.garden else 0)
    
    @api.depends("offer_ids", "offer_ids.price")
    def _compute_best_price(self):
        for rec in self:
            prices = rec.offer_ids.mapped("price")
            rec.best_price = max(prices) if prices else 0.0
    
    @api.onchange("garden")
    def _onchange_garden(self):
        for rec in self:
            if rec.garden:
                rec.garden_area = rec.garden_area or 10
                rec.garden_orientation = rec.garden_orientation or "north"
            else:
                rec.garden_area = 0
                rec.garden_orientation = False

    # Actions state

    def action_cancel(self):
        self._ensure_estate_manager()
        for rec in self:
            if rec.state == "sold":
              raise UserError(_("A sold property cannot be canceled."))
            rec.write({"state": "canceled"})
        return True
    
    def action_sell(self):
        self._ensure_estate_manager()
        for rec in self:
            if rec.state == "canceled":
                raise UserError(_("Canceled properties cannot be sold."))
            accepted = rec.offer_ids.filtered(lambda o: o.status == "accepted")[:1]
            if not accepted:
                raise UserError(_("You must accept an offer before selling."))
            rec.write({"state": "sold"})
        return True
    
    # Constraints SQL

    _sql_constraints = [
        ("check_expected_price_positive",
        "CHECK(expected_price > 0)",
        "Expected price must be strictly positive."),
        ("check_selling_price_non_negative",
        "CHECK(selling_price >= 0)",
        "Selling price cannot be negative."),
    ]

    # Python constratints
    @api.constrains("selling_price", "expected_price", "state","currency_id")
    def _check_selling_vs_expected(self):
        for rec in self:
            if rec.selling_price and rec.expected_price and rec.state != "canceled":
                threshold = rec.expected_price * 0.90
                if float_compare(rec.selling_price, threshold, precision_rounding=rec.currency_id.rounding)<0:
                    raise ValidationError(_("Selling Price must be at least 90% of Expected Price."))
