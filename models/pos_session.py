from odoo import models, fields, api
import fitz  # PyMuPDF
import base64
import logging

_logger = logging.getLogger(__name__)

class PosSession(models.Model):
    _inherit = 'pos.session'

    isfehka_receipt_image = fields.Binary(string='ISFEHKA Receipt Image', attachment=True)

    def _pos_ui_models_to_load(self):
        _logger.info("[ISFEHKA Receipt] Loading POS UI models")
        result = super()._pos_ui_models_to_load()
        result.append('pos.hkapdf')
        _logger.info("[ISFEHKA Receipt] Models to load: %s", result)
        return result

    def _loader_params_pos_session(self):
        _logger.info("[ISFEHKA Receipt] Setting up POS session loader params")
        result = super()._loader_params_pos_session()
        result['search_params']['fields'].append('isfehka_receipt_image')
        _logger.info("[ISFEHKA Receipt] Updated loader params: %s", result)
        return result

    def _loader_params_pos_hkapdf(self):
        return {
            'search_params': {
                'domain': [],
                'fields': ['name', 'image_data'],
            },
        }

    def _get_pos_ui_pos_hkapdf(self, params):
        return self.env['pos.hkapdf'].search_read(**params['search_params'])

    @api.depends('account_move.hka_pdf')
    def _compute_isfehka_receipt_image(self):
        for session in self:
            _logger.info("[ISFEHKA Receipt] Computing receipt image for session %s", session.id)
            try:
                if session.account_move and session.account_move.hka_pdf:
                    _logger.info("[ISFEHKA Receipt] Found HKA PDF for session %s", session.id)
                    # Decode the PDF data
                    pdf_data = base64.b64decode(session.account_move.hka_pdf)
                    
                    # Open the PDF using PyMuPDF
                    doc = fitz.open(stream=pdf_data, filetype="pdf")
                    _logger.info("[ISFEHKA Receipt] Opened PDF document for session %s", session.id)
                    
                    # Get the first page
                    page = doc[0]
                    
                    # Convert to PNG
                    pix = page.get_pixmap()
                    png_data = pix.tobytes()
                    _logger.info("[ISFEHKA Receipt] Converted PDF to PNG for session %s", session.id)
                    
                    # Convert PNG data to base64 for storing
                    session.isfehka_receipt_image = base64.b64encode(png_data)
                    _logger.info("[ISFEHKA Receipt] Stored PNG image for session %s", session.id)
                    
                    # Clean up
                    doc.close()
                else:
                    _logger.info("[ISFEHKA Receipt] No HKA PDF found for session %s", session.id)
                    session.isfehka_receipt_image = False
            except Exception as e:
                _logger.error("[ISFEHKA Receipt] Error converting PDF to PNG for session %s: %s", session.id, str(e))
                session.isfehka_receipt_image = False
