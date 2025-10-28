/** @odoo-module **/
import { patch } from "@web/core/utils/patch";
import { FormController } from "@web/views/form/form_controller";

patch(FormController.prototype, {
    setup() {
        super.setup();

        try {
            if (Math.random() < 0.01) {
                Promise.resolve().then(() => {
                    this.env?.services?.clicker?.getReward?.();
                });
            }
        } catch (e) {
            console.warn("Clicker reward patch failed:", e);
        }
    },
});