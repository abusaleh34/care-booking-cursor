"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const google_1 = require("next/font/google");
require("./globals.css");
const inter = (0, google_1.Inter)({ subsets: ["latin"] });
exports.metadata = {
    title: "Care Services Platform",
    description: "Professional care services at your fingertips",
};
function RootLayout({ children, }) {
    return children;
}
//# sourceMappingURL=layout.js.map