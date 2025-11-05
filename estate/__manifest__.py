{
    "name": "Real Estate",
    "summary": "Real estate tutorial app",
    "version": "18.0.0.1.0",
    "category": "Tutorial",
    "author": "Paula R.",
    "website": "",
    "license": "OPL-1",
    "depends": ["base", "web", "crm"],
    "data": [
        "security/estate_security.xml",
        "security/ir.model.access.csv",
        "views/estate_actions.xml",
        "views/estate_property_views.xml",
        "views/estate_kanban_views.xml",
        "views/estate_property_type_views.xml",
        "views/estate_property_tag_views.xml",
        "views/estate_property_offer_views.xml",
        "views/res_users_views.xml",
        "views/estate_menus.xml",
    ],
    "demo": [
        "demo/estate_demo.xml",
    ],
    "assets": {
        "web.assets_backend": [
            # Services
            "estate/static/src/services/dashboard_stats.js",
            
            # Rewards
            "estate/static/src/rewards/rewards_registry.js",

            # Clicker game
            "estate/static/src/models/clicker_model.js",
            "estate/static/src/services/clicker_service.js",
            "estate/static/src/hooks/use_clicker.js",
            "estate/static/src/utils/number.js",
            
            # Commands and patches
            "estate/static/src/commands/clicker_commands.js",
            "estate/static/src/patches/form_controller_reward.js",

            # Components
            "estate/static/src/components/click_value/click_value.xml",
            "estate/static/src/components/click_value/click_value.js",
            "estate/static/src/components/counter/counter.xml",
            "estate/static/src/components/counter/counter.js",

            # Lazy loading
            "estate/static/src/lazy/lazy_loader.xml",
            "estate/static/src/lazy/dashboard_lazy.js",
            "estate/static/src/lazy/playground_lazy.js",

            # Client actions
            "estate/static/src/client_actions/clicker_client_action.xml",
            "estate/static/src/client_actions/clicker_client_action.js",

            # Systray
            "estate/static/src/systray/clicker_systray_item.xml",
            "estate/static/src/systray/clicker_systray_item.js",
        ],

        "estate.dashboard_assets": [
            "estate/static/src/components/dashboard/dashboard.js",
            "estate/static/src/components/dashboard/dashboard.xml",
            "estate/static/src/components/dashboard/items_order.js",
            "estate/static/src/components/dashboard/items_prefs.js",
            "estate/static/src/components/dashboard/items_extra.js",
            "estate/static/src/components/dashboard/items_registry.js",
            "estate/static/src/components/dashboard/items_default.js",
            "estate/static/src/components/dashboard_item/dashboard_item.js",
            "estate/static/src/components/dashboard_item/dashboard_item.xml",
            "estate/static/src/components/pie_chart/pie_chart.js",
            "estate/static/src/components/pie_chart/pie_chart.xml",
        ],

        "estate.playground_assets": [
            "estate/static/src/components/card/card.js",
            "estate/static/src/components/card/card.xml",
            "estate/static/src/components/todo_list/todo_list.js",
            "estate/static/src/components/todo_list/todo_list.xml",
            "estate/static/src/components/playground/playground.js",
            "estate/static/src/components/playground/playground.xml",
        ],
    },
    "application": True,
    "installable": True,
}