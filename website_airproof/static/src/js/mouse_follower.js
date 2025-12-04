/** @odoo-module **/

import publicWidget from '@web/legacy/js/public/public_widget';

const EASING = 0.15;

const MouseFollower = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    events: {
        'mousemove': '_onMouseMove',
    },

    start() {
        this._xp = 0;
        this._yp = 0;
        this._mouseX = 0;
        this._mouseY = 0;
        this._animationId = null;

        this._follower = document.createElement('div');
        this._follower.className = 'x_mouse_follower o_not_editable position-fixed rounded-circle bg-o-color-1 opacity-50 pe-none';
        this._follower.style.top = '0';
        this._follower.style.left = '0';
        this._follower.style.willChange = 'transform';

        const mainEl = this.el.querySelector('#top + main');
        if (mainEl) {
            mainEl.append(this._follower);
            this._animate();
        }

        return this._super(...arguments);
    },

    destroy() {
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
        }
        if (this._follower?.parentNode) {
            this._follower.remove();
        }
        return this._super(...arguments);
    },

    _animate() {
        this._xp += (this._mouseX - this._xp) * EASING;
        this._yp += (this._mouseY - this._yp) * EASING;

        this._follower.style.transform = `translate(${this._xp}px, ${this._yp}px) translate(-50%, -50%)`;

        this._animationId = requestAnimationFrame(() => this._animate());
    },

    _onMouseMove(ev) {
        this._mouseX = ev.clientX;
        this._mouseY = ev.clientY;
    },
});

publicWidget.registry.MouseFollower = MouseFollower;

export default MouseFollower;
