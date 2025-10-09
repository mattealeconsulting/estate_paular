{
    "name": "Real Estate",
    "summary": "Real estate tutorial app",
    "version": "18.0.0.1.0",
    "category": "Tutorial",
    "author": "Paula R.",
    "website": "",
    "license": "OPL-1",
    "depends": ["base", "web"],
    "data": [
        "security/estate_security.xml",
        "security/ir.model.access.csv",
        "views/estate_actions.xml",
        "views/estate_menus.xml",
        "views/estate_property_views.xml",
        "views/estate_kanban_views.xml",
        "views/estate_property_type_views.xml",
        "views/estate_property_tag_views.xml",
        "views/estate_property_offer_views.xml",
        "views/res_users_views.xml",
        "demo/estate_demo.xml"
    ],
    "demo": [
        "demo/estate_demo.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "estate/static/src/**/*.xml",
            "estate/static/src/**/*.js",
        ],
    },
    "application": True,
    "installable": True,
}