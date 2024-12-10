/** @odoo-module */

import { ReprintReceiptScreen } from "@point_of_sale/app/screens/receipt_screen/reprint_receipt_screen";
import { OrderReceipt } from "@point_of_sale/app/screens/receipt_screen/receipt/order_receipt";
import { patch } from "@web/core/utils/patch";
import { useState } from "@odoo/owl";
import { usePos } from "@point_of_sale/app/store/pos_hook";

console.log("[ISFEHKA Receipt] Loading reprint screen patch");

patch(ReprintReceiptScreen.prototype, {
    setup() {
        super.setup();
        this.pos = usePos();
        this.state = useState({
            receiptReady: false,
            error: null,
            receiptImage: null
        });
    },

    async getReceiptImage() {
        try {
            const order = this.props.order;
            if (!order || !order.name) {
                console.warn("[ISFEHKA Receipt] Invalid order data - missing order name");
                return null;
            }

            console.log("[ISFEHKA Receipt] Getting receipt for order:", order.name);
            
            const result = await this.env.services.rpc('/pos/get_order_receipt_image', {
                order_name: order.name,
            });

            if (result.error) {
                console.warn("[ISFEHKA Receipt] Failed to load receipt image:", result.error);
                return null;
            }

            if (!result.success || !result.image_data) {
                console.warn('[ISFEHKA Receipt] No image data received from server');
                return null;
            }
            
            console.log("[ISFEHKA Receipt] Successfully loaded receipt image data");
            return result.image_data;
            
        } catch (error) {
            console.warn("[ISFEHKA Receipt] Error loading receipt image:", error);
            return null;
        }
    },

    async tryReprint() {
        try {
            // Get the receipt image first
            const receiptImage = await this.getReceiptImage();
            
            // Prepare order data
            let orderData;
            if (typeof this.props.order?.export_for_printing === 'function') {
                console.log("[ISFEHKA Receipt] Using order.export_for_printing");
                orderData = this.props.order.export_for_printing();
            } else {
                console.log("[ISFEHKA Receipt] Using props order directly");
                orderData = this.props.order;
            }

            // Add reprint flag and image data if available
            orderData.isReprint = true;
            if (receiptImage) {
                orderData.isfehka_receipt_image = receiptImage;
            } else {
                console.warn("[ISFEHKA Receipt] Proceeding without HKA receipt image");
            }
            
            console.log("[ISFEHKA Receipt] Order data prepared:", {
                hasData: !!orderData,
                hasImage: !!orderData.isfehka_receipt_image,
                dataKeys: Object.keys(orderData || {})
            });

            // Use parent's print structure with our modified data
            await this.printer.print(
                OrderReceipt,
                {
                    data: orderData,
                    formatCurrency: this.env.utils.formatCurrency,
                },
                { webPrintFallback: true }
            );

            console.log("[ISFEHKA Receipt] Print completed successfully");
        } catch (error) {
            console.error("[ISFEHKA Receipt] Error during print:", error);
            this.state.error = error.message;
            throw error;
        }
    }
});