/** @odoo-module */

import { ReceiptScreen } from "@point_of_sale/app/screens/receipt_screen/receipt_screen";
import { OrderReceipt } from "@point_of_sale/app/screens/receipt_screen/receipt/order_receipt";
import { patch } from "@web/core/utils/patch";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { useState } from "@odoo/owl";

console.log("[ISFEHKA Receipt] Loading receipt screen patch");

patch(ReceiptScreen.prototype, {
    setup() {
        console.log("[ISFEHKA Receipt] Setting up receipt screen");
        super.setup();
        this.pos = usePos();
        this.state = useState({
            receiptReady: false,
            error: null,
            receiptImage: null
        });
        
        // Get current order
        const currentOrder = this.pos?.get_order();
        console.log("[ISFEHKA Receipt] Receipt screen context:", {
            hasOrder: !!currentOrder,
            orderName: currentOrder?.name,
            orderState: currentOrder?.state
        });
    },

    async getReceiptImage() {
        try {
            const order = this.pos.get_order();
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

    async printReceipt() {
        console.log("[ISFEHKA Receipt] Starting print receipt");
        this.buttonPrintReceipt.el.className = "fa fa-fw fa-spin fa-circle-o-notch";

        try {
            const order = this.pos.get_order();
            const receiptData = order.export_for_printing();
            receiptData.isReprint = false;
            receiptData.isPrint = true;  // Add this flag for print case

            // Load image if not already loaded
            if (!this.state.receiptImage) {
                console.log("[ISFEHKA Receipt] Loading receipt image for print");
                this.state.receiptImage = await this.getReceiptImage();
            }

            if (this.state.receiptImage) {
                receiptData.isfehka_receipt_image = this.state.receiptImage;
                console.log("[ISFEHKA Receipt] Added image to receipt data:", {
                    hasImage: true,
                    orderName: order.name
                });
            }

            const isPrinted = await this.printer.print(
                OrderReceipt,
                {
                    data: receiptData,
                    formatCurrency: this.env.utils.formatCurrency,
                },
                { webPrintFallback: true }
            );

            if (isPrinted) {
                this.currentOrder._printed = true;
                console.log("[ISFEHKA Receipt] Receipt printed successfully");
            }
        } catch (error) {
            console.error("[ISFEHKA Receipt] Print error:", error);
        } finally {
            if (this.buttonPrintReceipt.el) {
                this.buttonPrintReceipt.el.className = "fa fa-print";
            }
        }
    }
});
