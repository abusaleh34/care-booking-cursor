"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = void 0;
const React = require("react");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const Input = React.forwardRef(({ className, type, icon, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    return (<div className="relative">
        {icon && (<div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>)}
        <input type={isPassword && showPassword ? "text" : type} className={(0, utils_1.cn)("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", icon && "pl-10", isPassword && "pr-10", error && "border-destructive focus-visible:ring-destructive", className)} ref={ref} {...props}/>
        {isPassword && (<button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? (<lucide_react_1.EyeOff className="h-4 w-4"/>) : (<lucide_react_1.Eye className="h-4 w-4"/>)}
          </button>)}
        {error && (<p className="mt-1 text-xs text-destructive">{error}</p>)}
      </div>);
});
exports.Input = Input;
Input.displayName = "Input";
//# sourceMappingURL=input.js.map