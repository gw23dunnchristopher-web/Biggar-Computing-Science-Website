import { r as reactExports, j as jsxRuntimeExports, X } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { D as Download } from "./download-DGRZihqj.js";
import { I as Image, U as Upload } from "./upload-BqUh_JkD.js";
const DIAGRAM_HINTS = {
  drawing: "Create your diagram in another application (e.g. Google Slides, draw.io, or paper), take a screenshot, then paste it below.",
  "erd-annotation": "Draw your Entity-Relationship Diagram in another application, screenshot it, then paste it below.",
  "nav-structure": "Draw your navigation structure diagram in another application, screenshot it, then paste it below.",
  "nav-structure-higher": "Draw your navigation structure diagram in another application, screenshot it, then paste it below.",
  "structure-dataflow": "Draw your structure/data-flow diagram in another application, screenshot it, then paste it below.",
  "form-wireframe": "Design your form wireframe in another application, screenshot it, then paste it below."
};
function DiagramImageInput({ value, onChange, startingImageUrl, placeholder, hint }) {
  const fileInputRef = reactExports.useRef(null);
  const pasteZoneRef = reactExports.useRef(null);
  const handleImageFile = reactExports.useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result) onChange(result);
    };
    reader.readAsDataURL(file);
  }, [onChange]);
  const handlePaste = reactExports.useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageFile(file);
        break;
      }
    }
  }, [handleImageFile]);
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = "";
  };
  const handleDownloadStarting = () => {
    if (!startingImageUrl) return;
    const a = document.createElement("a");
    a.href = startingImageUrl;
    a.download = "starting-diagram.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const hintText = hint || placeholder;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 mt-4", children: [
    startingImageUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-blue-800 dark:text-blue-300", children: "Starting Diagram" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: handleDownloadStarting, className: "h-7 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3 w-3 mr-1" }),
          " Download"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: startingImageUrl, alt: "Starting diagram", className: "max-w-full rounded border border-blue-200 dark:border-blue-700" })
    ] }),
    hintText && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2", children: hintText }),
    value ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative inline-block w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: value,
          alt: "Your diagram",
          className: "max-w-full rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          size: "sm",
          variant: "destructive",
          className: "absolute top-2 right-2 h-7 w-7 p-0",
          onClick: () => onChange(""),
          title: "Remove image",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
        }
      )
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        ref: pasteZoneRef,
        onPaste: handlePaste,
        tabIndex: 0,
        className: "border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-8 text-center cursor-pointer hover:border-red-400 dark:hover:border-red-500 focus:outline-none focus:border-red-500 dark:focus:border-red-400 transition-colors",
        onClick: () => pasteZoneRef.current?.focus(),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-10 w-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1", children: "Paste your diagram here" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-neutral-400 dark:text-neutral-500 mb-4", children: [
            "Click this area, then press ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-mono", children: "Ctrl+V" }),
            " to paste your screenshot"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              size: "sm",
              variant: "outline",
              onClick: (e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3 w-3 mr-1.5" }),
                " Upload Image File"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: "image/*",
              className: "hidden",
              onChange: handleFileChange
            }
          )
        ]
      }
    )
  ] });
}
export {
  DiagramImageInput as D,
  DIAGRAM_HINTS as a
};
//# sourceMappingURL=diagram-image-input-BvTCIJFA.js.map
