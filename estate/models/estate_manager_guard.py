from odoo import api, models, _
from odoo.exceptions import UserError

class EstateManagerGuard(models.AbstractModel):
    _name = "estate.manager.guard"
    _description = "Guard for Estate Manager actions"

    @api.model
    def _ensure_estate_manager(self):
        if not self.env.user.has_group("estate.group_estate_manager"):
            raise UserError(_("Only Estate Managers can perform this action."))