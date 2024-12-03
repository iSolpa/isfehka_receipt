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
                throw new Error("Invalid order data - missing order name");
            }

            console.log("[ISFEHKA Receipt] Getting receipt for order:", order.name);
            
            const result = await this.env.services.rpc('/pos/get_order_receipt_image', {
                order_name: order.name,
            });

            if (result.error) {
                throw new Error(`Failed to load receipt image: ${result.error}`);
            }

            if (!result.success || !result.image_data) {
                throw new Error('No image data received from server');
            }
            
            console.log("[ISFEHKA Receipt] Successfully loaded receipt image data");
            return result.image_data;
            
        } catch (error) {
            console.error("[ISFEHKA Receipt] Error loading receipt image:", error);
            throw error;
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

            // Add reprint flag and image data
            orderData.isReprint = true;
            orderData.isfehka_receipt_image = receiptImage;  // Use the same property name as in receipt.js
            
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