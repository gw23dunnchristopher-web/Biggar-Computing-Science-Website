import { j as jsxRuntimeExports, g as cn } from "./index-DZjJp9Jo.js";
function RowLayout({ children, className }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: cn(
        "flex flex-col md:flex-row gap-4 items-start justify-start w-full",
        className
      ),
      "data-testid": "row-layout",
      children
    }
  );
}
function RowLayoutItem({ children, className }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: cn(
        "flex-shrink min-w-0 w-auto",
        className
      ),
      children
    }
  );
}
export {
  RowLayout as R,
  RowLayoutItem as a
};
//# sourceMappingURL=row-layout-Cx0Djyld.js.map
