from odoo import api, fields, models

class EstateProperty(models.Model):
    _name = "estate.property"
    _description = "Real Estate Property"

    name = fields.Char(string="Title", required=True)
    description = fields.Text(string="Description")

    postcode = fields.Char(string="Postcode")
    date_availability = fields.Date(string="Available From")

    expected_price = fields.Float(string="Expected Price", required=True)
    selling_price = fields.Float(string="Selling Price")

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

    # Relations
    property_type_id = fields.Many2one(
        "estate.property.type", string="Property Type", ondelete="set null", index=True
    )
    tag_ids = fields.Many2many(
        "estate.property.tag", "estate_property_tag_rel", "property_id", "tag_id", string="Tags"
    )
    offer_ids = fields.One2many(
        "estate.property.offer", "property_id", string="Offers"
    )
    salesperson_id = fields.Many2one("res.users", string="Salesperson", default=lambda s: s.env.user)
    buyer_id = fields.Many2one("res.partner", string="Buyer", copy=False)

    # Computed fields

    total_area = fields.Integer(
        string="Total area (sqm)",
        compute="_compute_total_area",
        store=True,
    )
    best_price = fields.Float(
        string="Best offer",
        compute="_compute_best_price",
        store=True,
    )

    @api.depends("living_area", "garden", "garden_area")
    def _compute_total_area(self):
        for rec in self:
            rec.total_area = (rec.living_area or 0) + (rec.garden_area or 0  if rec.garden else 0)
    
    @api.depends("offer_ids.price")
    def _compute_best_price(self):
        for rec in self:
            prices = rec.offer_ids.mapped("price")
            rec.best_price = max(prices) if prices else 0.0
    
    @api._onchange("garden")
    def _onchange_garden(self):
        for rec in self:
            if rec.garden:
                rec.garden_area = rec.garden_area or 10
                rec.garden_orientation = rec.garden_orientation or "north"
            else:
                rec.garden_area = 0
                rec.garden_orientation = False
