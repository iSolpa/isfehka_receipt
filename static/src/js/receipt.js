/** @odoo-module */

import { OrderReceipt } from "@point_of_sale/app/screens/receipt_screen/receipt/order_receipt";
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";
import { useState } from "@odoo/owl";

console.log("[ISFEHKA Receipt] Loading receipt component patch");

patch(OrderReceipt.prototype, {
    setup() {
        console.log("[ISFEHKA Receipt] Setting up receipt component");
        console.log("[ISFEHKA Receipt] Component stack trace:", new Error().stack);
        
        super.setup();
        this.state = useState({ 
            imageLoaded: false,
            receiptImage: null
        });
        this.rpc = useService("rpc");
        
        // If this is a reprint (has props.data), try to load the image
        if (this.props.data?.name) {
            console.log("[ISFEHKA Receipt] Order data found:", {
                name: this.props.data.name,
                hasImage: !!this.props.data.isfehka_receipt_image,
                isReprint: true
            });
            
            // If we already have the image in props, use it
            if (this.props.data.isfehka_receipt_image) {
                this.state.receiptImage = this.props.data.isfehka_receipt_image;
                this.state.imageLoaded = true;
                console.log("[ISFEHKA Receipt] Using existing image from props");
            } else {
                // Otherwise load it
                console.log("[ISFEHKA Receipt] Attempting to load image for reprint");
                this._loadReceiptImage(this.props.data.name).then((imageData) => {
                    if (imageData) {
                        this.state.receiptImage = imageData;
                        this.state.imageLoaded = true;
                        console.log("[ISFEHKA Receipt] Image loaded and stored in state");
                    }
                });
            }
        } else {
            console.log("[ISFEHKA Receipt] No order data found - likely new receipt");
        }
        
        console.log("[ISFEHKA Receipt] Receipt component setup complete");
        console.log("[ISFEHKA Receipt] Environment details:", {
            hasPos: !!this.env.pos,
            hasCurrentOrder: !!this.env.pos?.get_order(),
            currentOrderName: this.env.pos?.get_order()?.name,
            hasSession: !!this.env.pos?.pos_session,
        });
    },
    
    async _loadReceiptImage(pos_reference) {
        console.log("[ISFEHKA Receipt] Loading receipt image for:", pos_reference);
        console.log("[ISFEHKA Receipt] Load image stack trace:", new Error().stack);
        
        try {
            const result = await this.rpc("/pos/get_order_receipt_image", {
                order_name: pos_reference,
            });
            
            console.log("[ISFEHKA Receipt] RPC result:", {
                success: result?.success,
                hasImageData: !!result?.image_data,
                orderName: pos_reference
            });
            
            if (result && result.success && result.image_data) {
                console.log("[ISFEHKA Receipt] Successfully loaded image");
                return result.image_data;
            }
        } catch (error) {
            console.error("[ISFEHKA Receipt] Error loading receipt image:", error);
            console.error("[ISFEHKA Receipt] Error stack:", error.stack);
        }
        return null;
    },
    
    get isfehkaReceiptImage() {
        console.log("[ISFEHKA Receipt] Getting receipt image from state:", {
            hasImage: !!this.state.receiptImage,
            imageLoaded: this.state.imageLoaded
        });
        
        return this.state.receiptImage;
    }
});
