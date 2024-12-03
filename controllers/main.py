from odoo import http
from odoo.http import request
import logging
import base64

_logger = logging.getLogger(__name__)

class PosReceiptController(http.Controller):
    @http.route(['/pos/get_order_receipt_image'], type='json', auth='user')
    def get_order_receipt_image(self, order_name):
        _logger.info("[ISFEHKA Receipt] Getting receipt image for order: %s", order_name)
        try:
            order = request.env['pos.order'].search([('pos_reference', '=', order_name)], limit=1)
            if not order:
                _logger.warning("[ISFEHKA Receipt] No order found: %s", order_name)
                return {'error': 'Order not found'}
            
            if not order.account_move or not order.account_move.hka_pdf:
                _logger.warning("[ISFEHKA Receipt] No HKA PDF found for order: %s", order_name)
                return {'error': 'No HKA PDF found'}
            
            _logger.info("[ISFEHKA Receipt] Found HKA PDF for order: %s", order_name)
            
            # Convert PDF to image
            import fitz  # PyMuPDF
            pdf_data = base64.b64decode(order.account_move.hka_pdf)
            doc = fitz.open(stream=pdf_data, filetype="pdf")
            page = doc[0]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img_data = pix.tobytes("png")
            
            image_base64 = base64.b64encode(img_data).decode('utf-8')
            _logger.info("[ISFEHKA Receipt] Successfully converted PDF to image. Data length: %d", len(image_base64))
            
            return {
                'success': True,
                'image_data': image_base64
            }
            
        except Exception as e:
            _logger.error("[ISFEHKA Receipt] Error getting receipt image: %s", str(e))
            return {'error': str(e)}
