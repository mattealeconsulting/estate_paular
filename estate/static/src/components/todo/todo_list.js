/** @odoo-module **/
import { Component, useState, onMounted, useRef, useEffect } from "@odoo/owl";

export class TodoList extends Component {
    static template = "estate.TodoList";
    static props = {
        title: { type: String, optional: true },
        storageKey: { type: String, optional: true },
        placeholder: { type: String, optional: true },
        slots: { optional: true },
    };
    static defaultProps = {
        storageKey: "estate.todo",
        placeholder: "Add a follow-up task and press Enter",
    };

    setup() {
        this.state = useState({ input: "", filter: "all", tasks: [] });
        this.key = this.props.storageKey;
        this.inputRef = useRef("todoInput");

        onMounted(() => {
            const raw = localStorage.getItem(this.key);
            if (raw) {
                try {
                    const arr = JSON.parse(raw);
                    if (Array.isArray(arr)) this.state.tasks = arr;
                } catch { }
            }
            if (this.inputRef.el) this.inputRef.el.focus();
        });

        useEffect(
            () => { if (this.inputRef.el) this.inputRef.el.focus(); },
            () => [this.state.tasks.length]
        );
    }

    _save() {
        try { localStorage.setItem(this.key, JSON.stringify(this.state.tasks)); } catch { }
    }

    onInputKeyup(ev) { if (ev.key === "Enter") this.addTask(); }

    addTask() {
        const text = (this.state.input || "").trim();
        if (!text) { if (this.inputRef.el) this.inputRef.el.focus(); return; }
        this.state.tasks = [...this.state.tasks, { id: Date.now(), text, done: false }];
        this.state.input = "";
        this._save();
    }

    toggleTask(t) { t.done = !t.done; this._save(); }
    removeTask(t) { this.state.tasks = this.state.tasks.filter(x => x.id !== t.id); this._save(); }
    clearCompleted() { this.state.tasks = this.state.tasks.filter(x => !x.done); this._save(); }
    setFilter(ev) { this.state.filter = ev.currentTarget.dataset.filter; }
    get filtered() {
        return this.state.filter === "active" ? this.state.tasks.filter(t => !t.done)
            : this.state.filter === "done" ? this.state.tasks.filter(t => t.done)
                : this.state.tasks;
    }
    get remaining() { return this.state.tasks.filter(t => !t.done).length; }
}
