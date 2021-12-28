"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewUpdaterHandler = void 0;
const view_updaters_1 = require("../view-updaters");
function ViewUpdaterHandler(event) {
    return (target) => {
        view_updaters_1.ViewUpdaters.add(event.name, target);
    };
}
exports.ViewUpdaterHandler = ViewUpdaterHandler;
