{
    "name": "Real Estate",
    "summary": "Real estate tutorial app",
    "version": "18.0.0.1.0",
    "category": "Tutorial",
    "author": "Paula R.",
    "website": "",
    "license": "OPL-1",
    "depends": ["base"],
    "data": [
        "security/ir.model.access.csv",
        "views/estate_actions.xml",
        "views/estate_property_views.xml",
        "views/estate_property_type_views.xml",
        "views/estate_property_tag_views.xml",
        "views/estate_property_offer_views.xml",
        "views/estate_menus.xml",
        "demo/estate_demo.xml"
    ],
    "demo": [
        "demo/estate_demo.xml",
    ],
    # "assets": {
    #     "web.assets_backend": [
    #          "estate/static/src/css/estate_list.css",
    #     ],
    # },
    "application": True,
    "installable": True,
}