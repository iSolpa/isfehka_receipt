/** @odoo-module */

import { Order } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";
import { PosStore } from "@point_of_sale/app/store/pos_store";

console.log("[ISFEHKA Receipt] Loading model patches");

patch(Order.prototype, {
    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        console.log("[ISFEHKA Receipt] Exporting order as JSON:", {
            orderName: this.name,
            hasImage: !!this.isfehka_receipt_image,
            stack: new Error().stack
        });
        
        if (this.isfehka_receipt_image) {
            console.log("[ISFEHKA Receipt] Including receipt image in export for order:", this.name);
            json.isfehka_receipt_image = this.isfehka_receipt_image;
        }
        return json;
    },

    init_from_JSON(json) {
        console.log("[ISFEHKA Receipt] Initializing order from JSON:", {
            orderName: json.name,
            hasImage: !!json.isfehka_receipt_image,
            stack: new Error().stack
        });
        
        super.init_from_JSON(...arguments);
        if (json.isfehka_receipt_image) {
            console.log("[ISFEHKA Receipt] Found receipt image in JSON data for order:", json.name);
            this.isfehka_receipt_image = json.isfehka_receipt_image;
        }
    }
});

patch(PosStore.prototype, {
    async loadReceiptImage(orderData) {
        console.log("[ISFEHKA Receipt] PosStore loading receipt image:", {
            orderRef: orderData.pos_reference,
            stack: new Error().stack
        });
        
        try {
            const result = await this.rpc({
                model: 'pos.order',
                method: 'get_receipt_image',
                args: [orderData.pos_reference],
            });
            
            console.log("[ISFEHKA Receipt] PosStore RPC result:", {
                success: !!result,
                hasImage: !!result?.image,
                orderRef: orderData.pos_reference
            });
            
            if (result && result.image) {
                console.log("[ISFEHKA Receipt] PosStore successfully loaded image for:", orderData.pos_reference);
                // Store in current order if it matches
                const currentOrder = this.get_order();
                if (currentOrder && currentOrder.name === orderData.pos_reference) {
                    currentOrder.isfehka_receipt_image = result.image;
                    console.log("[ISFEHKA Receipt] PosStore updated current order with image");
                }
                return result.image;
            } else {
                console.warn("[ISFEHKA Receipt] PosStore no image found in response");
            }
        } catch (error) {
            console.error("[ISFEHKA Receipt] PosStore error loading receipt image:", error);
            console.error("[ISFEHKA Receipt] PosStore error stack:", error.stack);
        }
        return null;
    },

    async _processData(loadedData) {
        console.log("[ISFEHKA Receipt] PosStore processing loaded data:", {
            hasSession: !!loadedData.pos_session,
            hasSessionImage: !!loadedData.pos_session?.isfehka_receipt_image,
            stack: new Error().stack
        });
        
        await super._processData(...arguments);
        if (loadedData.pos_session && loadedData.pos_session.isfehka_receipt_image) {
            console.log("[ISFEHKA Receipt] PosStore found receipt image in session data");
            this.pos_session.isfehka_receipt_image = loadedData.pos_session.isfehka_receipt_image;
        }
    }
});
