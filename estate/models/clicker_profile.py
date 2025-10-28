# -*- coding: utf-8 -*-
from odoo import api, fields, models

class EstateClickerProfile(models.Model):
    _name = "estate.clicker.profile"
    _description = "Clicker Profile"
    _rec_name = "user_id"
    _sql_constraints = [
        ("user_unique", "unique(user_id)", "Each user can only have one clicker profile."),
    ]

    user_id = fields.Many2one("res.users", required=True, ondelete="cascade", index=True)
    clicks = fields.Integer(default=0)
    power = fields.Integer(default=1)
    level = fields.Integer(default=0)
    click_bots = fields.Integer(default=0)
    big_bots = fields.Integer(default=0)
    pear_trees = fields.Integer(default=0)
    cherry_trees = fields.Integer(default=0)
    pear_fruits = fields.Integer(default=0)
    cherry_fruits = fields.Integer(default=0)

    @api.model
    def get_or_create_for_current_user(self):
        rec = self.search([("user_id", "=", self.env.user.id)], limit=1)
        if not rec:
            rec = self.create({"user_id": self.env.user.id})
        return rec

    @api.model
    def read_state(self):
        rec = self.get_or_create_for_current_user()
        return {
            "clicks": rec.clicks,
            "power": rec.power,
            "level": rec.level,
            "clickBots": rec.click_bots,
            "bigBots": rec.big_bots,
            "pearTrees": rec.pear_trees,
            "cherryTrees": rec.cherry_trees,
            "pearFruits": rec.pear_fruits,
            "cherryFruits": rec.cherry_fruits,
        }

    @api.model
    def write_state(self, vals):
        vals = dict(vals or {})
        for k in ("clicks", "power", "level", "clickBots", "bigBots"):
            if k in vals:
                try:
                    vals[k] = int(vals[k])
                except Exception:
                    vals[k] = 0
        rec = self.get_or_create_for_current_user()
        rec.write({
            "clicks": vals.get("clicks", rec.clicks),
            "power": vals.get("power", rec.power),
            "level": vals.get("level", rec.level),
            "click_bots": vals.get("clickBots", rec.click_bots),
            "big_bots": vals.get("bigBots", rec.big_bots),
            "pear_trees": vals.get("pearTrees", rec.pear_trees),
            "cherry_trees": vals.get("cherryTrees", rec.cherry_trees),
            "pear_fruits": vals.get("pearFruits", rec.pear_fruits),
            "cherry_fruits": vals.get("cherryFruits", rec.cherry_fruits),
        })
        return True
