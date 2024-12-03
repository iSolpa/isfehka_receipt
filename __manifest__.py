{
    'name': 'ISFEHKA Receipt',
    'version': '17.0.1.0.0',
    'category': 'Point of Sale',
    'summary': 'Custom ISFEHKA Receipt handling for POS',
    'description': """
        This module adds ISFEHKA receipt handling capabilities to POS sessions,
        converting PDF data to PNG images for receipt display.
    """,
    'depends': ['point_of_sale', 'account', 'isfehka'],
    'data': [
        'views/pos_session_views.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            'isfehka_receipt/static/src/js/models.js',
            'isfehka_receipt/static/src/js/receipt.js',
            'isfehka_receipt/static/src/js/reprint_screen.js',
            'isfehka_receipt/static/src/xml/receipt.xml',
        ],
    },
    'external_dependencies': {
        'python': ['PyMuPDF'],
    },
    'installable': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
