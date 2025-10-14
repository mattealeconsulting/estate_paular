/** @odoo-module **/
import { Component, useRef, onWillStart, onMounted, onWillUnmount, useEffect } from "@odoo/owl";
import { loadJS } from "@web/core/assets";

export class PieChart extends Component {
    static template = "estate.PieChart";
    static props = {
        data: { type: Object, optional: true },
        height: { type: Number, optional: true },
    };
    static defaultProps = { height: 360 };

    setup() {
        this.canvas = useRef("canvas");
        this._chart = null;

        onWillStart(async () => {
            await loadJS("/web/static/lib/Chart/Chart.js");
        });

        const render = () => {
            const labels = Object.keys(this.props.data || {});
            const values = Object.values(this.props.data || {});
            const ChartCtor = (window.Chart || Chart);

            const options = {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { bottom: 24 } },
                plugins: {
                    legend: {
                        position: "bottom",
                    },
                },
            };

            if (this._chart) {
                this._chart.data.labels = labels;
                this._chart.data.datasets[0].data = values;
                this._chart.options = options;
                this._chart.update();
                return;
            }

            const ctx = this.canvas.el.getContext("2d");
            this._chart = new ChartCtor(ctx, {
                type: "pie",
                data: { labels, datasets: [{ data: values }] },
                options,
            });
        };

        onMounted(render);
        useEffect(render, () => [JSON.stringify(this.props.data || {})]);

        onWillUnmount(() => {
            if (this._chart) {
                this._chart.destroy();
                this._chart = null;
            }
        });
    }
}
