{
    'name': 'Airproof Theme',
    'description': 'Airproof Theme - Drones, modelling, camera',
    'category': 'Tutorial',
    'version': '18.0.1.4',
    'author': 'Paula R',
    'license': 'OPL-1',
    'depends': ['website_sale', 'website_sale_wishlist', 'website_blog', 'website_mass_mailing'],
    'data': [
        'views/snippets/options.xml',
        'views/snippets/s_airproof_carousel.xml',
        'views/snippets/s_airproof_latest_news.xml',
        'data/presets.xml',
        'data/website.xml',
        'data/menu.xml',
        'data/gradients.xml',
        'data/shapes.xml',
        'data/pages/home.xml',
        'data/pages/about.xml',
        'data/pages/contact.xml',
        'data/products.xml',
        'data/blog.xml',
        'views/new_page_template_templates.xml',
        'views/website_templates.xml',
        'views/website_sale_templates.xml',
        'views/website_sale_wishlist_templates.xml',
        'data/images.xml',
    ],
    'assets': {
        'web._assets_primary_variables': [
            'website_airproof/static/src/scss/primary_variables.scss',
        ],
        'web._assets_frontend_helpers': [
            ('prepend', 'website_airproof/static/src/scss/bootstrap_overridden.scss'),
        ],
        'web.assets_frontend': [
            'website_airproof/static/src/scss/font.scss',
            'website_airproof/static/src/scss/components/mouse_follower.scss',
            'website_airproof/static/src/scss/layout/header.scss',
            'website_airproof/static/src/scss/pages/product_page.scss',
            'website_airproof/static/src/scss/pages/shop.scss',
            'website_airproof/static/src/scss/snippets/caroussel.scss',
            'website_airproof/static/src/scss/snippets/newsletter.scss',
            'website_airproof/static/src/scss/snippets/blog.scss',
            'website_airproof/static/src/snippets/s_airproof_carousel/000.scss',
            'website_airproof/static/src/js/mouse_follower.js',
        ],
    },
    'new_page_templates': {
        'airproof': {
            'services': ['s_parallax', 's_airproof_key_benefits_h2', 's_call_to_action', 's_airproof_carousel']
        }
    },
    "application": True,
    "installable": True,
}
