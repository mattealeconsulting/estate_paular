# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request

KEY_TPL = "estate.clicker.state.%s"

def _default_state():
    return {
        "clicks": 0,
        "power": 1,
        "level": 0,
        "clickBots": 0,
        "bigBots": 0,
        "pearTrees": 0,
        "cherryTrees": 0,
        "pearFruits": 0,
        "cherryFruits": 0,
        "peachTrees": 0,
        "peachFruits": 0,
    }

class EstateClickerController(http.Controller):

    @http.route("/estate/clicker/get", type="json", auth="user", csrf=False)
    def clicker_get(self):
        uid = request.env.user.id
        key = KEY_TPL % uid
        ICP = request.env["ir.config_parameter"].sudo()
        raw = ICP.get_param(key)
        if not raw:
            return _default_state()
        try:
            import json
            data = json.loads(raw)
            base = _default_state()
            base.update({k: data.get(k, base[k]) for k in base.keys()})
            return base
        except Exception:
            return _default_state()

    @http.route("/estate/clicker/set", type="json", auth="user", csrf=False)
    def clicker_set(self, state=None):
        if not isinstance(state, dict):
            return {"ok": False}
        uid = request.env.user.id
        key = KEY_TPL % uid
        ICP = request.env["ir.config_parameter"].sudo()
        try:
            import json
            base = _default_state()
            base.update({k: state.get(k, base[k]) for k in base.keys()})
            ICP.set_param(key, json.dumps(base))
            return {"ok": True}
        except Exception:
            return {"ok": False}
