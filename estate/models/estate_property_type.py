from odoo import api, fields, models

class EstatePropertyType(models.Model):
    _name = "estate.property.type"
    _description = "Property Type"
    _order = "sequence, name"

    name = fields.Char(required=True)
    sequence = fields.Integer(default=10, help="Lower = higher priority.")
    property_ids = fields.One2many(
        comodel_name="estate.property",
        inverse_name="property_type_id",
        string="Properties",
    )

    offer_ids = fields.One2many(
        "estate.property.offer", "property_type_id", string="Offers"
    )

    offer_count = fields.Integer(
        compute="_compute_offer_count",
        string="Offers",
        store=False,
    )

    @api.depends("offer_ids")
    def _compute_offer_count(self):
        for rec in self:
            rec.offer_count = len(rec.offer_ids)

    _sql_constraints = [
        ('type_name_unique', 'unique(name)', 'Property Type must be unique.'),
    ]