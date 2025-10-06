from odoo import fields, models

class EstatePropertyTag(models.Model):
    _name = "estate.property.tag"
    _description = "Property Tag"
    _order = "name"

    name = fields.Char(required=True)
    color = fields.Integer(string="Color")

    _sql_constraints = [
        ('tag_name_unique', 'UNIQUE(name)', 'Tag name must be unique.'),
    ]