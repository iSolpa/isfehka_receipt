/** @odoo-module */

import { OrderReceipt } from "@point_of_sale/app/screens/receipt_screen/receipt/order_receipt";
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";
import { useState } from "@odoo/owl";
import { usePos } from "@point_of_sale/app/store/pos_hook";

console.log("[ISFEHKA Receipt] Loading receipt component patch");

patch(OrderReceipt.prototype, {
    setup() {
        console.log("[ISFEHKA Receipt] Setting up receipt component");
        
        super.setup();
        this.pos = usePos();
        this.state = useState({ 
            imageLoaded: false,
            receiptImage: null
        });
        this.rpc = useService("rpc");

        // Determine receipt context
        const isReprint = this.props.data?.isReprint === true;
        const isPrint = this.props.data?.isPrint === true;
        const orderName = isReprint ? this.props.data?.name : this.pos?.get_order()?.name;

        console.log("[ISFEHKA Receipt] Receipt context:", {
            isReprint,
            isPrint,
            orderName,
            hasProps: !!this.props.data,
            hasPos: !!this.pos,
            hasOrder: !!this.pos?.get_order(),
            propsData: this.props.data
        });

        // Case 1: Reprint - Use image from props
        if (isReprint && this.props.data?.isfehka_receipt_image) {
            console.log("[ISFEHKA Receipt] Using existing image from reprint props:", {
                imageLength: this.props.data.isfehka_receipt_image.length,
                willSetImage: true
            });
            this.state.receiptImage = this.props.data.isfehka_receipt_image;
            this.state.imageLoaded = true;
            console.log("[ISFEHKA Receipt] Image set from reprint props:", {
                imageLength: this.state.receiptImage.length,
                imageLoaded: this.state.imageLoaded
            });
            return;
        }

        // Case 2: Print - Use image from props (set by ReceiptScreen)
        if (isPrint && this.props.data?.isfehka_receipt_image) {
            console.log("[ISFEHKA Receipt] Using image from print props:", {
                imageLength: this.props.data.isfehka_receipt_image.length,
                willSetImage: true
            });
            this.state.receiptImage = this.props.data.isfehka_receipt_image;
            this.state.imageLoaded = true;
            console.log("[ISFEHKA Receipt] Image set from print props:", {
                imageLength: this.state.receiptImage.length,
                imageLoaded: this.state.imageLoaded
            });
            return;
        }

        // Case 3: Display - Load image if needed
        if (!isReprint && !isPrint && orderName && !this.state.imageLoaded) {
            console.log("[ISFEHKA Receipt] Loading image for display:", orderName);
            this._loadReceiptImage(orderName).then((imageData) => {
                if (imageData) {
                    this.state.receiptImage = imageData;
                    this.state.imageLoaded = true;
                    console.log("[ISFEHKA Receipt] Image loaded successfully");
                    
                    // Store in order for future use
                    if (this.pos?.get_order()) {
                        this.pos.get_order().isfehka_receipt_image = imageData;
                        console.log("[ISFEHKA Receipt] Stored image in current order");
                    }
                }
            }).catch(error => {
                console.error("[ISFEHKA Receipt] Failed to load image:", error);
            });
        }
    },
    
    async _loadReceiptImage(pos_reference) {
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
                return result.image_data;
            }
        } catch (error) {
            console.error("[ISFEHKA Receipt] Error loading receipt image:", error);
        }
        return null;
    },
    
    get isfehkaReceiptImage() {
        console.log("[ISFEHKA Receipt] Getting receipt image from state:", {
            hasImage: !!this.state.receiptImage,
            stateKeys: Object.keys(this.state),
            imageLength: this.state.receiptImage?.length
        });
        return this.state.receiptImage;
    }
});
