import { j as jsxRuntimeExports } from "./index-DZjJp9Jo.js";
import purify from "./purify.es-DdxQyCyd.js";
function decodeAndSanitize(raw) {
  let content = raw;
  if (/&lt;[a-z/]/i.test(content)) {
    const tmp = document.createElement("textarea");
    tmp.innerHTML = content;
    content = tmp.value;
  }
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  if (isHtml) {
    const processed = content.replace(/<p><\/p>/g, "<p>&nbsp;</p>");
    return { html: purify.sanitize(processed), isHtml: true };
  }
  return { html: content, isHtml: false };
}
function RichTextBlock({
  content,
  className = ""
}) {
  const { html, isHtml } = decodeAndSanitize(content);
  if (isHtml) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `rich-text-content ${className}`.trim(),
        dangerouslySetInnerHTML: { __html: html }
      }
    );
  }
  const paragraphs = html.split(/\n\n/);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `rich-text-content ${className}`.trim(), children: paragraphs.map((para, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: para.split(/\n/).map((line, j, arr) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
    line || " ",
    j < arr.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("br", {})
  ] }, j)) }, i)) });
}
export {
  RichTextBlock as R
};
//# sourceMappingURL=RichTextBlock-B5hwZVHB.js.map
