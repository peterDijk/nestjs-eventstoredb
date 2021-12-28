"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewUpdaters = void 0;
class ViewUpdaters {
    static add(name, handler) {
        ViewUpdaters.updaters.set(name, handler);
    }
    static get(name) {
        return ViewUpdaters.updaters.get(name);
    }
}
exports.ViewUpdaters = ViewUpdaters;
ViewUpdaters.updaters = new Map();
