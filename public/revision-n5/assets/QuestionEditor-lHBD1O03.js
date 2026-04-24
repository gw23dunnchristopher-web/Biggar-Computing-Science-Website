import { c as createLucideIcon, R as React, j as jsxRuntimeExports, v as createCollection, n as useControllableState, P as Primitive, m as useComposedRefs, o as composeEventHandlers, q as createContextScope, r as reactExports, g as cn, d as useRoute, u as useLocation, e as useQuestions, a as useToast, E as Eye, T as TOPICS, h as Type, X } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { I as Input } from "./input-BglVfhce.js";
import { T as Textarea } from "./textarea-DVZKhD5j.js";
import { L as Label } from "./label-DXOWQ5Is.js";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent } from "./card-D7eXR4Y_.js";
import { S as Save, a as Select, b as SelectTrigger, c as SelectValue, d as SelectContent, e as SelectItem } from "./select-BoXHqBzp.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle } from "./dialog-DTiCktmM.js";
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem } from "./dropdown-menu-DZfpUsGF.js";
import { R as Root, T as Trigger, c as Content, d as createCollapsibleScope, C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-CwuHQhjb.js";
import { u as useId } from "./index-C94DArSW.js";
import { u as useDirection } from "./index-D-MpoJPS.js";
import { C as ChevronDown } from "./chevron-down-C5HdvL5Z.js";
import { T as TextAlignStart, b as TextAlignCenter, c as TextAlignEnd, D as DiagramEditor } from "./diagram-editor-YPWk6RIh.js";
import { a as DatabaseSchemaEditor, D as DatabaseSchemaDisplay, T as TagMatchingEditor } from "./database-schema-editor-BRVA4I4S.js";
import { T as Table, R as RichTextEditor, a as RichTextDisplay, D as DataTableEditorModal } from "./rich-text-editor-BgZyQsfw.js";
import { R as ResponsiveDataTable } from "./responsive-data-table-CZUpIuB-.js";
import { R as RowLayout, a as RowLayoutItem } from "./row-layout-Cx0Djyld.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { P as Plus } from "./plus-Bl_GJopp.js";
import { I as Image, U as Upload } from "./upload-BqUh_JkD.js";
import { C as Code } from "./code-CkVOXEbl.js";
import { F as FileText } from "./file-text-7qIELcrq.js";
import { D as Database } from "./database-C7hi9e55.js";
import { T as Trash2 } from "./trash-2-bLg5w6uM.js";
import { C as CirclePlus } from "./circle-plus-RFmo1F9l.js";
import "./Combination-DqZOzdwe.js";
import "./index-CXp8eGpS.js";
import "./check-tIL4sncn.js";
import "./chevron-up-BGYeYs9P.js";
import "./index-CxDJjHs5.js";
import "./index-Ck6_BvxI.js";
import "./chevron-right-CVWIcf-n.js";
import "./circle-D4qz0ZWK.js";
import "./pencil-BpyvL5SV.js";
import "./list-CSQ5KgpQ.js";
import "./key-DEEIcqry.js";
import "./tabs-CtGyirbS.js";
import "./arrow-right-BGWMDShP.js";
const __iconNode$4 = [
  [
    "path",
    {
      d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
      key: "zw3jo"
    }
  ],
  [
    "path",
    {
      d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",
      key: "1wduqc"
    }
  ],
  [
    "path",
    {
      d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
      key: "kqbvx6"
    }
  ]
];
const Layers = createLucideIcon("layers", __iconNode$4);
const __iconNode$3 = [
  ["path", { d: "M8 18L12 22L16 18", key: "cskvfv" }],
  ["path", { d: "M12 2V22", key: "r89rzk" }]
];
const MoveDown = createLucideIcon("move-down", __iconNode$3);
const __iconNode$2 = [
  ["path", { d: "M8 6L12 2L16 6", key: "1yvkyx" }],
  ["path", { d: "M12 2V22", key: "r89rzk" }]
];
const MoveUp = createLucideIcon("move-up", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
      key: "1i5ecw"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
];
const Settings = createLucideIcon("settings", __iconNode$1);
const __iconNode = [
  ["rect", { width: "8", height: "6", x: "5", y: "4", rx: "1", key: "nzclkv" }],
  ["rect", { width: "8", height: "6", x: "11", y: "14", rx: "1", key: "4tytwb" }]
];
const Ungroup = createLucideIcon("ungroup", __iconNode);
var ACCORDION_NAME = "Accordion";
var ACCORDION_KEYS = ["Home", "End", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];
var [Collection, useCollection, createCollectionScope] = createCollection(ACCORDION_NAME);
var [createAccordionContext] = createContextScope(ACCORDION_NAME, [
  createCollectionScope,
  createCollapsibleScope
]);
var useCollapsibleScope = createCollapsibleScope();
var Accordion$1 = React.forwardRef(
  (props, forwardedRef) => {
    const { type, ...accordionProps } = props;
    const singleProps = accordionProps;
    const multipleProps = accordionProps;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.Provider, { scope: props.__scopeAccordion, children: type === "multiple" ? /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionImplMultiple, { ...multipleProps, ref: forwardedRef }) : /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionImplSingle, { ...singleProps, ref: forwardedRef }) });
  }
);
Accordion$1.displayName = ACCORDION_NAME;
var [AccordionValueProvider, useAccordionValueContext] = createAccordionContext(ACCORDION_NAME);
var [AccordionCollapsibleProvider, useAccordionCollapsibleContext] = createAccordionContext(
  ACCORDION_NAME,
  { collapsible: false }
);
var AccordionImplSingle = React.forwardRef(
  (props, forwardedRef) => {
    const {
      value: valueProp,
      defaultValue,
      onValueChange = () => {
      },
      collapsible = false,
      ...accordionSingleProps
    } = props;
    const [value, setValue] = useControllableState({
      prop: valueProp,
      defaultProp: defaultValue ?? "",
      onChange: onValueChange,
      caller: ACCORDION_NAME
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      AccordionValueProvider,
      {
        scope: props.__scopeAccordion,
        value: React.useMemo(() => value ? [value] : [], [value]),
        onItemOpen: setValue,
        onItemClose: React.useCallback(() => collapsible && setValue(""), [collapsible, setValue]),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionCollapsibleProvider, { scope: props.__scopeAccordion, collapsible, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionImpl, { ...accordionSingleProps, ref: forwardedRef }) })
      }
    );
  }
);
var AccordionImplMultiple = React.forwardRef((props, forwardedRef) => {
  const {
    value: valueProp,
    defaultValue,
    onValueChange = () => {
    },
    ...accordionMultipleProps
  } = props;
  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue ?? [],
    onChange: onValueChange,
    caller: ACCORDION_NAME
  });
  const handleItemOpen = React.useCallback(
    (itemValue) => setValue((prevValue = []) => [...prevValue, itemValue]),
    [setValue]
  );
  const handleItemClose = React.useCallback(
    (itemValue) => setValue((prevValue = []) => prevValue.filter((value2) => value2 !== itemValue)),
    [setValue]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    AccordionValueProvider,
    {
      scope: props.__scopeAccordion,
      value,
      onItemOpen: handleItemOpen,
      onItemClose: handleItemClose,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionCollapsibleProvider, { scope: props.__scopeAccordion, collapsible: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionImpl, { ...accordionMultipleProps, ref: forwardedRef }) })
    }
  );
});
var [AccordionImplProvider, useAccordionContext] = createAccordionContext(ACCORDION_NAME);
var AccordionImpl = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, disabled, dir, orientation = "vertical", ...accordionProps } = props;
    const accordionRef = React.useRef(null);
    const composedRefs = useComposedRefs(accordionRef, forwardedRef);
    const getItems = useCollection(__scopeAccordion);
    const direction = useDirection(dir);
    const isDirectionLTR = direction === "ltr";
    const handleKeyDown = composeEventHandlers(props.onKeyDown, (event) => {
      if (!ACCORDION_KEYS.includes(event.key)) return;
      const target = event.target;
      const triggerCollection = getItems().filter((item) => !item.ref.current?.disabled);
      const triggerIndex = triggerCollection.findIndex((item) => item.ref.current === target);
      const triggerCount = triggerCollection.length;
      if (triggerIndex === -1) return;
      event.preventDefault();
      let nextIndex = triggerIndex;
      const homeIndex = 0;
      const endIndex = triggerCount - 1;
      const moveNext = () => {
        nextIndex = triggerIndex + 1;
        if (nextIndex > endIndex) {
          nextIndex = homeIndex;
        }
      };
      const movePrev = () => {
        nextIndex = triggerIndex - 1;
        if (nextIndex < homeIndex) {
          nextIndex = endIndex;
        }
      };
      switch (event.key) {
        case "Home":
          nextIndex = homeIndex;
          break;
        case "End":
          nextIndex = endIndex;
          break;
        case "ArrowRight":
          if (orientation === "horizontal") {
            if (isDirectionLTR) {
              moveNext();
            } else {
              movePrev();
            }
          }
          break;
        case "ArrowDown":
          if (orientation === "vertical") {
            moveNext();
          }
          break;
        case "ArrowLeft":
          if (orientation === "horizontal") {
            if (isDirectionLTR) {
              movePrev();
            } else {
              moveNext();
            }
          }
          break;
        case "ArrowUp":
          if (orientation === "vertical") {
            movePrev();
          }
          break;
      }
      const clampedIndex = nextIndex % triggerCount;
      triggerCollection[clampedIndex].ref.current?.focus();
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      AccordionImplProvider,
      {
        scope: __scopeAccordion,
        disabled,
        direction: dir,
        orientation,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.Slot, { scope: __scopeAccordion, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.div,
          {
            ...accordionProps,
            "data-orientation": orientation,
            ref: composedRefs,
            onKeyDown: disabled ? void 0 : handleKeyDown
          }
        ) })
      }
    );
  }
);
var ITEM_NAME = "AccordionItem";
var [AccordionItemProvider, useAccordionItemContext] = createAccordionContext(ITEM_NAME);
var AccordionItem$1 = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, value, ...accordionItemProps } = props;
    const accordionContext = useAccordionContext(ITEM_NAME, __scopeAccordion);
    const valueContext = useAccordionValueContext(ITEM_NAME, __scopeAccordion);
    const collapsibleScope = useCollapsibleScope(__scopeAccordion);
    const triggerId = useId();
    const open = value && valueContext.value.includes(value) || false;
    const disabled = accordionContext.disabled || props.disabled;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      AccordionItemProvider,
      {
        scope: __scopeAccordion,
        open,
        disabled,
        triggerId,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Root,
          {
            "data-orientation": accordionContext.orientation,
            "data-state": getState(open),
            ...collapsibleScope,
            ...accordionItemProps,
            ref: forwardedRef,
            disabled,
            open,
            onOpenChange: (open2) => {
              if (open2) {
                valueContext.onItemOpen(value);
              } else {
                valueContext.onItemClose(value);
              }
            }
          }
        )
      }
    );
  }
);
AccordionItem$1.displayName = ITEM_NAME;
var HEADER_NAME = "AccordionHeader";
var AccordionHeader = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, ...headerProps } = props;
    const accordionContext = useAccordionContext(ACCORDION_NAME, __scopeAccordion);
    const itemContext = useAccordionItemContext(HEADER_NAME, __scopeAccordion);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.h3,
      {
        "data-orientation": accordionContext.orientation,
        "data-state": getState(itemContext.open),
        "data-disabled": itemContext.disabled ? "" : void 0,
        ...headerProps,
        ref: forwardedRef
      }
    );
  }
);
AccordionHeader.displayName = HEADER_NAME;
var TRIGGER_NAME = "AccordionTrigger";
var AccordionTrigger$1 = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, ...triggerProps } = props;
    const accordionContext = useAccordionContext(ACCORDION_NAME, __scopeAccordion);
    const itemContext = useAccordionItemContext(TRIGGER_NAME, __scopeAccordion);
    const collapsibleContext = useAccordionCollapsibleContext(TRIGGER_NAME, __scopeAccordion);
    const collapsibleScope = useCollapsibleScope(__scopeAccordion);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.ItemSlot, { scope: __scopeAccordion, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Trigger,
      {
        "aria-disabled": itemContext.open && !collapsibleContext.collapsible || void 0,
        "data-orientation": accordionContext.orientation,
        id: itemContext.triggerId,
        ...collapsibleScope,
        ...triggerProps,
        ref: forwardedRef
      }
    ) });
  }
);
AccordionTrigger$1.displayName = TRIGGER_NAME;
var CONTENT_NAME = "AccordionContent";
var AccordionContent$1 = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, ...contentProps } = props;
    const accordionContext = useAccordionContext(ACCORDION_NAME, __scopeAccordion);
    const itemContext = useAccordionItemContext(CONTENT_NAME, __scopeAccordion);
    const collapsibleScope = useCollapsibleScope(__scopeAccordion);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Content,
      {
        role: "region",
        "aria-labelledby": itemContext.triggerId,
        "data-orientation": accordionContext.orientation,
        ...collapsibleScope,
        ...contentProps,
        ref: forwardedRef,
        style: {
          ["--radix-accordion-content-height"]: "var(--radix-collapsible-content-height)",
          ["--radix-accordion-content-width"]: "var(--radix-collapsible-content-width)",
          ...props.style
        }
      }
    );
  }
);
AccordionContent$1.displayName = CONTENT_NAME;
function getState(open) {
  return open ? "open" : "closed";
}
var Root2 = Accordion$1;
var Item = AccordionItem$1;
var Header = AccordionHeader;
var Trigger2 = AccordionTrigger$1;
var Content2 = AccordionContent$1;
const Accordion = Root2;
const AccordionItem = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Item,
  {
    ref,
    className: cn("border-b", className),
    ...props
  }
));
AccordionItem.displayName = "AccordionItem";
const AccordionTrigger = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Header, { className: "flex", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Trigger2,
  {
    ref,
    className: cn(
      "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" })
    ]
  }
) }));
AccordionTrigger.displayName = Trigger2.displayName;
const AccordionContent = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    className: "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("pb-4 pt-0", className), children })
  }
));
AccordionContent.displayName = Content2.displayName;
function OptionsInput({
  value,
  onChange,
  placeholder,
  className
}) {
  const [localValue, setLocalValue] = reactExports.useState(value?.join(", ") || "");
  reactExports.useEffect(() => {
    setLocalValue(value?.join(", ") || "");
  }, [value]);
  const handleBlur = reactExports.useCallback(() => {
    const parsed = localValue.split(",").map((s) => s.trim()).filter(Boolean);
    onChange(parsed);
  }, [localValue, onChange]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Input,
    {
      value: localValue,
      onChange: (e) => setLocalValue(e.target.value),
      onBlur: handleBlur,
      placeholder,
      className
    }
  );
}
const getCellValue = (cell) => {
  return typeof cell === "string" ? cell : cell.value;
};
const getCellRole = (cell) => {
  return typeof cell === "string" ? "data" : cell.role || "data";
};
const getCellColSpan = (cell) => {
  return typeof cell === "string" ? 1 : cell.colSpan || 1;
};
const getCellRowSpan = (cell) => {
  return typeof cell === "string" ? 1 : cell.rowSpan || 1;
};
const isCellHidden = (cell) => {
  return typeof cell === "string" ? false : cell.hidden || false;
};
function migrateLegacySubPartContent(question) {
  const migrated = { ...question };
  migrated.subQuestions = migrated.subQuestions.map((subQ, subQIdx) => {
    if (!subQ.subParts || subQ.subParts.length === 0) return subQ;
    return {
      ...subQ,
      subParts: subQ.subParts.map((part, partIdx) => {
        if (part.contentBlocks && part.contentBlocks.length > 0) return part;
        const hasLegacy = part.questionText || part.imageUrl || part.codeSnippet || part.preCodeText;
        if (!hasLegacy) return part;
        const newBlocks = [];
        const idPrefix = `cb-${subQIdx}-${partIdx}-${Date.now()}`;
        if (part.questionText) {
          newBlocks.push({
            id: `${idPrefix}-txt`,
            type: "text",
            content: part.questionText
          });
        }
        if (part.imageUrl) {
          newBlocks.push({
            id: `${idPrefix}-img`,
            type: "image",
            content: part.imageUrl,
            caption: part.imageCaption || "",
            imageSize: "medium"
          });
        }
        if (part.preCodeText) {
          newBlocks.push({
            id: `${idPrefix}-pre`,
            type: "text",
            content: part.preCodeText
          });
        }
        if (part.codeSnippet) {
          newBlocks.push({
            id: `${idPrefix}-code`,
            type: "code",
            content: part.codeSnippet
          });
        }
        return {
          ...part,
          contentBlocks: newBlocks
        };
      })
    };
  });
  return migrated;
}
function QuestionEditor() {
  const [, params] = useRoute("/teacher/question/:id");
  const [, setLocation] = useLocation();
  const { getQuestion, addQuestion, updateQuestion } = useQuestions();
  const { toast } = useToast();
  const isNew = params?.id === "new";
  const hasLoadedRef = reactExports.useRef(false);
  const [formData, setFormData] = reactExports.useState({
    id: "",
    year: (/* @__PURE__ */ new Date()).getFullYear(),
    topic: "sdcs",
    title: "Question X",
    isPractice: false,
    scenario: { text: "" },
    subQuestions: []
  });
  const [showPreview, setShowPreview] = reactExports.useState(false);
  const [additionalPapers, setAdditionalPapers] = reactExports.useState([]);
  reactExports.useEffect(() => {
    const token = localStorage.getItem("teacherToken");
    if (token) {
      fetch("/api/teacher/additional-papers", {
        headers: { "Authorization": `Bearer ${token}` }
      }).then((res) => res.ok ? res.json() : []).then((data) => setAdditionalPapers(data)).catch(() => {
      });
    }
  }, []);
  reactExports.useEffect(() => {
    if (!isNew || hasLoadedRef.current) return;
    const urlParams = new URLSearchParams(window.location.search);
    const paperId = urlParams.get("paperId");
    if (paperId) {
      setFormData((prev) => ({
        ...prev,
        additionalPaperId: paperId,
        isAdditionalExam: true,
        year: 0,
        isPractice: false
      }));
    }
  }, [isNew]);
  const [dataTableModalOpen, setDataTableModalOpen] = reactExports.useState(false);
  const [editingDataTable, setEditingDataTable] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (hasLoadedRef.current) return;
    if (!isNew && params?.id) {
      fetch(`/api/n5/questions/${params.id}`).then((res) => res.ok ? res.json() : null).then((data) => {
        if (data && !hasLoadedRef.current) {
          const migrated = migrateLegacySubPartContent(data);
          setFormData(migrated);
          hasLoadedRef.current = true;
        }
      }).catch(() => {
        const existing = getQuestion(params.id);
        if (existing && !hasLoadedRef.current) {
          const copied = JSON.parse(JSON.stringify(existing));
          const migrated = migrateLegacySubPartContent(copied);
          setFormData(migrated);
          hasLoadedRef.current = true;
        }
      });
    } else if (isNew) {
      setFormData((prev) => ({ ...prev, id: `q-${Date.now()}` }));
      hasLoadedRef.current = true;
    }
  }, [isNew, params?.id, getQuestion]);
  const handleSave = async (exitAfterSave = false) => {
    if (!formData.title || !formData.year && !formData.isPractice && !formData.isAdditionalExam) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in the title and year."
      });
      return;
    }
    if (isNew) {
      const success = await addQuestion(formData);
      if (success) {
        toast({ title: "Question Created", description: "New question added successfully." });
        if (exitAfterSave) {
          setLocation("/teacher/dashboard");
        } else {
          setLocation(`/teacher/question/${formData.id}`);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: "Failed to create question. Please try again."
        });
      }
    } else {
      const success = await updateQuestion(formData);
      if (success) {
        toast({ title: "Question Saved", description: "Changes saved successfully." });
        if (exitAfterSave) {
          setLocation("/teacher/dashboard");
        }
      } else {
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: "Failed to save changes. Please try again."
        });
      }
    }
  };
  const addSubQuestion = () => {
    const newSub = {
      id: `${formData.id}-sub-${Date.now()}`,
      label: `(${String.fromCharCode(97 + formData.subQuestions.length)})`,
      // a, b, c...
      questionText: "",
      maxMarks: 1,
      markingScheme: [],
      keywords: [],
      aiGuidance: "",
      inputStyle: "text"
    };
    setFormData((prev) => ({
      ...prev,
      subQuestions: [...prev.subQuestions, newSub]
    }));
  };
  const removeSubQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      subQuestions: prev.subQuestions.filter((_, i) => i !== index)
    }));
  };
  const addSubPart = (subIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const existingParts = subQ.subParts || [];
    const romanNumerals = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
    const newPart = {
      id: `${subQ.id}-part-${Date.now()}`,
      label: `(${romanNumerals[existingParts.length] || existingParts.length + 1})`,
      questionText: "",
      maxMarks: 1,
      markingScheme: [],
      keywords: [],
      aiGuidance: "",
      inputStyle: "text"
    };
    updateSubQuestion(subIndex, "subParts", [...existingParts, newPart]);
  };
  const removeSubPart = (subIndex, partIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const updatedParts = (subQ.subParts || []).filter((_, i) => i !== partIndex);
    updateSubQuestion(subIndex, "subParts", updatedParts.length > 0 ? updatedParts : void 0);
  };
  const updateSubPart = (subIndex, partIndex, field, value) => {
    const subQ = formData.subQuestions[subIndex];
    const updatedParts = [...subQ.subParts || []];
    updatedParts[partIndex] = { ...updatedParts[partIndex], [field]: value };
    updateSubQuestion(subIndex, "subParts", updatedParts);
  };
  const insertSubPartAfter = (subIndex, partIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const existingParts = subQ.subParts || [];
    const newPart = {
      id: `${subQ.id}-part-${Date.now()}`,
      label: "",
      questionText: "",
      maxMarks: 1,
      markingScheme: [],
      keywords: [],
      aiGuidance: "",
      inputStyle: "text"
    };
    const updatedParts = [...existingParts];
    updatedParts.splice(partIndex + 1, 0, newPart);
    updateSubQuestion(subIndex, "subParts", updatedParts);
  };
  const initSubPartGridTable = (subIndex, partIndex, numCols = 3, numRows = 3) => {
    const headers = Array.from({ length: numCols }, (_, i) => `Column ${i + 1}`);
    const rows = Array.from({ length: numRows }, (_, rowIdx) => ({
      cells: Array.from({ length: numCols }, (_2, colIdx) => ({
        value: "",
        isInput: false,
        key: `cell_${rowIdx}_${colIdx}`
      }))
    }));
    updateSubPart(subIndex, partIndex, "inputConfig", { grid: { headers, rows } });
  };
  const updateSubPartGridHeader = (subIndex, partIndex, colIndex, value) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const grid = part?.inputConfig?.grid;
    if (!grid) return;
    const newHeaders = [...grid.headers];
    newHeaders[colIndex] = value;
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part.inputConfig, grid: { ...grid, headers: newHeaders } });
  };
  const updateSubPartGridCell = (subIndex, partIndex, rowIndex, cellIndex, field, value) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const grid = part?.inputConfig?.grid;
    if (!grid) return;
    const newRows = grid.rows.map((row, rIdx) => {
      if (rIdx !== rowIndex) return row;
      return {
        cells: row.cells.map((cell, cIdx) => {
          if (cIdx !== cellIndex) return cell;
          return { ...cell, [field]: value };
        })
      };
    });
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part.inputConfig, grid: { ...grid, rows: newRows } });
  };
  const addSubPartGridColumn = (subIndex, partIndex) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const grid = part?.inputConfig?.grid;
    if (!grid) return;
    const newColIndex = grid.headers.length;
    const newHeaders = [...grid.headers, `Column ${newColIndex + 1}`];
    const newRows = grid.rows.map((row, rowIdx) => ({
      cells: [...row.cells, { value: "", isInput: false, key: `cell_${rowIdx}_${newColIndex}` }]
    }));
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part.inputConfig, grid: { headers: newHeaders, rows: newRows } });
  };
  const removeSubPartGridColumn = (subIndex, partIndex, colIndex) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const grid = part?.inputConfig?.grid;
    if (!grid || grid.headers.length <= 1) return;
    const newHeaders = grid.headers.filter((_, i) => i !== colIndex);
    const newRows = grid.rows.map((row) => ({
      cells: row.cells.filter((_, i) => i !== colIndex)
    }));
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part.inputConfig, grid: { headers: newHeaders, rows: newRows } });
  };
  const addSubPartGridRow = (subIndex, partIndex) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const grid = part?.inputConfig?.grid;
    if (!grid) return;
    const newRowIndex = grid.rows.length;
    const newRow = {
      cells: grid.headers.map((_, colIdx) => ({
        value: "",
        isInput: false,
        key: `cell_${newRowIndex}_${colIdx}`
      }))
    };
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part.inputConfig, grid: { ...grid, rows: [...grid.rows, newRow] } });
  };
  const removeSubPartGridRow = (subIndex, partIndex, rowIndex) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const grid = part?.inputConfig?.grid;
    if (!grid || grid.rows.length <= 1) return;
    const newRows = grid.rows.filter((_, i) => i !== rowIndex);
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part.inputConfig, grid: { ...grid, rows: newRows } });
  };
  const initSubPartLabeledInputs = (subIndex, partIndex) => {
    updateSubPart(subIndex, partIndex, "inputConfig", {
      fields: [{ label: "Field 1", key: "field1" }]
    });
  };
  const addSubPartLabeledField = (subIndex, partIndex) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const fields = part?.inputConfig?.fields || [];
    const newField = { label: `Field ${fields.length + 1}`, key: `field${fields.length + 1}` };
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part?.inputConfig, fields: [...fields, newField] });
  };
  const updateSubPartLabeledField = (subIndex, partIndex, fieldIndex, prop, value) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const fields = [...part?.inputConfig?.fields || []];
    fields[fieldIndex] = { ...fields[fieldIndex], [prop]: value };
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part?.inputConfig, fields });
  };
  const removeSubPartLabeledField = (subIndex, partIndex, fieldIndex) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const fields = (part?.inputConfig?.fields || []).filter((_, i) => i !== fieldIndex);
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part?.inputConfig, fields });
  };
  const updateSubQuestion = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.subQuestions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, subQuestions: updated };
    });
  };
  const initTableConfig = (subIndex) => {
    updateSubQuestion(subIndex, "inputConfig", {
      headers: ["Item", "Value"],
      rows: [{ label: "Row 1", value: "", isInput: true, key: "row1" }]
    });
  };
  const addTableRow = (subIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const rows = subQ.inputConfig?.rows || [];
    const newRow = {
      label: `Row ${rows.length + 1}`,
      value: "",
      isInput: true,
      key: `row${rows.length + 1}`
    };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      rows: [...rows, newRow]
    });
  };
  const updateTableRow = (subIndex, rowIndex, field, value) => {
    const subQ = formData.subQuestions[subIndex];
    const rows = [...subQ.inputConfig?.rows || []];
    rows[rowIndex] = { ...rows[rowIndex], [field]: value };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      rows
    });
  };
  const removeTableRow = (subIndex, rowIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const rows = (subQ.inputConfig?.rows || []).filter((_, i) => i !== rowIndex);
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      rows
    });
  };
  const initColumnTableConfig = (subIndex) => {
    updateSubQuestion(subIndex, "inputConfig", {
      columns: [
        { header: "Column 1", key: "col1" },
        { header: "Column 2", key: "col2" }
      ],
      inputRows: 1
    });
  };
  const addTableColumn = (subIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const columns = subQ.inputConfig?.columns || [];
    const newCol = {
      header: `Column ${columns.length + 1}`,
      key: `col${columns.length + 1}`
    };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      columns: [...columns, newCol]
    });
  };
  const updateTableColumn = (subIndex, colIndex, field, value) => {
    const subQ = formData.subQuestions[subIndex];
    const columns = [...subQ.inputConfig?.columns || []];
    columns[colIndex] = { ...columns[colIndex], [field]: value };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      columns
    });
  };
  const removeTableColumn = (subIndex, colIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const columns = (subQ.inputConfig?.columns || []).filter((_, i) => i !== colIndex);
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      columns
    });
  };
  const updateInputRows = (subIndex, numRows) => {
    const subQ = formData.subQuestions[subIndex];
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      inputRows: Math.max(1, numRows)
    });
  };
  const initGridTableConfig = (subIndex, numCols = 3, numRows = 3) => {
    const headers = Array.from({ length: numCols }, (_, i) => `Column ${i + 1}`);
    const rows = Array.from({ length: numRows }, (_, rowIdx) => ({
      cells: Array.from({ length: numCols }, (_2, colIdx) => ({
        value: "",
        isInput: false,
        key: `cell_${rowIdx}_${colIdx}`
      }))
    }));
    updateSubQuestion(subIndex, "inputConfig", { grid: { headers, rows } });
  };
  const updateGridHeader = (subIndex, colIndex, value) => {
    const subQ = formData.subQuestions[subIndex];
    const grid = subQ.inputConfig?.grid;
    if (!grid) return;
    const newHeaders = [...grid.headers];
    newHeaders[colIndex] = value;
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      grid: { ...grid, headers: newHeaders }
    });
  };
  const updateGridCell = (subIndex, rowIndex, cellIndex, field, value) => {
    const subQ = formData.subQuestions[subIndex];
    const grid = subQ.inputConfig?.grid;
    if (!grid) return;
    const newRows = grid.rows.map((row, rIdx) => {
      if (rIdx !== rowIndex) return row;
      return {
        cells: row.cells.map((cell, cIdx) => {
          if (cIdx !== cellIndex) return cell;
          return { ...cell, [field]: value };
        })
      };
    });
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      grid: { ...grid, rows: newRows }
    });
  };
  const addGridColumn = (subIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const grid = subQ.inputConfig?.grid;
    if (!grid) return;
    const newColIndex = grid.headers.length;
    const newHeaders = [...grid.headers, `Column ${newColIndex + 1}`];
    const newRows = grid.rows.map((row, rowIdx) => ({
      cells: [...row.cells, { value: "", isInput: false, key: `cell_${rowIdx}_${newColIndex}` }]
    }));
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      grid: { headers: newHeaders, rows: newRows }
    });
  };
  const removeGridColumn = (subIndex, colIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const grid = subQ.inputConfig?.grid;
    if (!grid || grid.headers.length <= 1) return;
    const newHeaders = grid.headers.filter((_, i) => i !== colIndex);
    const newRows = grid.rows.map((row) => ({
      cells: row.cells.filter((_, i) => i !== colIndex)
    }));
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      grid: { headers: newHeaders, rows: newRows }
    });
  };
  const addGridRow = (subIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const grid = subQ.inputConfig?.grid;
    if (!grid) return;
    const newRowIndex = grid.rows.length;
    const newRow = {
      cells: grid.headers.map((_, colIdx) => ({
        value: "",
        isInput: false,
        key: `cell_${newRowIndex}_${colIdx}`
      }))
    };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      grid: { ...grid, rows: [...grid.rows, newRow] }
    });
  };
  const removeGridRow = (subIndex, rowIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const grid = subQ.inputConfig?.grid;
    if (!grid || grid.rows.length <= 1) return;
    const newRows = grid.rows.filter((_, i) => i !== rowIndex);
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      grid: { ...grid, rows: newRows }
    });
  };
  const initLabeledInputsConfig = (subIndex) => {
    updateSubQuestion(subIndex, "inputConfig", {
      fields: [{ label: "Field 1", key: "field1" }]
    });
  };
  const addLabeledField = (subIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const fields = subQ.inputConfig?.fields || [];
    const newField = { label: `Field ${fields.length + 1}`, key: `field${fields.length + 1}` };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      fields: [...fields, newField]
    });
  };
  const updateLabeledField = (subIndex, fieldIndex, prop, value) => {
    const subQ = formData.subQuestions[subIndex];
    const fields = [...subQ.inputConfig?.fields || []];
    fields[fieldIndex] = { ...fields[fieldIndex], [prop]: value };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      fields
    });
  };
  const removeLabeledField = (subIndex, fieldIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const fields = (subQ.inputConfig?.fields || []).filter((_, i) => i !== fieldIndex);
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      fields
    });
  };
  const updateErdAttribute = (subIndex, attrIndex, prop, value) => {
    const subQ = formData.subQuestions[subIndex];
    const attrs = [...subQ.inputConfig?.erdAttributes || []];
    attrs[attrIndex] = { ...attrs[attrIndex], [prop]: value };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      erdAttributes: attrs
    });
  };
  const removeErdAttribute = (subIndex, attrIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const attrs = (subQ.inputConfig?.erdAttributes || []).filter((_, i) => i !== attrIndex);
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      erdAttributes: attrs
    });
  };
  const updateSubPartErdAttribute = (subIndex, partIndex, attrIndex, prop, value) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...subQ.subParts || []];
    const attrs = [...parts[partIndex].inputConfig?.erdAttributes || []];
    attrs[attrIndex] = { ...attrs[attrIndex], [prop]: value };
    parts[partIndex] = {
      ...parts[partIndex],
      inputConfig: {
        ...parts[partIndex].inputConfig,
        erdAttributes: attrs
      }
    };
    updateSubQuestion(subIndex, "subParts", parts);
  };
  const removeSubPartErdAttribute = (subIndex, partIndex, attrIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...subQ.subParts || []];
    const attrs = (parts[partIndex].inputConfig?.erdAttributes || []).filter((_, i) => i !== attrIndex);
    parts[partIndex] = {
      ...parts[partIndex],
      inputConfig: {
        ...parts[partIndex].inputConfig,
        erdAttributes: attrs
      }
    };
    updateSubQuestion(subIndex, "subParts", parts);
  };
  const addContentBlock = (subIndex, type, insertAtIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...subQ.contentBlocks || []];
    const newBlock = {
      id: `block-${Date.now()}`,
      type,
      content: type === "code" ? "// Enter code here..." : "",
      caption: void 0,
      ...type === "code-table" && {
        codeSections: [{ id: `section-${Date.now()}`, label: "Code Section", code: "// Enter code here..." }]
      },
      ...type === "pseudocode" && {
        pseudocodeLines: [
          { id: `line-${Date.now()}-1`, lineLabel: "Line 1", content: "" },
          { id: `line-${Date.now()}-2`, lineLabel: "Line 2", content: "" },
          { id: `line-${Date.now()}-3`, lineLabel: "Line 3", content: "" }
        ]
      },
      ...type === "data-table" && {
        dataTable: {
          tableName: "TABLE_NAME",
          columns: [
            { id: `col-${Date.now()}-1`, header: "Column1" },
            { id: `col-${Date.now()}-2`, header: "Column2" }
          ],
          rows: [
            { id: `row-${Date.now()}-1`, cells: ["", ""] }
          ]
        }
      },
      ...type === "database-schema" && {
        databaseSchema: {
          tables: []
        }
      }
    };
    if (insertAtIndex !== void 0) {
      blocks.splice(insertAtIndex, 0, newBlock);
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    } else {
      updateSubQuestion(subIndex, "contentBlocks", [...blocks, newBlock]);
    }
  };
  const updateContentBlockDatabaseSchema = (subIndex, blockIndex, schema) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...subQ.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block && block.type === "database-schema") {
      blocks[blockIndex] = { ...block, databaseSchema: schema };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };
  const addSubQuestionCodeSection = (subIndex, blockIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...subQ.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block && block.type === "code-table") {
      const sections = block.codeSections || [];
      blocks[blockIndex] = {
        ...block,
        codeSections: [...sections, { id: `section-${Date.now()}`, label: "Code Section", code: "// Enter code here..." }]
      };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };
  const updateSubQuestionCodeSection = (subIndex, blockIndex, sectionIndex, field, value) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...subQ.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block && block.type === "code-table" && block.codeSections) {
      const sections = [...block.codeSections];
      sections[sectionIndex] = { ...sections[sectionIndex], [field]: value };
      blocks[blockIndex] = { ...block, codeSections: sections };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };
  const removeSubQuestionCodeSection = (subIndex, blockIndex, sectionIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...subQ.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block && block.type === "code-table" && block.codeSections && block.codeSections.length > 1) {
      const sections = block.codeSections.filter((_, i) => i !== sectionIndex);
      blocks[blockIndex] = { ...block, codeSections: sections };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };
  const updateContentBlock = (subIndex, blockIndex, field, value) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...subQ.contentBlocks || []];
    blocks[blockIndex] = { ...blocks[blockIndex], [field]: value };
    updateSubQuestion(subIndex, "contentBlocks", blocks);
  };
  const updatePseudocodeLine = (subIndex, blockIndex, lineIndex, field, value) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...subQ.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block.pseudocodeLines) {
      const newLines = [...block.pseudocodeLines];
      newLines[lineIndex] = { ...newLines[lineIndex], [field]: value };
      blocks[blockIndex] = { ...block, pseudocodeLines: newLines };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };
  const addPseudocodeLine = (subIndex, blockIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...subQ.contentBlocks || []];
    const block = blocks[blockIndex];
    const lines = block.pseudocodeLines || [];
    const nextNum = getNextLineNumber(lines);
    blocks[blockIndex] = {
      ...block,
      pseudocodeLines: [...lines, { id: `line-${Date.now()}`, lineLabel: nextNum, content: "" }]
    };
    updateSubQuestion(subIndex, "contentBlocks", blocks);
  };
  const removePseudocodeLine = (subIndex, blockIndex, lineIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...subQ.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block.pseudocodeLines && block.pseudocodeLines.length > 1) {
      const newLines = block.pseudocodeLines.filter((_, i) => i !== lineIndex);
      blocks[blockIndex] = { ...block, pseudocodeLines: newLines };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };
  const removeContentBlock = (subIndex, blockIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = (subQ.contentBlocks || []).filter((_, i) => i !== blockIndex);
    updateSubQuestion(subIndex, "contentBlocks", blocks.length > 0 ? blocks : void 0);
  };
  const moveContentBlock = (subIndex, blockIndex, direction) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...subQ.contentBlocks || []];
    const newIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    [blocks[blockIndex], blocks[newIndex]] = [blocks[newIndex], blocks[blockIndex]];
    updateSubQuestion(subIndex, "contentBlocks", blocks);
  };
  const groupSubQuestionContentBlocks = (subIndex, startBlockIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...subQ.contentBlocks || []];
    if (startBlockIndex < 0 || startBlockIndex >= blocks.length - 1) return;
    const block1 = blocks[startBlockIndex];
    const block2 = blocks[startBlockIndex + 1];
    if (block1.type === "row-layout" || block2.type === "row-layout") return;
    const rowLayout = {
      id: `row-layout-${Date.now()}`,
      type: "row-layout",
      content: "",
      children: [block1, block2]
    };
    const newBlocks = [
      ...blocks.slice(0, startBlockIndex),
      rowLayout,
      ...blocks.slice(startBlockIndex + 2)
    ];
    updateSubQuestion(subIndex, "contentBlocks", newBlocks);
    toast({ title: "Blocks Grouped", description: "Blocks will now display side-by-side." });
  };
  const ungroupSubQuestionContentBlocks = (subIndex, blockIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...subQ.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block.type !== "row-layout" || !block.children) return;
    const newBlocks = [
      ...blocks.slice(0, blockIndex),
      ...block.children,
      ...blocks.slice(blockIndex + 1)
    ];
    updateSubQuestion(subIndex, "contentBlocks", newBlocks);
    toast({ title: "Blocks Ungrouped", description: "Blocks are now displayed separately." });
  };
  const handleContentBlockImageUpload = async (e, subIndex, blockIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result;
      updateContentBlock(subIndex, blockIndex, "content", base64String);
      toast({ title: "Image Added", description: "Image added successfully." });
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      toast({ variant: "destructive", title: "Upload Failed", description: "Failed to read image file." });
    };
    reader.readAsDataURL(file);
  };
  const addSubPartContentBlock = (subIndex, partIndex, type) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...subQ.subParts || []];
    const part = parts[partIndex];
    const blocks = part.contentBlocks || [];
    const newBlock = {
      id: `part-block-${Date.now()}`,
      type,
      content: type === "code" ? "// Enter code here..." : "",
      caption: void 0,
      ...type === "code-table" && {
        codeSections: [{ id: `section-${Date.now()}`, label: "Code Section", code: "// Enter code here..." }]
      },
      ...type === "pseudocode" && {
        pseudocodeLines: [
          { id: `line-${Date.now()}-1`, lineLabel: "Line 1", content: "" },
          { id: `line-${Date.now()}-2`, lineLabel: "Line 2", content: "" },
          { id: `line-${Date.now()}-3`, lineLabel: "Line 3", content: "" }
        ]
      },
      ...type === "data-table" && {
        dataTable: {
          tableName: "TABLE_NAME",
          columns: [
            { id: `col-${Date.now()}-1`, header: "Column1" },
            { id: `col-${Date.now()}-2`, header: "Column2" }
          ],
          rows: [
            { id: `row-${Date.now()}-1`, cells: ["", ""] }
          ]
        }
      },
      ...type === "database-schema" && {
        databaseSchema: {
          tables: []
        }
      }
    };
    parts[partIndex] = { ...part, contentBlocks: [...blocks, newBlock] };
    updateSubQuestion(subIndex, "subParts", parts);
  };
  const updateSubPartContentBlock = (subIndex, partIndex, blockIndex, field, value) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...subQ.subParts || []];
    const part = parts[partIndex];
    const blocks = [...part.contentBlocks || []];
    blocks[blockIndex] = { ...blocks[blockIndex], [field]: value };
    parts[partIndex] = { ...part, contentBlocks: blocks };
    updateSubQuestion(subIndex, "subParts", parts);
  };
  const removeSubPartContentBlock = (subIndex, partIndex, blockIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...subQ.subParts || []];
    const part = parts[partIndex];
    const blocks = (part.contentBlocks || []).filter((_, i) => i !== blockIndex);
    parts[partIndex] = { ...part, contentBlocks: blocks.length > 0 ? blocks : void 0 };
    updateSubQuestion(subIndex, "subParts", parts);
  };
  const moveSubPartContentBlock = (subIndex, partIndex, blockIndex, direction) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...subQ.subParts || []];
    const part = parts[partIndex];
    const blocks = [...part.contentBlocks || []];
    const newIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    [blocks[blockIndex], blocks[newIndex]] = [blocks[newIndex], blocks[blockIndex]];
    parts[partIndex] = { ...part, contentBlocks: blocks };
    updateSubQuestion(subIndex, "subParts", parts);
  };
  const updateSubPartPseudocodeLine = (subIndex, partIndex, blockIndex, lineIndex, field, value) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...subQ.subParts || []];
    const part = parts[partIndex];
    const blocks = [...part.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block.pseudocodeLines) {
      const newLines = [...block.pseudocodeLines];
      newLines[lineIndex] = { ...newLines[lineIndex], [field]: value };
      blocks[blockIndex] = { ...block, pseudocodeLines: newLines };
      parts[partIndex] = { ...part, contentBlocks: blocks };
      updateSubQuestion(subIndex, "subParts", parts);
    }
  };
  const addSubPartPseudocodeLine = (subIndex, partIndex, blockIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...subQ.subParts || []];
    const part = parts[partIndex];
    const blocks = [...part.contentBlocks || []];
    const block = blocks[blockIndex];
    const lines = block.pseudocodeLines || [];
    const nextNum = getNextLineNumber(lines);
    blocks[blockIndex] = {
      ...block,
      pseudocodeLines: [...lines, { id: `line-${Date.now()}`, lineLabel: nextNum, content: "" }]
    };
    parts[partIndex] = { ...part, contentBlocks: blocks };
    updateSubQuestion(subIndex, "subParts", parts);
  };
  const removeSubPartPseudocodeLine = (subIndex, partIndex, blockIndex, lineIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...subQ.subParts || []];
    const part = parts[partIndex];
    const blocks = [...part.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block.pseudocodeLines && block.pseudocodeLines.length > 1) {
      const newLines = block.pseudocodeLines.filter((_, i) => i !== lineIndex);
      blocks[blockIndex] = { ...block, pseudocodeLines: newLines };
      parts[partIndex] = { ...part, contentBlocks: blocks };
      updateSubQuestion(subIndex, "subParts", parts);
    }
  };
  const handleSubPartContentBlockImageUpload = async (e, subIndex, partIndex, blockIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result;
      updateSubPartContentBlock(subIndex, partIndex, blockIndex, "content", base64String);
      toast({ title: "Image Added", description: "Image added successfully." });
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      toast({ variant: "destructive", title: "Upload Failed", description: "Failed to read image file." });
    };
    reader.readAsDataURL(file);
  };
  const addSubPartCodeSection = (subIndex, partIndex, blockIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...subQ.subParts || []];
    const part = parts[partIndex];
    const blocks = [...part.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block && block.type === "code-table") {
      const sections = block.codeSections || [];
      blocks[blockIndex] = {
        ...block,
        codeSections: [...sections, { id: `section-${Date.now()}`, label: "Code Section", code: "// Enter code here..." }]
      };
      parts[partIndex] = { ...part, contentBlocks: blocks };
      updateSubQuestion(subIndex, "subParts", parts);
    }
  };
  const updateSubPartCodeSection = (subIndex, partIndex, blockIndex, sectionIndex, field, value) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...subQ.subParts || []];
    const part = parts[partIndex];
    const blocks = [...part.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block && block.type === "code-table" && block.codeSections) {
      const sections = [...block.codeSections];
      sections[sectionIndex] = { ...sections[sectionIndex], [field]: value };
      blocks[blockIndex] = { ...block, codeSections: sections };
      parts[partIndex] = { ...part, contentBlocks: blocks };
      updateSubQuestion(subIndex, "subParts", parts);
    }
  };
  const updateSubPartContentBlockDatabaseSchema = (subIndex, partIndex, blockIndex, schema) => {
    const subQ = formData.subQuestions[subIndex];
    if (!subQ) return;
    const parts = [...subQ.subParts || []];
    const part = parts[partIndex];
    if (!part) return;
    const blocks = [...part.contentBlocks || []];
    const block = blocks[blockIndex];
    if (!block || block.type !== "database-schema") return;
    blocks[blockIndex] = { ...block, databaseSchema: schema };
    parts[partIndex] = { ...part, contentBlocks: blocks };
    updateSubQuestion(subIndex, "subParts", parts);
  };
  const removeSubPartCodeSection = (subIndex, partIndex, blockIndex, sectionIndex) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...subQ.subParts || []];
    const part = parts[partIndex];
    const blocks = [...part.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block && block.type === "code-table" && block.codeSections && block.codeSections.length > 1) {
      const sections = block.codeSections.filter((_, i) => i !== sectionIndex);
      blocks[blockIndex] = { ...block, codeSections: sections };
      parts[partIndex] = { ...part, contentBlocks: blocks };
      updateSubQuestion(subIndex, "subParts", parts);
    }
  };
  const handleDrawingBackgroundUpload = async (e, subIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result;
      updateSubQuestion(subIndex, "drawingBackgroundUrl", base64String);
      toast({ title: "Image Uploaded", description: "Drawing background image uploaded successfully." });
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      toast({ variant: "destructive", title: "Upload Failed", description: "Failed to upload image." });
    };
    reader.readAsDataURL(file);
  };
  const handleDrawingBackgroundUploadSubPart = async (e, subIndex, partIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result;
      updateSubPart(subIndex, partIndex, "drawingBackgroundUrl", base64String);
      toast({ title: "Image Uploaded", description: "Drawing background image uploaded successfully." });
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      toast({ variant: "destructive", title: "Upload Failed", description: "Failed to upload image." });
    };
    reader.readAsDataURL(file);
  };
  const addScenarioContentBlock = (type, insertAtIndex) => {
    const blocks = formData.scenario?.contentBlocks || [];
    const newBlock = {
      id: `scenario-block-${Date.now()}`,
      type,
      content: type === "code" ? "// Enter code here..." : "",
      caption: void 0,
      codeSections: type === "code-table" ? [{ id: `section-${Date.now()}`, label: "Code", code: "// Enter code here..." }] : void 0,
      pseudocodeLines: type === "pseudocode" ? [
        { id: `line-${Date.now()}-1`, lineLabel: "Line 1", content: "" },
        { id: `line-${Date.now()}-2`, lineLabel: "Line 2", content: "" },
        { id: `line-${Date.now()}-3`, lineLabel: "Line 3", content: "" }
      ] : void 0,
      dataTable: type === "data-table" ? {
        tableName: "TABLE_NAME",
        columns: [
          { id: `col-${Date.now()}-1`, header: "Column1" },
          { id: `col-${Date.now()}-2`, header: "Column2" }
        ],
        rows: [
          { id: `row-${Date.now()}-1`, cells: ["", ""] }
        ]
      } : void 0,
      databaseSchema: type === "database-schema" ? { tables: [] } : void 0
    };
    let newBlocks;
    if (insertAtIndex !== void 0 && insertAtIndex >= 0 && insertAtIndex <= blocks.length) {
      newBlocks = [...blocks.slice(0, insertAtIndex), newBlock, ...blocks.slice(insertAtIndex)];
    } else {
      newBlocks = [...blocks, newBlock];
    }
    setFormData((prev) => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: newBlocks }
    }));
  };
  const updateScenarioDatabaseSchema = (blockIndex, schema) => {
    const blocks = [...formData.scenario?.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block && block.type === "database-schema") {
      blocks[blockIndex] = { ...block, databaseSchema: schema };
      setFormData((prev) => ({
        ...prev,
        scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
      }));
    }
  };
  const addScenarioCodeSection = (blockIndex) => {
    const blocks = [...formData.scenario?.contentBlocks || []];
    const block = blocks[blockIndex];
    const sections = block.codeSections || [];
    blocks[blockIndex] = {
      ...block,
      codeSections: [...sections, { id: `section-${Date.now()}`, label: "Code", code: "// Enter code here..." }]
    };
    setFormData((prev) => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
    }));
  };
  const updateScenarioCodeSection = (blockIndex, sectionIndex, field, value) => {
    const blocks = [...formData.scenario?.contentBlocks || []];
    const block = blocks[blockIndex];
    const sections = [...block.codeSections || []];
    sections[sectionIndex] = { ...sections[sectionIndex], [field]: value };
    blocks[blockIndex] = { ...block, codeSections: sections };
    setFormData((prev) => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
    }));
  };
  const removeScenarioCodeSection = (blockIndex, sectionIndex) => {
    const blocks = [...formData.scenario?.contentBlocks || []];
    const block = blocks[blockIndex];
    const sections = (block.codeSections || []).filter((_, i) => i !== sectionIndex);
    blocks[blockIndex] = { ...block, codeSections: sections };
    setFormData((prev) => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
    }));
  };
  const updateScenarioContentBlock = (blockIndex, field, value) => {
    const blocks = [...formData.scenario?.contentBlocks || []];
    blocks[blockIndex] = { ...blocks[blockIndex], [field]: value };
    setFormData((prev) => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
    }));
  };
  const updateScenarioPseudocodeLine = (blockIndex, lineIndex, field, value) => {
    const blocks = [...formData.scenario?.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block.pseudocodeLines) {
      const newLines = [...block.pseudocodeLines];
      newLines[lineIndex] = { ...newLines[lineIndex], [field]: value };
      blocks[blockIndex] = { ...block, pseudocodeLines: newLines };
      setFormData((prev) => ({
        ...prev,
        scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
      }));
    }
  };
  const getNextLineNumber = (lines) => {
    if (lines.length === 0) return "Line 1";
    const lastLabel = lines[lines.length - 1].lineLabel;
    const match = lastLabel.match(/(\d+)/);
    if (match) {
      return `Line ${parseInt(match[1], 10) + 1}`;
    }
    return `Line ${lines.length + 1}`;
  };
  const addScenarioPseudocodeLine = (blockIndex) => {
    const blocks = [...formData.scenario?.contentBlocks || []];
    const block = blocks[blockIndex];
    const lines = block.pseudocodeLines || [];
    const nextNum = getNextLineNumber(lines);
    blocks[blockIndex] = {
      ...block,
      pseudocodeLines: [...lines, { id: `line-${Date.now()}`, lineLabel: nextNum, content: "" }]
    };
    setFormData((prev) => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
    }));
  };
  const removeScenarioPseudocodeLine = (blockIndex, lineIndex) => {
    const blocks = [...formData.scenario?.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block.pseudocodeLines && block.pseudocodeLines.length > 1) {
      const newLines = block.pseudocodeLines.filter((_, i) => i !== lineIndex);
      blocks[blockIndex] = { ...block, pseudocodeLines: newLines };
      setFormData((prev) => ({
        ...prev,
        scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
      }));
    }
  };
  const removeScenarioContentBlock = (blockIndex) => {
    const blocks = (formData.scenario?.contentBlocks || []).filter((_, i) => i !== blockIndex);
    setFormData((prev) => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks.length > 0 ? blocks : void 0 }
    }));
  };
  const moveScenarioContentBlock = (blockIndex, direction) => {
    const blocks = [...formData.scenario?.contentBlocks || []];
    const newIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    [blocks[blockIndex], blocks[newIndex]] = [blocks[newIndex], blocks[blockIndex]];
    setFormData((prev) => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
    }));
  };
  const groupScenarioContentBlocks = (startIndex) => {
    const blocks = [...formData.scenario?.contentBlocks || []];
    if (startIndex < 0 || startIndex >= blocks.length - 1) return;
    const block1 = blocks[startIndex];
    const block2 = blocks[startIndex + 1];
    if (block1.type === "row-layout" || block2.type === "row-layout") return;
    const rowLayout = {
      id: `row-layout-${Date.now()}`,
      type: "row-layout",
      content: "",
      children: [block1, block2]
    };
    const newBlocks = [
      ...blocks.slice(0, startIndex),
      rowLayout,
      ...blocks.slice(startIndex + 2)
    ];
    setFormData((prev) => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: newBlocks }
    }));
    toast({ title: "Blocks Grouped", description: "Blocks will now display side-by-side." });
  };
  const ungroupScenarioContentBlocks = (blockIndex) => {
    const blocks = [...formData.scenario?.contentBlocks || []];
    const block = blocks[blockIndex];
    if (block.type !== "row-layout" || !block.children) return;
    const newBlocks = [
      ...blocks.slice(0, blockIndex),
      ...block.children,
      ...blocks.slice(blockIndex + 1)
    ];
    setFormData((prev) => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: newBlocks }
    }));
    toast({ title: "Blocks Ungrouped", description: "Blocks are now displayed separately." });
  };
  const handleScenarioContentBlockImageUpload = (e, blockIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      updateScenarioContentBlock(blockIndex, "content", base64String);
      toast({
        title: "Image Uploaded",
        description: "Image converted to base64 and attached."
      });
    };
    reader.readAsDataURL(file);
  };
  const handleImagePaste = (e, callback) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64String = event.target?.result;
            callback(base64String);
            toast({ title: "Image Pasted", description: "Image added from clipboard." });
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };
  const handleContentBlockImagePaste = (e, subIndex, blockIndex) => {
    handleImagePaste(e, (base64) => updateContentBlock(subIndex, blockIndex, "content", base64));
  };
  const handleSubPartContentBlockImagePaste = (e, subIndex, partIndex, blockIndex) => {
    handleImagePaste(e, (base64) => updateSubPartContentBlock(subIndex, partIndex, blockIndex, "content", base64));
  };
  const handleScenarioContentBlockImagePaste = (e, blockIndex) => {
    handleImagePaste(e, (base64) => updateScenarioContentBlock(blockIndex, "content", base64));
  };
  const handleImageDrop = (e, callback) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result;
        callback(base64String);
        toast({ title: "Image Added", description: "Image dropped successfully." });
      };
      reader.readAsDataURL(file);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleContentBlockImageDrop = (e, subIndex, blockIndex) => {
    handleImageDrop(e, (base64) => updateContentBlock(subIndex, blockIndex, "content", base64));
  };
  const handleSubPartContentBlockImageDrop = (e, subIndex, partIndex, blockIndex) => {
    handleImageDrop(e, (base64) => updateSubPartContentBlock(subIndex, partIndex, blockIndex, "content", base64));
  };
  const handleScenarioContentBlockImageDrop = (e, blockIndex) => {
    handleImageDrop(e, (base64) => updateScenarioContentBlock(blockIndex, "content", base64));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-[200]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto max-w-4xl flex justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", onClick: () => setLocation("/teacher/dashboard"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
          " Back"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-neutral-900 dark:text-white", children: isNew ? "Add New Question" : "Edit Question" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => setShowPreview(true), "data-testid": "button-preview", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "mr-2 h-4 w-4" }),
          " Preview"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => handleSave(false), "data-testid": "button-save", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
          " Save"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleSave(true), className: "bg-red-600 hover:bg-red-700", "data-testid": "button-save-exit", children: "Save & Exit" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "container mx-auto max-w-4xl p-6 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "General Information" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                id: "isPractice",
                checked: formData.isPractice || false,
                onChange: (e) => setFormData((prev) => ({ ...prev, isPractice: e.target.checked, isAdditionalExam: e.target.checked ? false : prev.isAdditionalExam, additionalPaperId: e.target.checked ? null : prev.additionalPaperId })),
                className: "w-4 h-4 text-red-600 border-neutral-300 rounded focus:ring-red-500"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "isPractice", className: "cursor-pointer", children: "This is a practice question (not from a past paper)" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Additional Paper" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.additionalPaperId || "none",
                onValueChange: (val) => {
                  if (val === "none") {
                    setFormData((prev) => ({
                      ...prev,
                      additionalPaperId: null,
                      isAdditionalExam: false,
                      year: prev.year === 0 ? (/* @__PURE__ */ new Date()).getFullYear() : prev.year
                    }));
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      additionalPaperId: val,
                      isAdditionalExam: true,
                      isPractice: false,
                      year: 0
                    }));
                  }
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { "data-testid": "select-additional-paper", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select additional paper" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "None (not an additional paper)" }),
                    additionalPapers.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: p.id, children: [
                      p.name,
                      p.isPublished ? "" : " (Draft)"
                    ] }, p.id))
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { children: [
                "Year ",
                (formData.isPractice || formData.isAdditionalExam) && "(Optional)"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: formData.year,
                  onChange: (e) => setFormData((prev) => ({ ...prev, year: parseInt(e.target.value) || (/* @__PURE__ */ new Date()).getFullYear() })),
                  disabled: formData.isPractice || formData.isAdditionalExam,
                  className: formData.isPractice || formData.isAdditionalExam ? "bg-neutral-100 dark:bg-neutral-800" : ""
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Topic" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: formData.topic,
                  onValueChange: (val) => setFormData((prev) => ({ ...prev, topic: val })),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select Topic" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: TOPICS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t.id, children: t.name }, t.id)) })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 md:col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Question Title (e.g. Question 1 or Practice: Arrays)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: formData.title,
                  onChange: (e) => setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
              )
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Scenario" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: formData.scenario?.contentBlocks && formData.scenario.contentBlocks.length > 0 ? formData.scenario.contentBlocks.map((block, blockIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-5 px-2 text-xs text-neutral-400 hover:text-neutral-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 mr-1" }),
                " Insert here"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => addScenarioContentBlock("text", blockIndex), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "h-4 w-4 mr-2" }),
                  " Text"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => addScenarioContentBlock("image", blockIndex), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-4 w-4 mr-2" }),
                  " Image"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => addScenarioContentBlock("code", blockIndex), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-4 w-4 mr-2" }),
                  " Code"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => addScenarioContentBlock("pseudocode", blockIndex), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4 mr-2" }),
                  " Pseudocode"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => addScenarioContentBlock("code-table", blockIndex), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-4 w-4 mr-2" }),
                  " Code Table"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => addScenarioContentBlock("data-table", blockIndex), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-4 w-4 mr-2" }),
                  " Data Table"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => addScenarioContentBlock("database-schema", blockIndex), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "h-4 w-4 mr-2" }),
                  " DB Schema"
                ] })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  block.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "h-4 w-4 text-neutral-500" }),
                  block.type === "image" && /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-4 w-4 text-neutral-500" }),
                  block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-4 w-4 text-neutral-500" }),
                  block.type === "pseudocode" && /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4 text-neutral-500" }),
                  (block.type === "code-table" || block.type === "data-table") && /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-4 w-4 text-neutral-500" }),
                  block.type === "database-schema" && /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "h-4 w-4 text-neutral-500" }),
                  block.type === "row-layout" && /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "h-4 w-4 text-blue-500" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium capitalize", children: block.type === "code-table" ? "Code Table" : block.type === "data-table" ? "Data Table" : block.type === "database-schema" ? "DB Schema" : block.type === "row-layout" ? "Side-by-Side Layout" : block.type })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "sm",
                      className: "h-6 w-6 p-0",
                      onClick: () => moveScenarioContentBlock(blockIndex, "up"),
                      disabled: blockIndex === 0,
                      type: "button",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(MoveUp, { className: "h-3 w-3" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "sm",
                      className: "h-6 w-6 p-0",
                      onClick: () => moveScenarioContentBlock(blockIndex, "down"),
                      disabled: blockIndex === (formData.scenario?.contentBlocks?.length || 0) - 1,
                      type: "button",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(MoveDown, { className: "h-3 w-3" })
                    }
                  ),
                  block.type !== "row-layout" && blockIndex < (formData.scenario?.contentBlocks?.length || 0) - 1 && formData.scenario?.contentBlocks?.[blockIndex + 1]?.type !== "row-layout" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "sm",
                      className: "h-6 w-6 p-0 text-blue-500 hover:text-blue-600",
                      onClick: () => groupScenarioContentBlocks(blockIndex),
                      type: "button",
                      title: "Group with next block (side-by-side)",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "h-3 w-3" })
                    }
                  ),
                  block.type === "row-layout" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "sm",
                      className: "h-6 w-6 p-0 text-orange-500 hover:text-orange-600",
                      onClick: () => ungroupScenarioContentBlocks(blockIndex),
                      type: "button",
                      title: "Ungroup blocks",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ungroup, { className: "h-3 w-3" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "sm",
                      className: "h-6 w-6 p-0 text-red-500 hover:text-red-600",
                      onClick: () => removeScenarioContentBlock(blockIndex),
                      type: "button",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
                    }
                  )
                ] })
              ] }),
              block.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 mb-1 items-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        variant: block.textAlign === "left" || !block.textAlign ? "secondary" : "ghost",
                        size: "sm",
                        className: "h-7 w-7 p-0",
                        onClick: () => updateScenarioContentBlock(blockIndex, "textAlign", "left"),
                        type: "button",
                        title: "Align Left",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignStart, { className: "h-3 w-3" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        variant: block.textAlign === "center" ? "secondary" : "ghost",
                        size: "sm",
                        className: "h-7 w-7 p-0",
                        onClick: () => updateScenarioContentBlock(blockIndex, "textAlign", "center"),
                        type: "button",
                        title: "Align Center",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignCenter, { className: "h-3 w-3" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        variant: block.textAlign === "right" ? "secondary" : "ghost",
                        size: "sm",
                        className: "h-7 w-7 p-0",
                        onClick: () => updateScenarioContentBlock(blockIndex, "textAlign", "right"),
                        type: "button",
                        title: "Align Right",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignEnd, { className: "h-3 w-3" })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-px bg-neutral-300 dark:bg-neutral-600" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "checkbox",
                        id: `border-${block.id}`,
                        checked: block.hasBorder || false,
                        onChange: (e) => updateScenarioContentBlock(blockIndex, "hasBorder", e.target.checked),
                        className: "h-4 w-4 rounded border-neutral-300"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `border-${block.id}`, className: "text-xs cursor-pointer", children: "Border" })
                  ] }),
                  block.hasBorder && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      value: block.borderWidth || "md",
                      onValueChange: (val) => updateScenarioContentBlock(blockIndex, "borderWidth", val),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-7 w-24 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Width" }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "xs", children: "Extra Small" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "sm", children: "Small" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "md", children: "Medium" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "lg", children: "Large" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "xl", children: "Extra Large" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "full", children: "Full Width" })
                        ] })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  RichTextEditor,
                  {
                    value: block.content,
                    onChange: (val) => updateScenarioContentBlock(blockIndex, "content", val),
                    placeholder: "Enter text content...",
                    rows: 3
                  }
                )
              ] }),
              block.type === "image" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "space-y-2",
                  onPaste: (e) => handleScenarioContentBlockImagePaste(e, blockIndex),
                  onDrop: (e) => handleScenarioContentBlockImageDrop(e, blockIndex),
                  onDragOver: handleDragOver,
                  children: [
                    !block.content && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-4 text-center text-sm text-neutral-500 dark:text-neutral-400 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors",
                        tabIndex: 0,
                        onPaste: (e) => handleScenarioContentBlockImagePaste(e, blockIndex),
                        onDrop: (e) => handleScenarioContentBlockImageDrop(e, blockIndex),
                        onDragOver: handleDragOver,
                        children: "Drop image here, paste (Ctrl+V), or use upload button"
                      }
                    ),
                    block.content && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-md p-2 w-fit bg-white dark:bg-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: block.content, alt: "Preview", className: "max-h-32 object-contain" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          placeholder: "Paste image URL...",
                          value: block.content,
                          onChange: (e) => updateScenarioContentBlock(blockIndex, "content", e.target.value),
                          onPaste: (e) => handleScenarioContentBlockImagePaste(e, blockIndex),
                          className: "flex-1 h-8 text-sm"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "file",
                            accept: "image/*",
                            className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
                            onChange: (e) => handleScenarioContentBlockImageUpload(e, blockIndex)
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", type: "button", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3 w-3" }) })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          placeholder: "Caption (optional)",
                          value: block.caption || "",
                          onChange: (e) => updateScenarioContentBlock(blockIndex, "caption", e.target.value),
                          className: "flex-1 h-8 text-sm"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Select,
                        {
                          value: block.imageSize || "medium",
                          onValueChange: (val) => updateScenarioContentBlock(blockIndex, "imageSize", val),
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-28 h-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Size" }) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "xs", children: "Extra Small" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "small", children: "Small" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "medium", children: "Medium" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "large", children: "Large" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "xl", children: "Extra Large" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "2xl", children: "2X Large" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "full", children: "Full Width" })
                            ] })
                          ]
                        }
                      )
                    ] })
                  ]
                }
              ),
              block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  className: "font-mono text-sm bg-neutral-900 text-neutral-100 border-neutral-700",
                  value: block.content,
                  onChange: (e) => updateScenarioContentBlock(blockIndex, "content", e.target.value),
                  onKeyDown: (e) => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const target = e.target;
                      const start = target.selectionStart;
                      const end = target.selectionEnd;
                      const value = target.value;
                      const newValue = value.substring(0, start) + "    " + value.substring(end);
                      updateScenarioContentBlock(blockIndex, "content", newValue);
                      setTimeout(() => {
                        target.selectionStart = target.selectionEnd = start + 4;
                      }, 0);
                    }
                  },
                  rows: 4
                }
              ),
              block.type === "pseudocode" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "w-full font-mono text-sm border-collapse", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocodeLines?.map((line, lineIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "group", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-2 w-24 align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: line.lineLabel,
                      onChange: (e) => updateScenarioPseudocodeLine(blockIndex, lineIndex, "lineLabel", e.target.value),
                      className: "h-7 text-sm font-mono bg-transparent border-transparent hover:border-neutral-300 focus:border-neutral-400 dark:hover:border-neutral-600 dark:focus:border-neutral-500 w-full text-center"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: line.content,
                      onChange: (e) => updateScenarioPseudocodeLine(blockIndex, lineIndex, "content", e.target.value),
                      onKeyDown: (e) => {
                        if (e.key === "Tab") {
                          e.preventDefault();
                          const input = e.target;
                          const start = input.selectionStart || 0;
                          const end = input.selectionEnd || 0;
                          const newValue = line.content.substring(0, start) + "    " + line.content.substring(end);
                          updateScenarioPseudocodeLine(blockIndex, lineIndex, "content", newValue);
                          setTimeout(() => {
                            input.setSelectionRange(start + 4, start + 4);
                          }, 0);
                        }
                      },
                      placeholder: "Enter pseudocode...",
                      className: "h-7 text-sm font-mono bg-transparent border-transparent hover:border-neutral-300 focus:border-neutral-400 dark:hover:border-neutral-600 dark:focus:border-neutral-500"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pl-1 w-8 align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "sm",
                      className: "h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600",
                      onClick: () => removeScenarioPseudocodeLine(blockIndex, lineIndex),
                      disabled: (block.pseudocodeLines?.length || 0) <= 1,
                      type: "button",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
                    }
                  ) })
                ] }, line.id)) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    onClick: () => addScenarioPseudocodeLine(blockIndex),
                    type: "button",
                    className: "w-full",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 mr-1" }),
                      " Add Line"
                    ]
                  }
                )
              ] }),
              block.type === "code-table" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                block.codeSections?.map((section, sectionIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg overflow-hidden", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        value: section.label,
                        onChange: (e) => updateScenarioCodeSection(blockIndex, sectionIndex, "label", e.target.value),
                        className: "flex-1 h-7 text-sm font-medium",
                        placeholder: "Section label (e.g., JavaScript Code)"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        variant: "ghost",
                        size: "sm",
                        className: "h-7 w-7 p-0 text-red-500 hover:text-red-700",
                        onClick: () => removeScenarioCodeSection(blockIndex, sectionIndex),
                        disabled: (block.codeSections?.length || 0) <= 1,
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Textarea,
                    {
                      className: "font-mono text-sm bg-neutral-900 text-neutral-100 border-0 rounded-none",
                      value: section.code,
                      onChange: (e) => updateScenarioCodeSection(blockIndex, sectionIndex, "code", e.target.value),
                      onKeyDown: (e) => {
                        if (e.key === "Tab") {
                          e.preventDefault();
                          const target = e.target;
                          const start = target.selectionStart;
                          const end = target.selectionEnd;
                          const value = target.value;
                          const newValue = value.substring(0, start) + "    " + value.substring(end);
                          updateScenarioCodeSection(blockIndex, sectionIndex, "code", newValue);
                          setTimeout(() => {
                            target.selectionStart = target.selectionEnd = start + 4;
                          }, 0);
                        }
                      },
                      rows: 3,
                      placeholder: "Enter code here..."
                    }
                  )
                ] }, section.id)),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    onClick: () => addScenarioCodeSection(blockIndex),
                    type: "button",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 mr-1" }),
                      " Add Section"
                    ]
                  }
                )
              ] }),
              block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveDataTable, { dataTable: block.dataTable }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    onClick: () => {
                      setEditingDataTable({ type: "scenario", blockIndex });
                      setDataTableModalOpen(true);
                    },
                    type: "button",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-3 w-3 mr-1" }),
                      " Edit Table"
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-center text-neutral-500", children: [
                  block.dataTable.columns.length,
                  " columns, ",
                  block.dataTable.rows.length,
                  " rows"
                ] })
              ] }),
              block.type === "database-schema" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DatabaseSchemaEditor,
                  {
                    value: block.databaseSchema,
                    onChange: (schema) => updateScenarioDatabaseSchema(blockIndex, schema)
                  }
                ),
                block.databaseSchema && block.databaseSchema.tables.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mb-2", children: "Preview:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-white dark:bg-neutral-800 rounded border", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema: block.databaseSchema }) })
                ] })
              ] }),
              block.type === "row-layout" && block.children && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "These blocks will display side-by-side on larger screens:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(RowLayout, { children: block.children.map((childBlock, childIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx(RowLayoutItem, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 bg-white dark:bg-neutral-800 rounded border text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 mb-1 text-xs text-neutral-500", children: [
                    childBlock.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "h-3 w-3" }),
                    childBlock.type === "image" && /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-3 w-3" }),
                    childBlock.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-3 w-3" }),
                    (childBlock.type === "data-table" || childBlock.type === "code-table") && /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-3 w-3" }),
                    childBlock.type === "database-schema" && /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "h-3 w-3" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "capitalize", children: childBlock.type === "data-table" ? "Data Table" : childBlock.type === "code-table" ? "Code Table" : childBlock.type })
                  ] }),
                  childBlock.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "prose prose-sm max-w-none", dangerouslySetInnerHTML: { __html: childBlock.content } }),
                  childBlock.type === "image" && childBlock.content && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: childBlock.content, alt: childBlock.caption || "", className: "max-h-32 object-contain" }),
                  childBlock.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-xs bg-neutral-900 text-neutral-100 p-2 rounded overflow-x-auto", children: childBlock.content }),
                  childBlock.type === "code-table" && childBlock.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: childBlock.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-2 py-1 font-semibold text-xs border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-900 text-neutral-100 p-2 text-xs font-mono overflow-x-auto", children: section.code })
                  ] }, section.id || sIdx)) }),
                  childBlock.type === "data-table" && childBlock.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveDataTable, { dataTable: childBlock.dataTable }),
                  childBlock.type === "database-schema" && childBlock.databaseSchema && /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema: childBlock.databaseSchema })
                ] }) }, childBlock.id)) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-center text-neutral-400", children: "Click the ungroup button above to edit individual blocks" })
              ] })
            ] })
          ] }, block.id)) : (
            /* Legacy fallback for old format questions */
            (formData.scenario?.text || formData.scenario?.imageUrl || formData.scenario?.codeSnippet) && !formData.scenario?.contentBlocks ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-amber-700 dark:text-amber-300 mb-2", children: "This scenario uses the legacy format. Add content blocks below to upgrade." }),
              formData.scenario?.text && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-amber-600", children: "Legacy Text:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: formData.scenario.text })
              ] }),
              formData.scenario?.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-amber-600", children: "Legacy Image:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: formData.scenario.imageUrl, alt: "Legacy", className: "max-h-24 mt-1" })
              ] }),
              formData.scenario?.codeSnippet && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-amber-600", children: "Legacy Code:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-xs bg-neutral-800 text-neutral-100 p-2 rounded mt-1 overflow-x-auto", children: formData.scenario.codeSnippet })
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 italic", children: "No content blocks yet. Add text, images, or code below." })
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 pt-2 border-t", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => addScenarioContentBlock("text"),
                type: "button",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "h-3 w-3 mr-1" }),
                  " Add Text"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => addScenarioContentBlock("image"),
                type: "button",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-3 w-3 mr-1" }),
                  " Add Image"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => addScenarioContentBlock("code"),
                type: "button",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-3 w-3 mr-1" }),
                  " Add Code"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => addScenarioContentBlock("pseudocode"),
                type: "button",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-3 w-3 mr-1" }),
                  " Add Pseudocode"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => addScenarioContentBlock("code-table"),
                type: "button",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-3 w-3 mr-1" }),
                  " Add Code Table"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => addScenarioContentBlock("data-table"),
                type: "button",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-3 w-3 mr-1" }),
                  " Add Data Table"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => addScenarioContentBlock("database-schema"),
                type: "button",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "h-3 w-3 mr-1" }),
                  " Add DB Schema"
                ]
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: "Questions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: addSubQuestion, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
            " Add Question"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Accordion, { type: "multiple", className: "space-y-2", children: formData.subQuestions.map((subQ, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(AccordionItem, { value: `question-${index}`, className: "border rounded-lg bg-white dark:bg-neutral-900", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionTrigger, { className: "px-4 py-3 hover:no-underline", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-left flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-lg", children: subQ.label || `(${String.fromCharCode(97 + index)})` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-500 truncate max-w-[400px] text-sm", children: (() => {
              const textContent = subQ.contentBlocks?.find((b) => b.type === "text")?.content || subQ.questionText || "";
              return textContent ? textContent.substring(0, 80) + (textContent.length > 80 ? "..." : "") : "(No question text)";
            })() }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-400 ml-auto mr-4", children: [
              "(",
              subQ.maxMarks === 0 && subQ.subParts && subQ.subParts.length > 0 ? subQ.subParts.reduce((sum, part) => sum + (part.maxMarks || 0), 0) : subQ.maxMarks,
              " marks)"
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AccordionContent, { className: "px-4 pb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "ghost",
                size: "sm",
                className: "text-red-500 hover:text-red-600 hover:bg-red-50",
                onClick: () => removeSubQuestion(index),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 mr-1" }),
                  " Remove Question"
                ]
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 col-span-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Label (e.g. a)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: subQ.label || "",
                      onChange: (e) => updateSubQuestion(index, "label", e.target.value)
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 col-span-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Marks" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "number",
                      value: subQ.maxMarks,
                      onChange: (e) => updateSubQuestion(index, "maxMarks", parseInt(e.target.value) || 0)
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 col-span-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Input Style" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      value: subQ.inputStyle || "text",
                      onValueChange: (val) => {
                        updateSubQuestion(index, "inputStyle", val);
                        if (val === "info-only") {
                          updateSubQuestion(index, "maxMarks", 0);
                        }
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "info-only", children: "Info Only (No Input)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "text", children: "Text Area" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "code-editor", children: "Code Editor" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "design-choice", children: "Design Choice (Pseudocode/Diagram)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "drawing", children: "Diagram/Drawing" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "table", children: "Table" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "labeled-inputs", children: "Labeled Inputs" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "fill-in-blanks", children: "Fill in the Blanks" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "erd-annotation", children: "ERD Annotation (Keys)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "nav-structure", children: "Navigation Structure" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "nav-structure-higher", children: "Navigation Structure (Advanced)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "tag-matching", children: "Tag Matching (Connect to Image)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "structure-dataflow", children: "Structure Diagram (Dataflow)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "form-wireframe", children: "Form Wireframe (Web Form Design)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "webpage-wireframe", children: "Webpage Wireframe (Web Page Layout)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "html-upload", children: "HTML File Upload (Web Dev)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "structure-diagram", children: "Structure Diagram (Design Notation)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "entity-occurrence-diagram", children: "Entity-Occurrence Diagram (Database)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "database-schema", children: "Database Schema Diagram" })
                        ] })
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Collapsible, { defaultOpen: subQ.inputStyle !== "text" && subQ.inputStyle !== "info-only", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "w-full justify-between text-xs", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-3 w-3" }),
                    "Input Style Configuration"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3 w-3" })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CollapsibleContent, { className: "pt-3 space-y-4", children: [
                  (subQ.inputStyle === "drawing" || subQ.inputStyle === "erd-annotation" || subQ.inputStyle === "nav-structure" || subQ.inputStyle === "nav-structure-higher" || subQ.inputStyle === "tag-matching" || subQ.inputStyle === "structure-dataflow" || subQ.inputStyle === "form-wireframe" || subQ.inputStyle === "webpage-wireframe" || subQ.inputStyle === "structure-diagram" || subQ.inputStyle === "entity-occurrence-diagram") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium", children: "Drawing Background Image (Optional)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          placeholder: "URL for image students will annotate...",
                          value: subQ.drawingBackgroundUrl || "",
                          onChange: (e) => updateSubQuestion(index, "drawingBackgroundUrl", e.target.value || void 0),
                          className: "flex-1"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "cursor-pointer", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "file",
                            accept: "image/*",
                            className: "hidden",
                            onChange: (e) => handleDrawingBackgroundUpload(e, index)
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-10 px-3 inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 text-sm font-medium hover:bg-neutral-900/90 dark:hover:bg-neutral-100/90", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
                          "Upload"
                        ] })
                      ] })
                    ] }),
                    subQ.drawingBackgroundUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: subQ.drawingBackgroundUrl,
                          alt: "Drawing background preview",
                          className: "h-16 rounded border"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          size: "sm",
                          variant: "ghost",
                          className: "text-red-500",
                          onClick: () => updateSubQuestion(index, "drawingBackgroundUrl", void 0),
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "If set, this image will be the background for the drawing canvas. Any other images in the question will be shown separately for reference." })
                  ] }),
                  subQ.inputStyle === "form-wireframe" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center flex-wrap gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Expected Form Elements (for AI grading)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          size: "sm",
                          variant: "outline",
                          onClick: () => {
                            const current = subQ.inputConfig?.formWireframeExpectations || [];
                            updateSubQuestion(index, "inputConfig", {
                              ...subQ.inputConfig || {},
                              formWireframeExpectations: [...current, { fieldType: "text-input", labelText: "" }]
                            });
                          },
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                            " Add Expected Element"
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Specify what form elements students should include. The AI will check for these when grading." }),
                    subQ.inputConfig?.formWireframeExpectations?.map((expectation, expIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-start flex-wrap p-2 bg-white dark:bg-neutral-900 rounded border", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-[120px]", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Type" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Select,
                          {
                            value: expectation.fieldType,
                            onValueChange: (val) => {
                              const updated = [...subQ.inputConfig?.formWireframeExpectations || []];
                              updated[expIdx] = { ...updated[expIdx], fieldType: val };
                              updateSubQuestion(index, "inputConfig", {
                                ...subQ.inputConfig || {},
                                formWireframeExpectations: updated
                              });
                            },
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "text-input", children: "Text Input" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "textarea", children: "Textarea" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "dropdown", children: "Dropdown" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "radio-group", children: "Radio Group" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "checkbox", children: "Checkbox" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "submit-button", children: "Submit Button" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "label", children: "Label Only" })
                              ] })
                            ]
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-[2] min-w-[150px]", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Label Text (fuzzy match)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            value: expectation.labelText || "",
                            onChange: (e) => {
                              const updated = [...subQ.inputConfig?.formWireframeExpectations || []];
                              updated[expIdx] = { ...updated[expIdx], labelText: e.target.value };
                              updateSubQuestion(index, "inputConfig", {
                                ...subQ.inputConfig || {},
                                formWireframeExpectations: updated
                              });
                            },
                            placeholder: "e.g., Name, Email, Phone...",
                            className: "h-8 text-xs"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-1 text-xs cursor-pointer mt-4", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "checkbox",
                              checked: expectation.required || false,
                              onChange: (e) => {
                                const updated = [...subQ.inputConfig?.formWireframeExpectations || []];
                                updated[expIdx] = { ...updated[expIdx], required: e.target.checked };
                                updateSubQuestion(index, "inputConfig", {
                                  ...subQ.inputConfig || {},
                                  formWireframeExpectations: updated
                                });
                              },
                              className: "w-3 h-3"
                            }
                          ),
                          "Required*"
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            size: "sm",
                            variant: "ghost",
                            className: "h-8 w-8 p-0 text-red-500",
                            onClick: () => {
                              const updated = (subQ.inputConfig?.formWireframeExpectations || []).filter((_, i) => i !== expIdx);
                              updateSubQuestion(index, "inputConfig", {
                                ...subQ.inputConfig || {},
                                formWireframeExpectations: updated.length > 0 ? updated : void 0
                              });
                            },
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" })
                          }
                        )
                      ] }),
                      (expectation.fieldType === "dropdown" || expectation.fieldType === "radio-group") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Options (comma-separated)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          OptionsInput,
                          {
                            value: expectation.options,
                            onChange: (options) => {
                              const updated = [...subQ.inputConfig?.formWireframeExpectations || []];
                              updated[expIdx] = {
                                ...updated[expIdx],
                                options
                              };
                              updateSubQuestion(index, "inputConfig", {
                                ...subQ.inputConfig || {},
                                formWireframeExpectations: updated
                              });
                            },
                            placeholder: "Option 1, Option 2, Option 3...",
                            className: "h-8 text-xs"
                          }
                        )
                      ] }),
                      (expectation.fieldType === "text-input" || expectation.fieldType === "textarea") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Expected Validation" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            value: expectation.validationMessage || "",
                            onChange: (e) => {
                              const updated = [...subQ.inputConfig?.formWireframeExpectations || []];
                              updated[expIdx] = {
                                ...updated[expIdx],
                                validationMessage: e.target.value || void 0
                              };
                              updateSubQuestion(index, "inputConfig", {
                                ...subQ.inputConfig || {},
                                formWireframeExpectations: updated
                              });
                            },
                            placeholder: "e.g., 1-14 or must be positive",
                            className: "h-8 text-xs"
                          }
                        )
                      ] })
                    ] }, expIdx)),
                    (!subQ.inputConfig?.formWireframeExpectations || subQ.inputConfig.formWireframeExpectations.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-400 italic", children: "No expectations set. Add expected form elements to help the AI grade student responses." })
                  ] }),
                  subQ.inputStyle === "table" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center flex-wrap gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Table Configuration" }),
                      !subQ.inputConfig?.rows && !subQ.inputConfig?.columns && !subQ.inputConfig?.grid && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => initGridTableConfig(index), children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                          " Flexible Grid (Recommended)"
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => initTableConfig(index), children: "Row-Based" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => initColumnTableConfig(index), children: "Column-Based" })
                      ] })
                    ] }),
                    subQ.inputConfig?.grid && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Click cells to toggle between fixed text and input fields" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "border-collapse border border-neutral-300 dark:border-neutral-600 text-sm w-full", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-200 dark:bg-neutral-700 w-8" }),
                          subQ.inputConfig.grid.headers.map((header, colIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-200 dark:bg-neutral-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "input",
                              {
                                type: "text",
                                value: header,
                                onChange: (e) => updateGridHeader(index, colIdx, e.target.value),
                                className: "h-7 text-xs px-2 border rounded w-16"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                size: "sm",
                                variant: "ghost",
                                className: "h-6 w-6 p-0 text-red-500",
                                onClick: () => removeGridColumn(index, colIdx),
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
                              }
                            )
                          ] }) }, colIdx)),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-200 dark:bg-neutral-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => addGridColumn(index), className: "h-6 px-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3" }) }) })
                        ] }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
                          subQ.inputConfig.grid.rows.map((row, rowIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-100 dark:bg-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                size: "sm",
                                variant: "ghost",
                                className: "h-6 w-6 p-0 text-red-500",
                                onClick: () => removeGridRow(index, rowIdx),
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
                              }
                            ) }),
                            row.cells.map((cell, cellIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "td",
                              {
                                className: `border border-neutral-300 dark:border-neutral-600 p-1 ${cell.isInput ? "bg-blue-50 dark:bg-blue-900/30" : ""}`,
                                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                                      "input",
                                      {
                                        type: "text",
                                        value: cell.value || "",
                                        onChange: (e) => updateGridCell(index, rowIdx, cellIdx, "value", e.target.value),
                                        placeholder: cell.isInput ? "" : "",
                                        className: `h-7 text-xs px-1 border rounded flex-1 min-w-[60px] ${cell.isInput ? "border-blue-400" : ""}`
                                      }
                                    ),
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-0.5 text-xs whitespace-nowrap cursor-pointer shrink-0", title: "Check to make this an input field", children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                                        "input",
                                        {
                                          type: "checkbox",
                                          checked: cell.isInput || false,
                                          onChange: (e) => updateGridCell(index, rowIdx, cellIdx, "isInput", e.target.checked),
                                          className: "w-3 h-3"
                                        }
                                      ),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px]", children: "Input" })
                                    ] })
                                  ] }),
                                  cell.isInput && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 flex-wrap", children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                                      Input,
                                      {
                                        value: cell.placeholder || "",
                                        onChange: (e) => updateGridCell(index, rowIdx, cellIdx, "placeholder", e.target.value),
                                        placeholder: "Placeholder",
                                        className: "h-6 text-xs flex-1 min-w-[80px]"
                                      }
                                    ),
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                      Select,
                                      {
                                        value: cell.width || "auto",
                                        onValueChange: (val) => updateGridCell(index, rowIdx, cellIdx, "width", val),
                                        children: [
                                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-20 h-6 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "W" }) }),
                                          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "auto", children: "Auto" }),
                                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "50px", children: "S" }),
                                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "100px", children: "M" }),
                                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "150px", children: "L" }),
                                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "200px", children: "XL" })
                                          ] })
                                        ]
                                      }
                                    ),
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-0.5 text-xs whitespace-nowrap cursor-pointer shrink-0", title: "Use multi-line textarea", children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                                        "input",
                                        {
                                          type: "checkbox",
                                          checked: cell.multiline || false,
                                          onChange: (e) => updateGridCell(index, rowIdx, cellIdx, "multiline", e.target.checked),
                                          className: "w-3 h-3"
                                        }
                                      ),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px]", children: "Multi" })
                                    ] })
                                  ] })
                                ] })
                              },
                              cellIdx
                            )),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-neutral-300 dark:border-neutral-600 p-1" })
                          ] }, rowIdx)),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-100 dark:bg-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => addGridRow(index), className: "h-6 px-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3" }) }) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: subQ.inputConfig.grid.headers.length + 1, className: "border border-neutral-300 dark:border-neutral-600 p-1 text-xs text-neutral-400", children: "Add row" })
                          ] })
                        ] })
                      ] }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          size: "sm",
                          variant: "ghost",
                          className: "text-neutral-500 text-xs",
                          onClick: () => updateSubQuestion(index, "inputConfig", void 0),
                          children: "Clear table configuration"
                        }
                      )
                    ] }),
                    subQ.inputConfig?.columns && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Column-based table: inputs appear below each column header" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Number of Input Rows" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            type: "number",
                            min: "1",
                            value: subQ.inputConfig.inputRows || 1,
                            onChange: (e) => updateInputRows(index, parseInt(e.target.value) || 1),
                            className: "w-24"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Columns" }),
                        subQ.inputConfig.columns.map((col, colIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 border rounded-lg space-y-2 bg-white dark:bg-neutral-800", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                placeholder: "Header",
                                value: col.header,
                                onChange: (e) => updateTableColumn(index, colIndex, "header", e.target.value),
                                className: "flex-1"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                placeholder: "Key (for grading)",
                                value: col.key,
                                onChange: (e) => updateTableColumn(index, colIndex, "key", e.target.value),
                                className: "flex-1"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                size: "sm",
                                variant: "ghost",
                                className: "text-red-500 px-2",
                                onClick: () => removeTableColumn(index, colIndex),
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center pl-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                placeholder: "Placeholder text (e.g. A, B, C)",
                                value: col.placeholder || "",
                                onChange: (e) => updateTableColumn(index, colIndex, "placeholder", e.target.value),
                                className: "flex-1 h-8 text-sm"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Select,
                              {
                                value: col.width || "auto",
                                onValueChange: (val) => updateTableColumn(index, colIndex, "width", val),
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-28 h-8 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Width" }) }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "auto", children: "Auto" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "50px", children: "Small" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "100px", children: "Medium" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "150px", children: "Large" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "200px", children: "X-Large" })
                                  ] })
                                ]
                              }
                            )
                          ] })
                        ] }, colIndex)),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => addTableColumn(index), children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                          " Add Column"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          size: "sm",
                          variant: "ghost",
                          className: "text-neutral-500 text-xs",
                          onClick: () => updateSubQuestion(index, "inputConfig", void 0),
                          children: "Switch to Row-Based Table"
                        }
                      )
                    ] }),
                    subQ.inputConfig?.rows && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Row-based table: label in first column, value/input in second column" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Column Headers (comma separated)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            value: subQ.inputConfig.headers?.join(", ") || "",
                            onChange: (e) => updateSubQuestion(index, "inputConfig", {
                              ...subQ.inputConfig,
                              headers: e.target.value.split(",").map((s) => s.trim())
                            }),
                            placeholder: "e.g. Variable, Sample Data, Type"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Rows" }),
                        subQ.inputConfig.rows.map((row, rowIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 border rounded-lg space-y-2 bg-white dark:bg-neutral-800", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                placeholder: "Label",
                                value: row.label,
                                onChange: (e) => updateTableRow(index, rowIndex, "label", e.target.value),
                                className: "flex-1"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                placeholder: "Fixed value (optional)",
                                value: row.value || "",
                                onChange: (e) => updateTableRow(index, rowIndex, "value", e.target.value),
                                className: "flex-1"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-1 text-xs whitespace-nowrap", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "input",
                                {
                                  type: "checkbox",
                                  checked: row.isInput,
                                  onChange: (e) => updateTableRow(index, rowIndex, "isInput", e.target.checked)
                                }
                              ),
                              "Input?"
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                size: "sm",
                                variant: "ghost",
                                className: "text-red-500 px-2",
                                onClick: () => removeTableRow(index, rowIndex),
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
                              }
                            )
                          ] }),
                          row.isInput && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center pl-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                placeholder: "Placeholder text (e.g. A, B, C)",
                                value: row.placeholder || "",
                                onChange: (e) => updateTableRow(index, rowIndex, "placeholder", e.target.value),
                                className: "flex-1 h-8 text-sm"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-1 text-xs whitespace-nowrap", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "input",
                                {
                                  type: "checkbox",
                                  checked: row.multiline || false,
                                  onChange: (e) => updateTableRow(index, rowIndex, "multiline", e.target.checked)
                                }
                              ),
                              "Multi-line"
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Select,
                              {
                                value: row.width || "auto",
                                onValueChange: (val) => updateTableRow(index, rowIndex, "width", val),
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-28 h-8 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Width" }) }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "auto", children: "Auto" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "50px", children: "Small" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "100px", children: "Medium" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "150px", children: "Large" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "200px", children: "X-Large" })
                                  ] })
                                ]
                              }
                            )
                          ] })
                        ] }, rowIndex)),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => addTableRow(index), children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                          " Add Row"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          size: "sm",
                          variant: "ghost",
                          className: "text-neutral-500 text-xs",
                          onClick: () => updateSubQuestion(index, "inputConfig", void 0),
                          children: "Switch to Column-Based Table"
                        }
                      )
                    ] })
                  ] }),
                  subQ.inputStyle === "code-editor" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border max-w-xl", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Starter Code (Optional)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Provide code that students will see pre-filled in the editor. They can then complete or modify it." }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Textarea,
                      {
                        value: subQ.inputConfig?.starterCode || "",
                        onChange: (e) => {
                          const newConfig = { ...subQ.inputConfig, starterCode: e.target.value };
                          updateSubQuestion(index, "inputConfig", newConfig);
                        },
                        placeholder: "# Enter starter code here that students will complete...",
                        className: "font-mono text-sm min-h-[150px] bg-neutral-900 text-neutral-100"
                      }
                    )
                  ] }),
                  subQ.inputStyle === "labeled-inputs" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border max-w-xl", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Labeled Inputs Configuration" }),
                      !subQ.inputConfig?.fields && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => initLabeledInputsConfig(index), children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                        " Initialize Fields"
                      ] })
                    ] }),
                    subQ.inputConfig?.fields && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                      subQ.inputConfig.fields.map((field, fieldIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            placeholder: "Label",
                            value: field.label,
                            onChange: (e) => updateLabeledField(index, fieldIndex, "label", e.target.value),
                            className: "flex-1"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            placeholder: "Key (for grading)",
                            value: field.key,
                            onChange: (e) => updateLabeledField(index, fieldIndex, "key", e.target.value),
                            className: "flex-1"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            size: "sm",
                            variant: "ghost",
                            className: "text-red-500 px-2",
                            onClick: () => removeLabeledField(index, fieldIndex),
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
                          }
                        )
                      ] }, fieldIndex)),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => addLabeledField(index), children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                        " Add Field"
                      ] })
                    ] })
                  ] }),
                  subQ.inputStyle === "fill-in-blanks" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border max-w-xl", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Fill in the Blanks Configuration" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-neutral-500", children: [
                      "Use ",
                      "{{blank_1}}",
                      ", ",
                      "{{blank_2}}",
                      ", etc. as placeholders in your code template."
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Code Template" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Textarea,
                        {
                          value: subQ.inputConfig?.codeTemplate || "",
                          onChange: (e) => {
                            const newConfig = { ...subQ.inputConfig, codeTemplate: e.target.value };
                            updateSubQuestion(index, "inputConfig", newConfig);
                          },
                          placeholder: "Enter code with {{blank_1}}, {{blank_2}} placeholders...",
                          className: "font-mono text-sm min-h-[150px]"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Blanks (Answers)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Button,
                          {
                            size: "sm",
                            variant: "outline",
                            onClick: () => {
                              const blanks = subQ.inputConfig?.blanks || [];
                              const newBlank = { key: `blank_${blanks.length + 1}`, answer: "", hint: "" };
                              updateSubQuestion(index, "inputConfig", { ...subQ.inputConfig, blanks: [...blanks, newBlank] });
                            },
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 mr-1" }),
                              " Add Blank"
                            ]
                          }
                        )
                      ] }),
                      (subQ.inputConfig?.blanks || []).map((blank, blankIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center bg-white dark:bg-neutral-800 p-2 rounded border", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono text-neutral-500 w-16", children: `{{${blank.key}}}` }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            value: blank.answer,
                            onChange: (e) => {
                              const blanks = [...subQ.inputConfig?.blanks || []];
                              blanks[blankIdx] = { ...blanks[blankIdx], answer: e.target.value };
                              updateSubQuestion(index, "inputConfig", { ...subQ.inputConfig, blanks });
                            },
                            placeholder: "Correct answer",
                            className: "flex-1 h-8"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            value: blank.hint || "",
                            onChange: (e) => {
                              const blanks = [...subQ.inputConfig?.blanks || []];
                              blanks[blankIdx] = { ...blanks[blankIdx], hint: e.target.value };
                              updateSubQuestion(index, "inputConfig", { ...subQ.inputConfig, blanks });
                            },
                            placeholder: "Hint (optional)",
                            className: "w-24 h-8"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            type: "number",
                            value: blank.width || 80,
                            onChange: (e) => {
                              const blanks = [...subQ.inputConfig?.blanks || []];
                              blanks[blankIdx] = { ...blanks[blankIdx], width: parseInt(e.target.value) || 80 };
                              updateSubQuestion(index, "inputConfig", { ...subQ.inputConfig, blanks });
                            },
                            placeholder: "Width (px)",
                            className: "w-20 h-8",
                            min: 40,
                            max: 300
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            size: "sm",
                            variant: "ghost",
                            onClick: () => {
                              const blanks = (subQ.inputConfig?.blanks || []).filter((_, i) => i !== blankIdx);
                              updateSubQuestion(index, "inputConfig", { ...subQ.inputConfig, blanks });
                            },
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3 text-red-500" })
                          }
                        )
                      ] }, blankIdx))
                    ] })
                  ] }),
                  subQ.inputStyle === "erd-annotation" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "1. Draw the ERD Diagram (Student Starting Point)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Draw your ERD using ellipses for attributes. Students will see this diagram and mark attributes as Primary Key (underline) or Foreign Key (star)." })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      DiagramEditor,
                      {
                        initialData: subQ.inputConfig?.baseErdDiagram || "",
                        onChange: (data) => {
                          updateSubQuestion(index, "inputConfig", {
                            ...subQ.inputConfig,
                            baseErdDiagram: data
                          });
                        },
                        mode: "database",
                        allowBaseItemDeletion: true
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "2. Draw the Correct Answer (for AI Grading)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1 mb-3", children: "Draw the same ERD with the correct Primary Key (underline) and Foreign Key (star) markings applied. The AI will use this as a reference when grading student answers." }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        DiagramEditor,
                        {
                          initialData: subQ.inputConfig?.correctErdDiagram || "",
                          onChange: (data) => {
                            updateSubQuestion(index, "inputConfig", {
                              ...subQ.inputConfig,
                              correctErdDiagram: data
                            });
                          },
                          mode: "erd-annotation",
                          baseDiagram: subQ.inputConfig?.baseErdDiagram || "",
                          allowBaseItemDeletion: true
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Mark Correct Answers" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => {
                          try {
                            const items = JSON.parse(subQ.inputConfig?.baseErdDiagram || "[]");
                            const ellipses = items.filter((i) => i.type === "ellipse" && i.content);
                            const newAttrs = ellipses.map((e) => ({
                              id: e.id,
                              entityName: "",
                              attributeName: e.content || "",
                              correctMarking: "none"
                            }));
                            updateSubQuestion(index, "inputConfig", {
                              ...subQ.inputConfig,
                              erdAttributes: newAttrs
                            });
                          } catch (e) {
                            console.error("Failed to parse diagram", e);
                          }
                        }, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                          " Detect Attributes from Diagram"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mb-3", children: "Specify which attributes should be marked as Primary Key or Foreign Key." }),
                      subQ.inputConfig?.erdAttributes && subQ.inputConfig.erdAttributes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-12 gap-2 text-xs font-medium text-neutral-500 px-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-5", children: "Attribute (from diagram)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-6", children: "Correct Marking" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-1" })
                        ] }),
                        subQ.inputConfig.erdAttributes.map((attr, attrIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-12 gap-2 items-center", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-5 text-sm px-2 py-1 bg-white dark:bg-neutral-800 rounded border", children: attr.attributeName || "(empty)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Select,
                            {
                              value: attr.correctMarking,
                              onValueChange: (val) => updateErdAttribute(index, attrIndex, "correctMarking", val),
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "col-span-6 h-8 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "None (no marking needed)" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "primary", children: "Primary Key (student should underline)" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "foreign", children: "Foreign Key (student should add star)" })
                                ] })
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Button,
                            {
                              size: "sm",
                              variant: "ghost",
                              className: "col-span-1 text-red-500 px-2 h-8",
                              onClick: () => removeErdAttribute(index, attrIndex),
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
                            }
                          )
                        ] }, attrIndex))
                      ] })
                    ] })
                  ] }),
                  subQ.inputStyle === "nav-structure" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Starting Diagram (Optional)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Draw a starting navigation structure that students will complete. Leave empty if students should create from scratch." })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      DiagramEditor,
                      {
                        initialData: subQ.inputConfig?.baseNavDiagram || "",
                        onChange: (data) => {
                          updateSubQuestion(index, "inputConfig", {
                            ...subQ.inputConfig,
                            baseNavDiagram: data
                          });
                        },
                        mode: "nav-structure"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-4 space-y-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold text-green-700 dark:text-green-400", children: "Example Answer (For AI Grading)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Draw the expected answer. The AI will use this to grade student submissions more accurately." })
                        ] }),
                        subQ.inputConfig?.navExampleData && /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            size: "sm",
                            variant: "outline",
                            className: "text-red-500 hover:text-red-600 shrink-0",
                            onClick: () => {
                              updateSubQuestion(index, "inputConfig", {
                                ...subQ.inputConfig,
                                navExampleData: void 0,
                                navExampleCanvas: void 0
                              });
                            },
                            "data-testid": `button-clear-nav-example-${index}`,
                            children: "Clear"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        DiagramEditor,
                        {
                          initialData: subQ.inputConfig?.navExampleData || "",
                          initialDrawing: subQ.inputConfig?.navExampleCanvas || "",
                          onChange: (dataStr, drawingStr) => {
                            updateSubQuestion(index, "inputConfig", {
                              ...subQ.inputConfig,
                              navExampleData: dataStr,
                              navExampleCanvas: drawingStr
                            });
                          },
                          mode: "nav-structure"
                        }
                      )
                    ] })
                  ] }),
                  subQ.inputStyle === "nav-structure-higher" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Starting Diagram (Optional)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Create a starting diagram that students will complete. Leave empty if students should create from scratch." })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        DiagramEditor,
                        {
                          initialData: subQ.inputConfig?.baseNavDiagram || "",
                          onChange: (data) => {
                            updateSubQuestion(index, "inputConfig", {
                              ...subQ.inputConfig,
                              baseNavDiagram: data
                            });
                          },
                          mode: "nav-structure-higher"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-4 space-y-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold text-green-700 dark:text-green-400", children: "Solution Diagram (For AI Grading)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Draw the expected solution. This will be shown to the AI to help grade student answers more accurately." })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        DiagramEditor,
                        {
                          initialData: subQ.inputConfig?.solutionNavDiagram || "",
                          onChange: (data) => {
                            updateSubQuestion(index, "inputConfig", {
                              ...subQ.inputConfig,
                              solutionNavDiagram: data
                            });
                          },
                          mode: "nav-structure-higher"
                        }
                      )
                    ] })
                  ] }),
                  subQ.inputStyle === "tag-matching" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Tag Matching Setup" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Add source tags on the left, then draw target zones on the image where each tag should connect. Upload a background image first." })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      TagMatchingEditor,
                      {
                        mode: "edit",
                        backgroundUrl: subQ.drawingBackgroundUrl,
                        sourceTags: subQ.inputConfig?.tagMatchingConfig?.sourceTags || [],
                        targetZones: subQ.inputConfig?.tagMatchingConfig?.targetZones || [],
                        onChange: (tags, zones) => {
                          updateSubQuestion(index, "inputConfig", {
                            ...subQ.inputConfig,
                            tagMatchingConfig: { sourceTags: tags, targetZones: zones }
                          });
                        }
                      }
                    )
                  ] }),
                  subQ.inputStyle === "structure-dataflow" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Base Structure Diagram" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Draw the structure diagram with function boxes, dataflow arrows (up = data IN, down = data OUT), and variable labels. Students will see this as the starting point." })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      DiagramEditor,
                      {
                        initialData: subQ.inputConfig?.baseStructureDiagram || "",
                        onChange: (data) => {
                          updateSubQuestion(index, "inputConfig", {
                            ...subQ.inputConfig,
                            baseStructureDiagram: data
                          });
                        },
                        mode: "structure-dataflow",
                        showFunctionNumbers: true
                      }
                    )
                  ] }),
                  subQ.inputStyle === "structure-diagram" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Starting Diagram (Optional)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Create a starting structure diagram with process (rectangles), decision (diamonds), and loop (ellipses) shapes that students will complete. Leave empty if students should create from scratch." })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        DiagramEditor,
                        {
                          initialData: subQ.inputConfig?.baseStructureDiagram || "",
                          onChange: (data) => {
                            updateSubQuestion(index, "inputConfig", {
                              ...subQ.inputConfig,
                              baseStructureDiagram: data
                            });
                          },
                          mode: "structure-diagram"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-4 space-y-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold text-green-700 dark:text-green-400", children: "Solution Diagram (For AI Grading)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Draw the expected solution diagram. This will be shown to the AI to help grade student answers more accurately." })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        DiagramEditor,
                        {
                          initialData: subQ.inputConfig?.solutionStructureDiagram || "",
                          onChange: (data) => {
                            updateSubQuestion(index, "inputConfig", {
                              ...subQ.inputConfig,
                              solutionStructureDiagram: data
                            });
                          },
                          mode: "structure-diagram"
                        }
                      )
                    ] })
                  ] }),
                  subQ.inputStyle === "entity-occurrence-diagram" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Starting Diagram (Optional)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Create a starting entity-occurrence diagram with entities (tall ovals) and occurrences inside them. Students will complete the diagram by adding connections between occurrences." })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        DiagramEditor,
                        {
                          initialData: subQ.inputConfig?.baseEntityOccurrenceDiagram || "",
                          onChange: (data) => {
                            updateSubQuestion(index, "inputConfig", {
                              ...subQ.inputConfig,
                              baseEntityOccurrenceDiagram: data
                            });
                          },
                          mode: "entity-occurrence"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-4 space-y-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold text-green-700 dark:text-green-400", children: "Solution Diagram (For AI Grading)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Draw the expected solution diagram with the correct connections between entity occurrences. This will be shown to the AI to help grade student answers." })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        DiagramEditor,
                        {
                          initialData: subQ.inputConfig?.solutionEntityOccurrenceDiagram || "",
                          onChange: (data) => {
                            updateSubQuestion(index, "inputConfig", {
                              ...subQ.inputConfig,
                              solutionEntityOccurrenceDiagram: data
                            });
                          },
                          mode: "entity-occurrence"
                        }
                      )
                    ] })
                  ] }),
                  subQ.inputStyle === "database-schema" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Database Schema Tables" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Create database tables with fields. Mark primary keys (underlined) and foreign keys (*) to show relationships between tables." })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      DatabaseSchemaEditor,
                      {
                        value: subQ.inputConfig?.databaseSchema,
                        onChange: (schema) => {
                          updateSubQuestion(index, "inputConfig", {
                            ...subQ.inputConfig,
                            databaseSchema: schema
                          });
                        }
                      }
                    ),
                    subQ.inputConfig?.databaseSchema && subQ.inputConfig.databaseSchema.tables.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold text-green-700 dark:text-green-400", children: "Preview" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 p-3 bg-white dark:bg-neutral-800 rounded border", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema: subQ.inputConfig.databaseSchema }) })
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-neutral-500 uppercase tracking-wider", children: "Question Content" }),
                subQ.contentBlocks && subQ.contentBlocks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: subQ.contentBlocks.map((block, blockIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-1 opacity-0 hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-5 px-2 text-xs text-neutral-400 hover:text-neutral-600", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 mr-1" }),
                      " Insert here"
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => addContentBlock(index, "text", blockIndex), children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "h-4 w-4 mr-2" }),
                        " Text"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => addContentBlock(index, "image", blockIndex), children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-4 w-4 mr-2" }),
                        " Image"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => addContentBlock(index, "code", blockIndex), children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-4 w-4 mr-2" }),
                        " Code"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => addContentBlock(index, "code-table", blockIndex), children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-4 w-4 mr-2" }),
                        " Code Table"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => addContentBlock(index, "data-table", blockIndex), children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-4 w-4 mr-2" }),
                        " Data Table"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => addContentBlock(index, "database-schema", blockIndex), children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "h-4 w-4 mr-2" }),
                        " DB Schema"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => addContentBlock(index, "pseudocode", blockIndex), children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4 mr-2" }),
                        " Pseudocode"
                      ] })
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                        block.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "h-4 w-4 text-neutral-500" }),
                        block.type === "image" && /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-4 w-4 text-neutral-500" }),
                        block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-4 w-4 text-neutral-500" }),
                        (block.type === "code-table" || block.type === "data-table") && /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-4 w-4 text-neutral-500" }),
                        block.type === "database-schema" && /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "h-4 w-4 text-neutral-500" }),
                        block.type === "row-layout" && /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "h-4 w-4 text-blue-500" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium capitalize", children: block.type === "code-table" ? "Code Table" : block.type === "data-table" ? "Data Table" : block.type === "database-schema" ? "DB Schema" : block.type === "row-layout" ? "Side-by-Side Layout" : block.type })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            variant: "ghost",
                            size: "sm",
                            className: "h-6 px-2",
                            onClick: () => moveContentBlock(index, blockIndex, "up"),
                            disabled: blockIndex === 0,
                            type: "button",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(MoveUp, { className: "h-3 w-3" })
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            variant: "ghost",
                            size: "sm",
                            className: "h-6 px-2",
                            onClick: () => moveContentBlock(index, blockIndex, "down"),
                            disabled: blockIndex === (subQ.contentBlocks?.length || 0) - 1,
                            type: "button",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(MoveDown, { className: "h-3 w-3" })
                          }
                        ),
                        block.type !== "row-layout" && blockIndex < (subQ.contentBlocks?.length || 0) - 1 && subQ.contentBlocks?.[blockIndex + 1]?.type !== "row-layout" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            variant: "ghost",
                            size: "sm",
                            className: "h-6 px-2 text-blue-500 hover:text-blue-600",
                            onClick: () => groupSubQuestionContentBlocks(index, blockIndex),
                            type: "button",
                            title: "Group with next block (side-by-side)",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "h-3 w-3" })
                          }
                        ),
                        block.type === "row-layout" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            variant: "ghost",
                            size: "sm",
                            className: "h-6 px-2 text-orange-500 hover:text-orange-600",
                            onClick: () => ungroupSubQuestionContentBlocks(index, blockIndex),
                            type: "button",
                            title: "Ungroup blocks",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ungroup, { className: "h-3 w-3" })
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            variant: "ghost",
                            size: "sm",
                            className: "text-red-500 hover:text-red-600 h-6 px-2",
                            onClick: () => removeContentBlock(index, blockIndex),
                            type: "button",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" })
                          }
                        )
                      ] })
                    ] }),
                    block.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 mb-1 items-center", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Button,
                            {
                              variant: block.textAlign === "left" || !block.textAlign ? "secondary" : "ghost",
                              size: "sm",
                              className: "h-7 w-7 p-0",
                              onClick: () => updateContentBlock(index, blockIndex, "textAlign", "left"),
                              type: "button",
                              title: "Align Left",
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignStart, { className: "h-3 w-3" })
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Button,
                            {
                              variant: block.textAlign === "center" ? "secondary" : "ghost",
                              size: "sm",
                              className: "h-7 w-7 p-0",
                              onClick: () => updateContentBlock(index, blockIndex, "textAlign", "center"),
                              type: "button",
                              title: "Align Center",
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignCenter, { className: "h-3 w-3" })
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Button,
                            {
                              variant: block.textAlign === "right" ? "secondary" : "ghost",
                              size: "sm",
                              className: "h-7 w-7 p-0",
                              onClick: () => updateContentBlock(index, blockIndex, "textAlign", "right"),
                              type: "button",
                              title: "Align Right",
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignEnd, { className: "h-3 w-3" })
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-px bg-neutral-300 dark:bg-neutral-600" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "checkbox",
                              id: `subq-border-${block.id}`,
                              checked: block.hasBorder || false,
                              onChange: (e) => updateContentBlock(index, blockIndex, "hasBorder", e.target.checked),
                              className: "h-4 w-4 rounded border-neutral-300"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `subq-border-${block.id}`, className: "text-xs cursor-pointer", children: "Border" })
                        ] }),
                        block.hasBorder && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Select,
                          {
                            value: block.borderWidth || "md",
                            onValueChange: (val) => updateContentBlock(index, blockIndex, "borderWidth", val),
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-7 w-24 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Width" }) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "xs", children: "Extra Small" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "sm", children: "Small" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "md", children: "Medium" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "lg", children: "Large" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "xl", children: "Extra Large" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "full", children: "Full Width" })
                              ] })
                            ]
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        RichTextEditor,
                        {
                          value: block.content,
                          onChange: (val) => updateContentBlock(index, blockIndex, "content", val),
                          placeholder: "Enter text content...",
                          rows: 3
                        }
                      )
                    ] }),
                    block.type === "image" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        onPaste: (e) => handleContentBlockImagePaste(e, index, blockIndex),
                        onDrop: (e) => handleContentBlockImageDrop(e, index, blockIndex),
                        onDragOver: handleDragOver,
                        children: [
                          !block.content && /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              className: "border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-4 text-center text-sm text-neutral-500 dark:text-neutral-400 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors mb-2",
                              tabIndex: 0,
                              onPaste: (e) => handleContentBlockImagePaste(e, index, blockIndex),
                              onDrop: (e) => handleContentBlockImageDrop(e, index, blockIndex),
                              onDragOver: handleDragOver,
                              children: "Drop image here, paste (Ctrl+V), or use upload button"
                            }
                          ),
                          block.content && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-md p-2 w-fit bg-white dark:bg-neutral-800 mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: block.content, alt: "Preview", className: "max-h-32 object-contain" }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center mb-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                placeholder: "Paste image URL...",
                                value: block.content || "",
                                onChange: (e) => updateContentBlock(index, blockIndex, "content", e.target.value),
                                onPaste: (e) => handleContentBlockImagePaste(e, index, blockIndex),
                                className: "flex-1 h-8 text-sm"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "input",
                                {
                                  type: "file",
                                  accept: "image/*",
                                  className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
                                  onChange: (e) => handleContentBlockImageUpload(e, index, blockIndex)
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", type: "button", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3 w-3" }) })
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                placeholder: "Caption (optional)...",
                                value: block.caption || "",
                                onChange: (e) => updateContentBlock(index, blockIndex, "caption", e.target.value),
                                className: "flex-1 h-8 text-sm"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Select,
                              {
                                value: block.imageSize || "medium",
                                onValueChange: (val) => updateContentBlock(index, blockIndex, "imageSize", val),
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-28 h-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Size" }) }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "xs", children: "Extra Small" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "small", children: "Small" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "medium", children: "Medium" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "large", children: "Large" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "xl", children: "Extra Large" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "2xl", children: "2X Large" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "full", children: "Full Width" })
                                  ] })
                                ]
                              }
                            )
                          ] })
                        ]
                      }
                    ),
                    block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Textarea,
                      {
                        value: block.content,
                        onChange: (e) => updateContentBlock(index, blockIndex, "content", e.target.value),
                        onKeyDown: (e) => {
                          if (e.key === "Tab") {
                            e.preventDefault();
                            const target = e.target;
                            const start = target.selectionStart;
                            const end = target.selectionEnd;
                            const value = target.value;
                            const newValue = value.substring(0, start) + "    " + value.substring(end);
                            updateContentBlock(index, blockIndex, "content", newValue);
                            setTimeout(() => {
                              target.selectionStart = target.selectionEnd = start + 4;
                            }, 0);
                          }
                        },
                        placeholder: "// Enter code here...",
                        className: "min-h-[100px] font-mono text-sm bg-neutral-900 text-neutral-100 border-neutral-700"
                      }
                    ),
                    block.type === "pseudocode" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "w-full font-mono text-sm border-collapse", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocodeLines?.map((line, lineIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "group", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-2 w-24 align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            value: line.lineLabel,
                            onChange: (e) => updatePseudocodeLine(index, blockIndex, lineIndex, "lineLabel", e.target.value),
                            className: "h-7 text-sm font-mono bg-transparent border-transparent hover:border-neutral-300 focus:border-neutral-400 dark:hover:border-neutral-600 dark:focus:border-neutral-500 w-full text-center"
                          }
                        ) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            value: line.content,
                            onChange: (e) => updatePseudocodeLine(index, blockIndex, lineIndex, "content", e.target.value),
                            onKeyDown: (e) => {
                              if (e.key === "Tab") {
                                e.preventDefault();
                                const input = e.target;
                                const start = input.selectionStart || 0;
                                const end = input.selectionEnd || 0;
                                const newValue = line.content.substring(0, start) + "    " + line.content.substring(end);
                                updatePseudocodeLine(index, blockIndex, lineIndex, "content", newValue);
                                setTimeout(() => {
                                  input.setSelectionRange(start + 4, start + 4);
                                }, 0);
                              }
                            },
                            placeholder: "Enter pseudocode...",
                            className: "h-7 text-sm font-mono bg-transparent border-transparent hover:border-neutral-300 focus:border-neutral-400 dark:hover:border-neutral-600 dark:focus:border-neutral-500"
                          }
                        ) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pl-1 w-8 align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            variant: "ghost",
                            size: "sm",
                            className: "h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600",
                            onClick: () => removePseudocodeLine(index, blockIndex, lineIndex),
                            disabled: (block.pseudocodeLines?.length || 0) <= 1,
                            type: "button",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
                          }
                        ) })
                      ] }, line.id)) }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          variant: "outline",
                          size: "sm",
                          onClick: () => addPseudocodeLine(index, blockIndex),
                          type: "button",
                          className: "w-full",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 mr-1" }),
                            " Add Line"
                          ]
                        }
                      )
                    ] }),
                    block.type === "code-table" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                      block.codeSections?.map((section, sectionIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg overflow-hidden", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              value: section.label,
                              onChange: (e) => updateSubQuestionCodeSection(index, blockIndex, sectionIndex, "label", e.target.value),
                              className: "flex-1 h-7 text-sm font-medium",
                              placeholder: "Section label (e.g., JavaScript Code)"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Button,
                            {
                              variant: "ghost",
                              size: "sm",
                              className: "h-7 w-7 p-0 text-red-500 hover:text-red-700",
                              onClick: () => removeSubQuestionCodeSection(index, blockIndex, sectionIndex),
                              disabled: (block.codeSections?.length || 0) <= 1,
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" })
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Textarea,
                          {
                            className: "font-mono text-sm bg-neutral-900 text-neutral-100 border-0 rounded-none",
                            value: section.code,
                            onChange: (e) => updateSubQuestionCodeSection(index, blockIndex, sectionIndex, "code", e.target.value),
                            onKeyDown: (e) => {
                              if (e.key === "Tab") {
                                e.preventDefault();
                                const target = e.target;
                                const start = target.selectionStart;
                                const end = target.selectionEnd;
                                const value = target.value;
                                const newValue = value.substring(0, start) + "    " + value.substring(end);
                                updateSubQuestionCodeSection(index, blockIndex, sectionIndex, "code", newValue);
                                setTimeout(() => {
                                  target.selectionStart = target.selectionEnd = start + 4;
                                }, 0);
                              }
                            },
                            rows: 3,
                            placeholder: "Enter code here..."
                          }
                        )
                      ] }, section.id)),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          variant: "outline",
                          size: "sm",
                          onClick: () => addSubQuestionCodeSection(index, blockIndex),
                          type: "button",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 mr-1" }),
                            " Add Section"
                          ]
                        }
                      )
                    ] }),
                    block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveDataTable, { dataTable: block.dataTable }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          variant: "outline",
                          size: "sm",
                          onClick: () => {
                            setEditingDataTable({ type: "subQuestion", blockIndex, subIndex: index });
                            setDataTableModalOpen(true);
                          },
                          type: "button",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-3 w-3 mr-1" }),
                            " Edit Table"
                          ]
                        }
                      ) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-center text-neutral-500", children: [
                        block.dataTable.columns.length,
                        " columns, ",
                        block.dataTable.rows.length,
                        " rows"
                      ] })
                    ] }),
                    block.type === "database-schema" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        DatabaseSchemaEditor,
                        {
                          value: block.databaseSchema,
                          onChange: (schema) => updateContentBlockDatabaseSchema(index, blockIndex, schema)
                        }
                      ),
                      block.databaseSchema && block.databaseSchema.tables.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mb-2", children: "Preview:" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-white dark:bg-neutral-800 rounded border", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema: block.databaseSchema }) })
                      ] })
                    ] }),
                    block.type === "row-layout" && block.children && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "These blocks will display side-by-side on larger screens:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RowLayout, { children: block.children.map((childBlock) => /* @__PURE__ */ jsxRuntimeExports.jsx(RowLayoutItem, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 bg-white dark:bg-neutral-800 rounded border text-sm", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 mb-1 text-xs text-neutral-500", children: [
                          childBlock.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "h-3 w-3" }),
                          childBlock.type === "image" && /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-3 w-3" }),
                          childBlock.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-3 w-3" }),
                          (childBlock.type === "data-table" || childBlock.type === "code-table") && /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-3 w-3" }),
                          childBlock.type === "database-schema" && /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "h-3 w-3" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "capitalize", children: childBlock.type === "data-table" ? "Data Table" : childBlock.type === "code-table" ? "Code Table" : childBlock.type })
                        ] }),
                        childBlock.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "prose prose-sm max-w-none", dangerouslySetInnerHTML: { __html: childBlock.content } }),
                        childBlock.type === "image" && childBlock.content && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: childBlock.content, alt: childBlock.caption || "", className: "max-h-32 object-contain" }),
                        childBlock.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-xs bg-neutral-900 text-neutral-100 p-2 rounded overflow-x-auto", children: childBlock.content }),
                        childBlock.type === "code-table" && childBlock.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: childBlock.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-2 py-1 font-semibold text-xs border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-900 text-neutral-100 p-2 text-xs font-mono overflow-x-auto", children: section.code })
                        ] }, section.id || sIdx)) }),
                        childBlock.type === "data-table" && childBlock.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveDataTable, { dataTable: childBlock.dataTable }),
                        childBlock.type === "database-schema" && childBlock.databaseSchema && /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema: childBlock.databaseSchema })
                      ] }) }, childBlock.id)) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-center text-neutral-400", children: "Click the ungroup button above to edit individual blocks" })
                    ] })
                  ] })
                ] }, block.id)) }) : (
                  /* Legacy fields fallback for existing questions */
                  (subQ.questionText || subQ.imageUrl || subQ.codeSnippet) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-700 dark:text-amber-300 mb-2", children: "This question uses the old format. Add a content block below to migrate to the new flexible system." }),
                    subQ.questionText && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm mb-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Text:" }),
                      " ",
                      subQ.questionText
                    ] }),
                    subQ.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm mb-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Image:" }),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: subQ.imageUrl, alt: "Preview", className: "max-h-24 inline-block" })
                    ] }),
                    subQ.codeSnippet && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-xs bg-neutral-900 text-neutral-100 p-2 rounded mt-1", children: subQ.codeSnippet })
                  ] })
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-700", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-400 mr-2 self-center", children: "Add:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      variant: "outline",
                      size: "sm",
                      onClick: () => addContentBlock(index, "text"),
                      type: "button",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "h-3 w-3 mr-1" }),
                        " Text"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      variant: "outline",
                      size: "sm",
                      onClick: () => addContentBlock(index, "image"),
                      type: "button",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-3 w-3 mr-1" }),
                        " Image"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      variant: "outline",
                      size: "sm",
                      onClick: () => addContentBlock(index, "code"),
                      type: "button",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-3 w-3 mr-1" }),
                        " Code"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      variant: "outline",
                      size: "sm",
                      onClick: () => addContentBlock(index, "code-table"),
                      type: "button",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-3 w-3 mr-1" }),
                        " Code Table"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      variant: "outline",
                      size: "sm",
                      onClick: () => addContentBlock(index, "data-table"),
                      type: "button",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-3 w-3 mr-1" }),
                        " Data Table"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      variant: "outline",
                      size: "sm",
                      onClick: () => addContentBlock(index, "database-schema"),
                      type: "button",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "h-3 w-3 mr-1" }),
                        " DB Schema"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      variant: "outline",
                      size: "sm",
                      onClick: () => addContentBlock(index, "pseudocode"),
                      type: "button",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-3 w-3 mr-1" }),
                        " Pseudocode"
                      ]
                    }
                  )
                ] })
              ] }),
              subQ.inputStyle !== "info-only" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-neutral-500 uppercase tracking-wider", children: "Marking Configuration" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Marking Scheme (One mark per line)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Textarea,
                    {
                      value: subQ.markingScheme.join("\n"),
                      onChange: (e) => updateSubQuestion(index, "markingScheme", e.target.value.split("\n")),
                      placeholder: "Correct use of WHILE loop\n  - Could also accept REPEAT UNTIL\n  - Could also accept FOR with condition\nVariable initialised before loop",
                      className: "min-h-[100px]"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Each line = 1 mark. Use indented lines with - for alternative answers worth the same mark." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Keywords for Auto-Marking (Comma separated)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: subQ.keywords?.join(", ") || "",
                      onChange: (e) => updateSubQuestion(index, "keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean)),
                      placeholder: "e.g. loop, array, integer"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Used to automatically award marks if these words appear in student answer." })
                ] }),
                subQ.aiGuidance === void 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    onClick: () => updateSubQuestion(index, "aiGuidance", ""),
                    type: "button",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlus, { className: "h-3 w-3 mr-1" }),
                      " Add AI Guidance"
                    ]
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium", children: "AI Marking Guidance" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        variant: "ghost",
                        size: "sm",
                        className: "text-red-500 hover:text-red-600 h-6 px-2",
                        onClick: () => updateSubQuestion(index, "aiGuidance", void 0),
                        type: "button",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3 mr-1" }),
                          " Remove"
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Textarea,
                    {
                      value: subQ.aiGuidance || "",
                      onChange: (e) => updateSubQuestion(index, "aiGuidance", e.target.value),
                      placeholder: "e.g. Do not accept 'while loop' as an answer. Only accept specific programming language syntax, not pseudocode.",
                      className: "min-h-[80px]"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Additional instructions for AI marking, such as answers to reject or special requirements." })
                ] }),
                (subQ.inputStyle === "webpage-wireframe" || subQ.inputStyle === "form-wireframe") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center flex-wrap gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Example Drawing (for AI grading)" }),
                    subQ.inputConfig?.wireframeExampleData && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        size: "sm",
                        variant: "outline",
                        className: "text-red-500 hover:text-red-600",
                        onClick: () => {
                          updateSubQuestion(index, "inputConfig", {
                            ...subQ.inputConfig || {},
                            wireframeExampleData: void 0,
                            wireframeExampleCanvas: void 0
                          });
                        },
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3 mr-1" }),
                          " Clear Example"
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Draw an example of what the student's answer should look like. The AI will compare student submissions against this." }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    DiagramEditor,
                    {
                      initialData: subQ.inputConfig?.wireframeExampleData,
                      initialDrawing: subQ.inputConfig?.wireframeExampleCanvas,
                      onChange: (dataStr, drawingStr) => {
                        updateSubQuestion(index, "inputConfig", {
                          ...subQ.inputConfig || {},
                          wireframeExampleData: dataStr,
                          wireframeExampleCanvas: drawingStr
                        });
                      },
                      mode: subQ.inputStyle === "form-wireframe" ? "form-wireframe" : "webpage-wireframe"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Sub-Questions (e.g. i, ii, iii)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => addSubPart(index), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-3 w-3" }),
                    " Add Sub-Question"
                  ] })
                ] }),
                subQ.subParts && subQ.subParts.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 ml-4 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700", children: subQ.subParts.map((part, partIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Accordion, { type: "single", collapsible: true, className: "bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AccordionItem, { value: `part-${partIndex}`, className: "border-none", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionTrigger, { className: "px-4 py-2 hover:no-underline", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: part.label || `Part ${partIndex + 1}` }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-500 truncate max-w-[300px]", children: part.contentBlocks?.find((b) => b.type === "text")?.content || part.questionText || "(No content)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-400", children: [
                        "(",
                        part.maxMarks,
                        " marks)"
                      ] })
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(AccordionContent, { className: "px-4 pb-4 space-y-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          variant: "ghost",
                          size: "sm",
                          className: "text-red-500 hover:text-red-600 hover:bg-red-50",
                          onClick: () => removeSubPart(index, partIndex),
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3 mr-1" }),
                            " Remove"
                          ]
                        }
                      ) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Label" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              value: part.label || "",
                              onChange: (e) => updateSubPart(index, partIndex, "label", e.target.value),
                              placeholder: "(i)",
                              className: "h-8"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Marks" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              type: "number",
                              value: part.maxMarks,
                              onChange: (e) => updateSubPart(index, partIndex, "maxMarks", parseInt(e.target.value) || 0),
                              className: "h-8"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Input Style" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Select,
                            {
                              value: part.inputStyle || "text",
                              onValueChange: (val) => {
                                updateSubPart(index, partIndex, "inputStyle", val);
                                if (val === "info-only") {
                                  updateSubPart(index, partIndex, "maxMarks", 0);
                                }
                              },
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "info-only", children: "Info Only (No Input)" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "text", children: "Text Area" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "code-editor", children: "Code Editor" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "design-choice", children: "Design Choice" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "drawing", children: "Drawing" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "table", children: "Table" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "labeled-inputs", children: "Labeled Inputs" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "fill-in-blanks", children: "Fill in the Blanks" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "erd-annotation", children: "ERD Annotation" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "nav-structure", children: "Navigation Structure" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "nav-structure-higher", children: "Navigation Structure (Advanced)" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "tag-matching", children: "Tag Matching" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "structure-dataflow", children: "Structure Diagram (Dataflow)" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "form-wireframe", children: "Form Wireframe" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "webpage-wireframe", children: "Webpage Wireframe" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "html-upload", children: "HTML File Upload" })
                                ] })
                              ]
                            }
                          )
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-neutral-500 uppercase tracking-wider", children: "Question Content" }),
                        part.contentBlocks && part.contentBlocks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: part.contentBlocks.map((block, blockIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 bg-white dark:bg-neutral-800 rounded border", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                              block.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "h-3 w-3 text-neutral-500" }),
                              block.type === "image" && /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-3 w-3 text-neutral-500" }),
                              block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-3 w-3 text-neutral-500" }),
                              block.type === "code-table" && /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-3 w-3 text-neutral-500" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-medium capitalize", children: block.type === "code-table" ? "Code Table" : block.type })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Button,
                                {
                                  variant: "ghost",
                                  size: "sm",
                                  className: "h-5 px-1",
                                  onClick: () => moveSubPartContentBlock(index, partIndex, blockIndex, "up"),
                                  disabled: blockIndex === 0,
                                  type: "button",
                                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(MoveUp, { className: "h-2.5 w-2.5" })
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Button,
                                {
                                  variant: "ghost",
                                  size: "sm",
                                  className: "h-5 px-1",
                                  onClick: () => moveSubPartContentBlock(index, partIndex, blockIndex, "down"),
                                  disabled: blockIndex === (part.contentBlocks?.length || 0) - 1,
                                  type: "button",
                                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(MoveDown, { className: "h-2.5 w-2.5" })
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Button,
                                {
                                  variant: "ghost",
                                  size: "sm",
                                  className: "h-5 px-1 text-red-500 hover:text-red-600",
                                  onClick: () => removeSubPartContentBlock(index, partIndex, blockIndex),
                                  type: "button",
                                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-2.5 w-2.5" })
                                }
                              )
                            ] })
                          ] }),
                          block.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Button,
                                  {
                                    variant: block.textAlign === "left" || !block.textAlign ? "secondary" : "ghost",
                                    size: "sm",
                                    className: "h-6 w-6 p-0",
                                    onClick: () => updateSubPartContentBlock(index, partIndex, blockIndex, "textAlign", "left"),
                                    type: "button",
                                    title: "Align Left",
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignStart, { className: "h-2.5 w-2.5" })
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Button,
                                  {
                                    variant: block.textAlign === "center" ? "secondary" : "ghost",
                                    size: "sm",
                                    className: "h-6 w-6 p-0",
                                    onClick: () => updateSubPartContentBlock(index, partIndex, blockIndex, "textAlign", "center"),
                                    type: "button",
                                    title: "Align Center",
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignCenter, { className: "h-2.5 w-2.5" })
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Button,
                                  {
                                    variant: block.textAlign === "right" ? "secondary" : "ghost",
                                    size: "sm",
                                    className: "h-6 w-6 p-0",
                                    onClick: () => updateSubPartContentBlock(index, partIndex, blockIndex, "textAlign", "right"),
                                    type: "button",
                                    title: "Align Right",
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignEnd, { className: "h-2.5 w-2.5" })
                                  }
                                )
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-px bg-neutral-300 dark:bg-neutral-600" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  "input",
                                  {
                                    type: "checkbox",
                                    id: `subpart-border-${block.id}`,
                                    checked: block.hasBorder || false,
                                    onChange: (e) => updateSubPartContentBlock(index, partIndex, blockIndex, "hasBorder", e.target.checked),
                                    className: "h-3 w-3 rounded border-neutral-300"
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `subpart-border-${block.id}`, className: "text-xs cursor-pointer", children: "Border" })
                              ] }),
                              block.hasBorder && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                Select,
                                {
                                  value: block.borderWidth || "md",
                                  onValueChange: (val) => updateSubPartContentBlock(index, partIndex, blockIndex, "borderWidth", val),
                                  children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-6 w-20 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Width" }) }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "xs", children: "XS" }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "sm", children: "Small" }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "md", children: "Medium" }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "lg", children: "Large" }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "xl", children: "XL" }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "full", children: "Full" })
                                    ] })
                                  ]
                                }
                              )
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Textarea,
                              {
                                value: block.content,
                                onChange: (e) => updateSubPartContentBlock(index, partIndex, blockIndex, "content", e.target.value),
                                placeholder: "Enter text content...",
                                rows: 2,
                                className: "text-xs"
                              }
                            )
                          ] }),
                          block.type === "image" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "div",
                            {
                              className: "space-y-2",
                              onPaste: (e) => handleSubPartContentBlockImagePaste(e, index, partIndex, blockIndex),
                              onDrop: (e) => handleSubPartContentBlockImageDrop(e, index, partIndex, blockIndex),
                              onDragOver: handleDragOver,
                              children: [
                                !block.content && /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  "div",
                                  {
                                    className: "border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-3 text-center text-xs text-neutral-500 dark:text-neutral-400 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors",
                                    tabIndex: 0,
                                    onPaste: (e) => handleSubPartContentBlockImagePaste(e, index, partIndex, blockIndex),
                                    onDrop: (e) => handleSubPartContentBlockImageDrop(e, index, partIndex, blockIndex),
                                    onDragOver: handleDragOver,
                                    children: "Drop, paste, or upload image"
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    Input,
                                    {
                                      placeholder: "Paste image URL or upload",
                                      value: block.content,
                                      onChange: (e) => updateSubPartContentBlock(index, partIndex, blockIndex, "content", e.target.value),
                                      onPaste: (e) => handleSubPartContentBlockImagePaste(e, index, partIndex, blockIndex),
                                      className: "flex-1 h-7 text-xs"
                                    }
                                  ),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                                      "input",
                                      {
                                        type: "file",
                                        accept: "image/*",
                                        className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
                                        onChange: (e) => handleSubPartContentBlockImageUpload(e, index, partIndex, blockIndex)
                                      }
                                    ),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", type: "button", className: "h-7", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3 w-3" }) })
                                  ] })
                                ] }),
                                block.content && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: block.content, alt: block.caption || "Preview", className: "max-h-24 object-contain rounded border" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Input,
                                  {
                                    placeholder: "Caption (optional)",
                                    value: block.caption || "",
                                    onChange: (e) => updateSubPartContentBlock(index, partIndex, blockIndex, "caption", e.target.value),
                                    className: "h-7 text-xs"
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                  Select,
                                  {
                                    value: block.imageSize || "medium",
                                    onValueChange: (val) => updateSubPartContentBlock(index, partIndex, blockIndex, "imageSize", val),
                                    children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-24 h-7 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Size" }) }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "xs", children: "XS" }),
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "small", children: "Small" }),
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "medium", children: "Medium" }),
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "large", children: "Large" }),
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "xl", children: "XL" }),
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "2xl", children: "2XL" }),
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "full", children: "Full" })
                                      ] })
                                    ]
                                  }
                                )
                              ]
                            }
                          ),
                          block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Textarea,
                            {
                              value: block.content,
                              onChange: (e) => updateSubPartContentBlock(index, partIndex, blockIndex, "content", e.target.value),
                              onKeyDown: (e) => {
                                if (e.key === "Tab") {
                                  e.preventDefault();
                                  const target = e.target;
                                  const start = target.selectionStart;
                                  const end = target.selectionEnd;
                                  const value = target.value;
                                  const newValue = value.substring(0, start) + "    " + value.substring(end);
                                  updateSubPartContentBlock(index, partIndex, blockIndex, "content", newValue);
                                  setTimeout(() => {
                                    target.selectionStart = target.selectionEnd = start + 4;
                                  }, 0);
                                }
                              },
                              placeholder: "// Enter code here...",
                              className: "min-h-[60px] font-mono text-xs bg-neutral-900 text-neutral-100 border-neutral-700"
                            }
                          ),
                          block.type === "pseudocode" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "w-full font-mono text-xs border-collapse", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocodeLines?.map((line, lineIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "group", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-2 w-20 align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Input,
                                {
                                  value: line.lineLabel,
                                  onChange: (e) => updateSubPartPseudocodeLine(index, partIndex, blockIndex, lineIndex, "lineLabel", e.target.value),
                                  className: "h-6 text-xs font-mono bg-transparent border-transparent hover:border-neutral-300 focus:border-neutral-400 dark:hover:border-neutral-600 dark:focus:border-neutral-500 w-full text-center"
                                }
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Input,
                                {
                                  value: line.content,
                                  onChange: (e) => updateSubPartPseudocodeLine(index, partIndex, blockIndex, lineIndex, "content", e.target.value),
                                  onKeyDown: (e) => {
                                    if (e.key === "Tab") {
                                      e.preventDefault();
                                      const input = e.target;
                                      const start = input.selectionStart || 0;
                                      const end = input.selectionEnd || 0;
                                      const newValue = line.content.substring(0, start) + "    " + line.content.substring(end);
                                      updateSubPartPseudocodeLine(index, partIndex, blockIndex, lineIndex, "content", newValue);
                                      setTimeout(() => {
                                        input.setSelectionRange(start + 4, start + 4);
                                      }, 0);
                                    }
                                  },
                                  placeholder: "Enter pseudocode...",
                                  className: "h-6 text-xs font-mono bg-transparent border-transparent hover:border-neutral-300 focus:border-neutral-400 dark:hover:border-neutral-600 dark:focus:border-neutral-500"
                                }
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pl-1 w-6 align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Button,
                                {
                                  variant: "ghost",
                                  size: "sm",
                                  className: "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600",
                                  onClick: () => removeSubPartPseudocodeLine(index, partIndex, blockIndex, lineIndex),
                                  disabled: (block.pseudocodeLines?.length || 0) <= 1,
                                  type: "button",
                                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-2.5 w-2.5" })
                                }
                              ) })
                            ] }, line.id)) }) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Button,
                              {
                                variant: "outline",
                                size: "sm",
                                onClick: () => addSubPartPseudocodeLine(index, partIndex, blockIndex),
                                type: "button",
                                className: "w-full h-6 text-xs",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-2.5 w-2.5 mr-1" }),
                                  " Add Line"
                                ]
                              }
                            )
                          ] }),
                          block.type === "code-table" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                            block.codeSections?.map((section, sectionIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded overflow-hidden", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 bg-neutral-100 dark:bg-neutral-700 px-2 py-1", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Input,
                                  {
                                    value: section.label,
                                    onChange: (e) => updateSubPartCodeSection(index, partIndex, blockIndex, sectionIndex, "label", e.target.value),
                                    className: "flex-1 h-6 text-xs font-medium",
                                    placeholder: "Section label"
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Button,
                                  {
                                    variant: "ghost",
                                    size: "sm",
                                    className: "h-6 w-6 p-0 text-red-500",
                                    onClick: () => removeSubPartCodeSection(index, partIndex, blockIndex, sectionIndex),
                                    disabled: (block.codeSections?.length || 0) <= 1,
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-2.5 w-2.5" })
                                  }
                                )
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Textarea,
                                {
                                  className: "font-mono text-xs bg-neutral-900 text-neutral-100 border-0 rounded-none",
                                  value: section.code,
                                  onChange: (e) => updateSubPartCodeSection(index, partIndex, blockIndex, sectionIndex, "code", e.target.value),
                                  rows: 2,
                                  placeholder: "Enter code here..."
                                }
                              )
                            ] }, section.id)),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Button,
                              {
                                variant: "outline",
                                size: "sm",
                                onClick: () => addSubPartCodeSection(index, partIndex, blockIndex),
                                type: "button",
                                className: "h-6 text-xs",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-2.5 w-2.5 mr-1" }),
                                  " Add Section"
                                ]
                              }
                            )
                          ] }),
                          block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveDataTable, { dataTable: block.dataTable }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Button,
                              {
                                variant: "outline",
                                size: "sm",
                                onClick: () => {
                                  setEditingDataTable({ type: "subPart", blockIndex, subIndex: index, partIndex });
                                  setDataTableModalOpen(true);
                                },
                                type: "button",
                                className: "h-6 text-xs",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-2.5 w-2.5 mr-1" }),
                                  " Edit Table"
                                ]
                              }
                            ) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-center text-neutral-500", children: [
                              block.dataTable.columns.length,
                              " columns, ",
                              block.dataTable.rows.length,
                              " rows"
                            ] })
                          ] }),
                          block.type === "database-schema" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              DatabaseSchemaEditor,
                              {
                                value: block.databaseSchema,
                                onChange: (schema) => updateSubPartContentBlockDatabaseSchema(index, partIndex, blockIndex, schema)
                              }
                            ),
                            block.databaseSchema && block.databaseSchema.tables.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-2", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mb-1", children: "Preview:" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-white dark:bg-neutral-800 rounded border", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema: block.databaseSchema }) })
                            ] })
                          ] })
                        ] }, block.id)) }) : (
                          /* Legacy content migration notice */
                          part.questionText || part.imageUrl || part.codeSnippet ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-700 dark:text-amber-300 mb-2", children: "This uses the legacy format. Add content blocks below to upgrade." }),
                            part.questionText && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs mb-1", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Text:" }),
                              " ",
                              part.questionText
                            ] }),
                            part.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: part.imageUrl, alt: "Legacy", className: "max-h-16 mt-1" }),
                            part.codeSnippet && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-xs bg-neutral-900 text-neutral-100 p-1 rounded mt-1 overflow-x-auto", children: part.codeSnippet })
                          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-400 italic", children: "No content blocks yet. Add text, images, or code below." })
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-700", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-400 mr-1 self-center", children: "Add:" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Button,
                            {
                              variant: "outline",
                              size: "sm",
                              onClick: () => addSubPartContentBlock(index, partIndex, "text"),
                              type: "button",
                              className: "h-6 text-xs",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "h-2.5 w-2.5 mr-1" }),
                                " Text"
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Button,
                            {
                              variant: "outline",
                              size: "sm",
                              onClick: () => addSubPartContentBlock(index, partIndex, "image"),
                              type: "button",
                              className: "h-6 text-xs",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-2.5 w-2.5 mr-1" }),
                                " Image"
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Button,
                            {
                              variant: "outline",
                              size: "sm",
                              onClick: () => addSubPartContentBlock(index, partIndex, "code"),
                              type: "button",
                              className: "h-6 text-xs",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-2.5 w-2.5 mr-1" }),
                                " Code"
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Button,
                            {
                              variant: "outline",
                              size: "sm",
                              onClick: () => addSubPartContentBlock(index, partIndex, "code-table"),
                              type: "button",
                              className: "h-6 text-xs",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-2.5 w-2.5 mr-1" }),
                                " Code Table"
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Button,
                            {
                              variant: "outline",
                              size: "sm",
                              onClick: () => addSubPartContentBlock(index, partIndex, "pseudocode"),
                              type: "button",
                              className: "h-6 text-xs",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-2.5 w-2.5 mr-1" }),
                                " Pseudocode"
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Button,
                            {
                              variant: "outline",
                              size: "sm",
                              onClick: () => addSubPartContentBlock(index, partIndex, "data-table"),
                              type: "button",
                              className: "h-6 text-xs",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-2.5 w-2.5 mr-1" }),
                                " Data Table"
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Button,
                            {
                              variant: "outline",
                              size: "sm",
                              onClick: () => addSubPartContentBlock(index, partIndex, "database-schema"),
                              type: "button",
                              className: "h-6 text-xs",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "h-2.5 w-2.5 mr-1" }),
                                " DB Schema"
                              ]
                            }
                          )
                        ] })
                      ] }),
                      part.inputStyle === "code-editor" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-full", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Starter Code (Optional)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Pre-filled code students will complete." }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Textarea,
                          {
                            value: part.inputConfig?.starterCode || "",
                            onChange: (e) => {
                              const newConfig = { ...part.inputConfig, starterCode: e.target.value };
                              updateSubPart(index, partIndex, "inputConfig", newConfig);
                            },
                            placeholder: "# Enter starter code here...",
                            className: "font-mono text-xs min-h-[100px] bg-neutral-900 text-neutral-100"
                          }
                        )
                      ] }),
                      part.inputStyle === "table" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Table Configuration" }),
                        !part.inputConfig?.grid && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Button,
                          {
                            size: "sm",
                            variant: "outline",
                            onClick: () => initSubPartGridTable(index, partIndex),
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                              " Create Table Grid"
                            ]
                          }
                        ),
                        part.inputConfig?.grid && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Set cell values and mark which are input fields" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "border-collapse text-xs", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-200 dark:bg-neutral-700 w-8" }),
                              part.inputConfig.grid.headers.map((header, colIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-200 dark:bg-neutral-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Input,
                                  {
                                    value: header,
                                    onChange: (e) => updateSubPartGridHeader(index, partIndex, colIdx, e.target.value),
                                    className: "h-6 text-xs min-w-[60px]"
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Button,
                                  {
                                    size: "sm",
                                    variant: "ghost",
                                    className: "h-5 w-5 p-0 text-red-500",
                                    onClick: () => removeSubPartGridColumn(index, partIndex, colIdx),
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-2 h-2" })
                                  }
                                )
                              ] }) }, colIdx)),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-200 dark:bg-neutral-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => addSubPartGridColumn(index, partIndex), className: "h-5 px-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-2 h-2" }) }) })
                            ] }) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
                              part.inputConfig.grid.rows.map((row, rowIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-100 dark:bg-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Button,
                                  {
                                    size: "sm",
                                    variant: "ghost",
                                    className: "h-5 w-5 p-0 text-red-500",
                                    onClick: () => removeSubPartGridRow(index, partIndex, rowIdx),
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-2 h-2" })
                                  }
                                ) }),
                                row.cells.map((cell, cellIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  "td",
                                  {
                                    className: `border border-neutral-300 dark:border-neutral-600 p-1 ${cell.isInput ? "bg-blue-50 dark:bg-blue-900/30" : ""}`,
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                                        Input,
                                        {
                                          value: cell.value || "",
                                          onChange: (e) => updateSubPartGridCell(index, partIndex, rowIdx, cellIdx, "value", e.target.value),
                                          placeholder: cell.isInput ? "Input" : "Fixed",
                                          className: `h-6 text-xs flex-1 min-w-[60px] ${cell.isInput ? "border-blue-400" : ""}`
                                        }
                                      ),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "flex items-center cursor-pointer shrink-0", title: "Input field", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                        "input",
                                        {
                                          type: "checkbox",
                                          checked: cell.isInput || false,
                                          onChange: (e) => updateSubPartGridCell(index, partIndex, rowIdx, cellIdx, "isInput", e.target.checked),
                                          className: "w-2 h-2"
                                        }
                                      ) }),
                                      cell.isInput && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center cursor-pointer shrink-0 ml-1", title: "Multi-line", children: [
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                                          "input",
                                          {
                                            type: "checkbox",
                                            checked: cell.multiline || false,
                                            onChange: (e) => updateSubPartGridCell(index, partIndex, rowIdx, cellIdx, "multiline", e.target.checked),
                                            className: "w-2 h-2"
                                          }
                                        ),
                                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] ml-0.5", children: "ML" })
                                      ] })
                                    ] })
                                  },
                                  cellIdx
                                )),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-neutral-300 dark:border-neutral-600 p-1" })
                              ] }, rowIdx)),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-100 dark:bg-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => addSubPartGridRow(index, partIndex), className: "h-5 px-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-2 h-2" }) }) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: part.inputConfig.grid.headers.length + 1, className: "border border-neutral-300 dark:border-neutral-600 p-1 text-xs text-neutral-400", children: "Add row" })
                              ] })
                            ] })
                          ] }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Button,
                            {
                              size: "sm",
                              variant: "ghost",
                              className: "text-neutral-500 text-xs",
                              onClick: () => updateSubPart(index, partIndex, "inputConfig", void 0),
                              children: "Clear table"
                            }
                          )
                        ] })
                      ] }),
                      part.inputStyle === "labeled-inputs" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Labeled Inputs Configuration" }),
                        !part.inputConfig?.fields && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Button,
                          {
                            size: "sm",
                            variant: "outline",
                            onClick: () => initSubPartLabeledInputs(index, partIndex),
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                              " Initialize Fields"
                            ]
                          }
                        ),
                        part.inputConfig?.fields && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                          part.inputConfig.fields.map((field, fieldIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                placeholder: "Label",
                                value: field.label,
                                onChange: (e) => updateSubPartLabeledField(index, partIndex, fieldIndex, "label", e.target.value),
                                className: "flex-1 h-7 text-xs"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                placeholder: "Key",
                                value: field.key,
                                onChange: (e) => updateSubPartLabeledField(index, partIndex, fieldIndex, "key", e.target.value),
                                className: "flex-1 h-7 text-xs"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                size: "sm",
                                variant: "ghost",
                                className: "text-red-500 px-1 h-6",
                                onClick: () => removeSubPartLabeledField(index, partIndex, fieldIndex),
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
                              }
                            )
                          ] }, fieldIndex)),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => addSubPartLabeledField(index, partIndex), children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                            " Add Field"
                          ] })
                        ] }) })
                      ] }),
                      part.inputStyle === "fill-in-blanks" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Fill in the Blanks Configuration" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-neutral-500", children: [
                          "Use ",
                          "{{blank_1}}",
                          ", ",
                          "{{blank_2}}",
                          ", etc. as placeholders."
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Code Template" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Textarea,
                            {
                              value: part.inputConfig?.codeTemplate || "",
                              onChange: (e) => {
                                const newConfig = { ...part.inputConfig, codeTemplate: e.target.value };
                                updateSubPart(index, partIndex, "inputConfig", newConfig);
                              },
                              placeholder: "Enter code with {{blank_1}}, {{blank_2}} placeholders...",
                              className: "font-mono text-xs min-h-[100px]"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Blanks (Answers)" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Button,
                              {
                                size: "sm",
                                variant: "outline",
                                onClick: () => {
                                  const blanks = part.inputConfig?.blanks || [];
                                  const newBlank = { key: `blank_${blanks.length + 1}`, answer: "", hint: "" };
                                  updateSubPart(index, partIndex, "inputConfig", { ...part.inputConfig, blanks: [...blanks, newBlank] });
                                },
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 mr-1" }),
                                  " Add Blank"
                                ]
                              }
                            )
                          ] }),
                          (part.inputConfig?.blanks || []).map((blank, blankIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center bg-white dark:bg-neutral-700 p-2 rounded border", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono text-neutral-500 w-14", children: `{{${blank.key}}}` }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                value: blank.answer,
                                onChange: (e) => {
                                  const blanks = [...part.inputConfig?.blanks || []];
                                  blanks[blankIdx] = { ...blanks[blankIdx], answer: e.target.value };
                                  updateSubPart(index, partIndex, "inputConfig", { ...part.inputConfig, blanks });
                                },
                                placeholder: "Correct answer",
                                className: "flex-1 h-7 text-xs"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                value: blank.hint || "",
                                onChange: (e) => {
                                  const blanks = [...part.inputConfig?.blanks || []];
                                  blanks[blankIdx] = { ...blanks[blankIdx], hint: e.target.value };
                                  updateSubPart(index, partIndex, "inputConfig", { ...part.inputConfig, blanks });
                                },
                                placeholder: "Hint",
                                className: "w-20 h-7 text-xs"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                type: "number",
                                value: blank.width || 80,
                                onChange: (e) => {
                                  const blanks = [...part.inputConfig?.blanks || []];
                                  blanks[blankIdx] = { ...blanks[blankIdx], width: parseInt(e.target.value) || 80 };
                                  updateSubPart(index, partIndex, "inputConfig", { ...part.inputConfig, blanks });
                                },
                                placeholder: "Width",
                                className: "w-16 h-7 text-xs",
                                min: 40,
                                max: 300
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                size: "sm",
                                variant: "ghost",
                                onClick: () => {
                                  const blanks = (part.inputConfig?.blanks || []).filter((_, i) => i !== blankIdx);
                                  updateSubPart(index, partIndex, "inputConfig", { ...part.inputConfig, blanks });
                                },
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3 text-red-500" })
                              }
                            )
                          ] }, blankIdx))
                        ] })
                      ] }),
                      part.inputStyle === "erd-annotation" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Draw the ERD Diagram" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Draw your ERD using ellipses for attributes. Students will mark attributes as Primary Key (underline) or Foreign Key (star)." })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          DiagramEditor,
                          {
                            initialData: part.inputConfig?.baseErdDiagram || "",
                            onChange: (data) => {
                              updateSubPart(index, partIndex, "inputConfig", {
                                ...part.inputConfig,
                                baseErdDiagram: data
                              });
                            },
                            mode: "database",
                            allowBaseItemDeletion: true
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-3", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Mark Correct Answers" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => {
                              try {
                                const items = JSON.parse(part.inputConfig?.baseErdDiagram || "[]");
                                const ellipses = items.filter((i) => i.type === "ellipse" && i.content);
                                const newAttrs = ellipses.map((e) => ({
                                  id: e.id,
                                  entityName: "",
                                  attributeName: e.content || "",
                                  correctMarking: "none"
                                }));
                                updateSubPart(index, partIndex, "inputConfig", {
                                  ...part.inputConfig,
                                  erdAttributes: newAttrs
                                });
                              } catch (e) {
                                console.error("Failed to parse diagram", e);
                              }
                            }, children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                              " Detect Attributes"
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mb-2", children: "Specify which attributes should be marked as Primary Key or Foreign Key." }),
                          part.inputConfig?.erdAttributes && part.inputConfig.erdAttributes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-12 gap-1 text-xs font-medium text-neutral-500 px-1", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-5", children: "Attribute (from diagram)" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-6", children: "Correct Marking" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-1" })
                            ] }),
                            part.inputConfig.erdAttributes.map((attr, attrIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-12 gap-1 items-center", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-5 text-xs px-2 py-1 bg-white dark:bg-neutral-900 rounded border", children: attr.attributeName || "(empty)" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                Select,
                                {
                                  value: attr.correctMarking,
                                  onValueChange: (val) => updateSubPartErdAttribute(index, partIndex, attrIndex, "correctMarking", val),
                                  children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "col-span-6 h-7 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "None (no marking needed)" }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "primary", children: "Primary Key (underline)" }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "foreign", children: "Foreign Key (star)" })
                                    ] })
                                  ]
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Button,
                                {
                                  size: "sm",
                                  variant: "ghost",
                                  className: "col-span-1 text-red-500 px-1 h-6",
                                  onClick: () => removeSubPartErdAttribute(index, partIndex, attrIndex),
                                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-2 h-2" })
                                }
                              )
                            ] }, attrIndex))
                          ] })
                        ] })
                      ] }),
                      part.inputStyle === "nav-structure" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Starting Diagram (Optional)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Draw a starting navigation structure that students will complete. Leave empty if students should create from scratch." })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          DiagramEditor,
                          {
                            initialData: part.inputConfig?.baseNavDiagram || "",
                            onChange: (data) => {
                              updateSubPart(index, partIndex, "inputConfig", {
                                ...part.inputConfig,
                                baseNavDiagram: data
                              });
                            },
                            mode: "nav-structure"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-4 space-y-4", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-green-700 dark:text-green-400", children: "Example Answer (For AI Grading)" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Draw the expected answer. The AI will use this to grade student submissions." })
                            ] }),
                            part.inputConfig?.navExampleData && /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                size: "sm",
                                variant: "outline",
                                className: "text-red-500 hover:text-red-600 shrink-0",
                                onClick: () => {
                                  updateSubPart(index, partIndex, "inputConfig", {
                                    ...part.inputConfig,
                                    navExampleData: void 0,
                                    navExampleCanvas: void 0
                                  });
                                },
                                "data-testid": `button-clear-nav-example-${index}-${partIndex}`,
                                children: "Clear"
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            DiagramEditor,
                            {
                              initialData: part.inputConfig?.navExampleData || "",
                              initialDrawing: part.inputConfig?.navExampleCanvas || "",
                              onChange: (dataStr, drawingStr) => {
                                updateSubPart(index, partIndex, "inputConfig", {
                                  ...part.inputConfig,
                                  navExampleData: dataStr,
                                  navExampleCanvas: drawingStr
                                });
                              },
                              mode: "nav-structure"
                            }
                          )
                        ] })
                      ] }),
                      part.inputStyle === "tag-matching" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Tag Matching Setup" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-1", children: "Add tags and draw target zones. Upload background image in parent question first." })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          TagMatchingEditor,
                          {
                            mode: "edit",
                            backgroundUrl: formData.subQuestions[index]?.drawingBackgroundUrl,
                            sourceTags: part.inputConfig?.tagMatchingConfig?.sourceTags || [],
                            targetZones: part.inputConfig?.tagMatchingConfig?.targetZones || [],
                            onChange: (tags, zones) => {
                              updateSubPart(index, partIndex, "inputConfig", {
                                ...part.inputConfig,
                                tagMatchingConfig: { sourceTags: tags, targetZones: zones }
                              });
                            }
                          }
                        )
                      ] }),
                      part.inputStyle === "form-wireframe" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center flex-wrap gap-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Expected Form Elements (for AI grading)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Button,
                            {
                              size: "sm",
                              variant: "outline",
                              onClick: () => {
                                const current = part.inputConfig?.formWireframeExpectations || [];
                                updateSubPart(index, partIndex, "inputConfig", {
                                  ...part.inputConfig || {},
                                  formWireframeExpectations: [...current, { fieldType: "text-input", labelText: "" }]
                                });
                              },
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                                " Add Expected Element"
                              ]
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Specify what form elements students should include. The AI will check for these when grading." }),
                        part.inputConfig?.formWireframeExpectations?.map((expectation, expIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-start flex-wrap p-2 bg-white dark:bg-neutral-900 rounded border", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-[120px]", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Type" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Select,
                              {
                                value: expectation.fieldType,
                                onValueChange: (val) => {
                                  const updated = [...part.inputConfig?.formWireframeExpectations || []];
                                  updated[expIdx] = { ...updated[expIdx], fieldType: val };
                                  updateSubPart(index, partIndex, "inputConfig", {
                                    ...part.inputConfig || {},
                                    formWireframeExpectations: updated
                                  });
                                },
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "label", children: "Label" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "text-input", children: "Text Input" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "textarea", children: "Textarea" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "dropdown", children: "Dropdown" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "radio", children: "Radio Button" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "checkbox", children: "Checkbox" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "submit", children: "Submit Button" })
                                  ] })
                                ]
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-[2] min-w-[150px]", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Label Text (fuzzy match)" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                value: expectation.labelText || "",
                                onChange: (e) => {
                                  const updated = [...part.inputConfig?.formWireframeExpectations || []];
                                  updated[expIdx] = { ...updated[expIdx], labelText: e.target.value };
                                  updateSubPart(index, partIndex, "inputConfig", {
                                    ...part.inputConfig || {},
                                    formWireframeExpectations: updated
                                  });
                                },
                                placeholder: "e.g., Name, Email, Phone...",
                                className: "h-8 text-xs"
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 flex items-center gap-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-1 text-xs cursor-pointer mt-4", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "input",
                                {
                                  type: "checkbox",
                                  checked: expectation.required || false,
                                  onChange: (e) => {
                                    const updated = [...part.inputConfig?.formWireframeExpectations || []];
                                    updated[expIdx] = { ...updated[expIdx], required: e.target.checked };
                                    updateSubPart(index, partIndex, "inputConfig", {
                                      ...part.inputConfig || {},
                                      formWireframeExpectations: updated
                                    });
                                  },
                                  className: "w-3 h-3"
                                }
                              ),
                              "Required*"
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                size: "sm",
                                variant: "ghost",
                                className: "h-8 w-8 p-0 text-red-500 mt-4",
                                onClick: () => {
                                  const updated = (part.inputConfig?.formWireframeExpectations || []).filter((_, i) => i !== expIdx);
                                  updateSubPart(index, partIndex, "inputConfig", {
                                    ...part.inputConfig || {},
                                    formWireframeExpectations: updated
                                  });
                                },
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
                              }
                            )
                          ] })
                        ] }, expIdx))
                      ] }),
                      part.inputStyle !== "info-only" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Marking Scheme (One per line)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Textarea,
                            {
                              value: part.markingScheme.join("\n"),
                              onChange: (e) => updateSubPart(index, partIndex, "markingScheme", e.target.value.split("\n")),
                              rows: 2
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Keywords (Comma separated)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              value: part.keywords?.join(", ") || "",
                              onChange: (e) => updateSubPart(index, partIndex, "keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean)),
                              className: "h-8"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "AI Marking Guidance (Optional)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Textarea,
                            {
                              value: part.aiGuidance || "",
                              onChange: (e) => updateSubPart(index, partIndex, "aiGuidance", e.target.value),
                              placeholder: "e.g. Do not accept 'while loop' as an answer.",
                              rows: 2
                            }
                          )
                        ] }),
                        (part.inputStyle === "drawing" || part.inputStyle === "erd-annotation" || part.inputStyle === "nav-structure" || part.inputStyle === "nav-structure-higher" || part.inputStyle === "tag-matching" || part.inputStyle === "structure-dataflow" || part.inputStyle === "form-wireframe" || part.inputStyle === "webpage-wireframe" || part.inputStyle === "structure-diagram" || part.inputStyle === "entity-occurrence-diagram") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium", children: "Drawing Background Image (Optional)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                placeholder: "URL for image students will annotate...",
                                value: part.drawingBackgroundUrl || "",
                                onChange: (e) => updateSubPart(index, partIndex, "drawingBackgroundUrl", e.target.value || void 0),
                                className: "flex-1"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "cursor-pointer", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "input",
                                {
                                  type: "file",
                                  accept: "image/*",
                                  className: "hidden",
                                  onChange: (e) => handleDrawingBackgroundUploadSubPart(e, index, partIndex)
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-10 px-3 inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 text-sm font-medium hover:bg-neutral-900/90 dark:hover:bg-neutral-100/90", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
                                "Upload"
                              ] })
                            ] })
                          ] }),
                          part.drawingBackgroundUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "img",
                              {
                                src: part.drawingBackgroundUrl,
                                alt: "Drawing background preview",
                                className: "h-16 rounded border"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                size: "sm",
                                variant: "ghost",
                                className: "text-red-500",
                                onClick: () => updateSubPart(index, partIndex, "drawingBackgroundUrl", void 0),
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "If set, this image will be the background for the drawing canvas." })
                        ] }),
                        (part.inputStyle === "webpage-wireframe" || part.inputStyle === "form-wireframe") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center flex-wrap gap-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Example Drawing (for AI grading)" }),
                            part.inputConfig?.wireframeExampleData && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Button,
                              {
                                size: "sm",
                                variant: "outline",
                                className: "text-red-500 hover:text-red-600",
                                onClick: () => {
                                  updateSubPart(index, partIndex, "inputConfig", {
                                    ...part.inputConfig || {},
                                    wireframeExampleData: void 0,
                                    wireframeExampleCanvas: void 0
                                  });
                                },
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3 mr-1" }),
                                  " Clear"
                                ]
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Draw an example for the AI to compare against student answers." }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            DiagramEditor,
                            {
                              initialData: part.inputConfig?.wireframeExampleData,
                              initialDrawing: part.inputConfig?.wireframeExampleCanvas,
                              backgroundUrl: part.drawingBackgroundUrl,
                              onChange: (dataStr, drawingStr) => {
                                updateSubPart(index, partIndex, "inputConfig", {
                                  ...part.inputConfig || {},
                                  wireframeExampleData: dataStr,
                                  wireframeExampleCanvas: drawingStr
                                });
                              },
                              mode: part.inputStyle === "form-wireframe" ? "form-wireframe" : "webpage-wireframe"
                            }
                          )
                        ] })
                      ] })
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center my-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      variant: "ghost",
                      size: "sm",
                      className: "h-6 text-xs text-neutral-400 hover:text-neutral-600",
                      onClick: () => insertSubPartAfter(index, partIndex),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlus, { className: "h-3 w-3 mr-1" }),
                        " Insert sub-question here"
                      ]
                    }
                  ) })
                ] }, part.id || partIndex)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-400 ml-4", children: "No sub-questions. Use sub-questions for parts like (a)(i), (a)(ii), etc." })
              ] })
            ] })
          ] })
        ] }, subQ.id || index)) }),
        formData.subQuestions.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg text-neutral-400", children: 'No questions added yet. Click "Add Question" to get started.' })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showPreview, onOpenChange: setShowPreview, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Student Preview" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200", children: formData.year }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-neutral-900 dark:text-white", children: formData.title })
        ] }),
        formData.scenario && (formData.scenario.contentBlocks?.length || formData.scenario.text || formData.scenario.imageUrl || formData.scenario.codeSnippet) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 p-6 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3", children: "Scenario" }),
          formData.scenario.contentBlocks && formData.scenario.contentBlocks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: formData.scenario.contentBlocks.map((block) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            block.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap ${block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left"}`, children: block.content }),
            block.type === "image" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
              "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
              block.imageSize === "xs" && "max-w-[150px]",
              block.imageSize === "small" && "max-w-xs",
              block.imageSize === "medium" && "max-w-md",
              block.imageSize === "large" && "max-w-xl",
              block.imageSize === "xl" && "max-w-2xl",
              block.imageSize === "2xl" && "max-w-4xl",
              block.imageSize === "full" && "w-full",
              !block.imageSize && "max-w-md"
            ), children: [
              block.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 dark:text-neutral-400 text-center mb-2", children: block.caption }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: block.content, alt: block.caption || "Scenario image", className: "max-w-full h-auto object-contain" })
            ] }),
            block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-900 p-4 rounded-lg font-mono text-sm text-neutral-300 overflow-x-auto border border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { children: block.content }) }),
            block.type === "code-table" && block.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: block.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-neutral-900 p-4 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0", children: section.code })
            ] }, section.id || sIdx)) }),
            block.type === "pseudocode" && block.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
            ] }, line.id || idx)) }) }),
            block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono", children: block.dataTable.tableName }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: block.dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0", children: col.header }, col.id)) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-neutral-300 dark:border-neutral-700", children: row.cells.map((cell, cellIndex) => {
                  const cellRole = getCellRole(cell);
                  const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                  return /* @__PURE__ */ jsxRuntimeExports.jsx(
                    CellTag,
                    {
                      className: cn(
                        "px-4 py-2 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                        cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                        cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                      ),
                      children: getCellValue(cell)
                    },
                    cellIndex
                  );
                }) }, row.id)) })
              ] })
            ] }),
            block.type === "row-layout" && block.children && /* @__PURE__ */ jsxRuntimeExports.jsx(RowLayout, { children: block.children.map((child, childIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(RowLayoutItem, { children: [
              child.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap ${child.textAlign === "center" ? "text-center" : child.textAlign === "right" ? "text-right" : "text-left"}`, children: child.content }),
              child.type === "image" && child.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
                child.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 dark:text-neutral-400 text-center mb-2", children: child.caption }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: child.content, alt: child.caption || "Image", className: "max-w-full h-auto object-contain rounded" })
              ] }),
              child.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-900 p-3 rounded-lg font-mono text-sm text-neutral-300 overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { children: child.content }) }),
              child.type === "pseudocode" && child.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: child.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
              ] }, line.id || idx)) }) }),
              child.type === "code-table" && child.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: child.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-3 py-2 font-semibold text-sm border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-900 text-neutral-100 p-3 text-sm font-mono overflow-x-auto", children: section.code })
              ] }, section.id || sIdx)) }),
              child.type === "data-table" && child.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveDataTable, { dataTable: child.dataTable }),
              child.type === "database-schema" && child.databaseSchema && /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema: child.databaseSchema })
            ] }, child.id || childIdx)) })
          ] }, block.id)) }) : (
            /* Legacy fallback */
            /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              formData.scenario.text && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-neutral-700 dark:text-neutral-300 mb-4 leading-relaxed whitespace-pre-wrap", children: formData.scenario.text }),
              formData.scenario.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center mx-auto max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: formData.scenario.imageUrl, alt: "Scenario Illustration", className: "max-w-full h-auto max-h-[600px] object-contain" }) }),
              formData.scenario.preCodeText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap", children: formData.scenario.preCodeText }),
              formData.scenario.codeSnippet && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-900 p-4 rounded-lg font-mono text-sm text-neutral-300 overflow-x-auto border border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { children: formData.scenario.codeSnippet }) }),
              formData.scenario.postImageText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap", children: formData.scenario.postImageText })
            ] })
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-8", children: formData.subQuestions.map((subQ) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-neutral-100 dark:border-neutral-800 pt-6 first:border-0 first:pt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 mb-4", children: [
          subQ.label && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold text-neutral-900 dark:text-white", children: subQ.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-between items-start", children: subQ.maxMarks > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300", children: [
              subQ.maxMarks,
              " ",
              subQ.maxMarks === 1 ? "Mark" : "Marks"
            ] }) }),
            subQ.contentBlocks && subQ.contentBlocks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4 my-4", children: subQ.contentBlocks.map((block) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              block.type === "text" && (block.hasBorder ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
                "border border-neutral-300 dark:border-neutral-600 rounded-lg p-4",
                block.borderWidth === "xs" && "max-w-[200px]",
                block.borderWidth === "sm" && "max-w-xs",
                (!block.borderWidth || block.borderWidth === "md") && "max-w-md",
                block.borderWidth === "lg" && "max-w-lg",
                block.borderWidth === "xl" && "max-w-xl",
                block.borderWidth === "full" && "w-full",
                block.textAlign === "center" && "text-center",
                block.textAlign === "right" && "text-right"
              ), children: /* @__PURE__ */ jsxRuntimeExports.jsx(RichTextDisplay, { content: block.content, className: "text-lg font-medium text-neutral-900 dark:text-white leading-relaxed" }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RichTextDisplay, { content: block.content, className: cn(
                "text-lg font-medium text-neutral-900 dark:text-white leading-relaxed",
                block.textAlign === "center" && "text-center",
                block.textAlign === "right" && "text-right"
              ) })),
              block.type === "image" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
                "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                block.imageSize === "small" && "max-w-xs",
                block.imageSize === "medium" && "max-w-md",
                block.imageSize === "large" && "max-w-2xl",
                block.imageSize === "full" && "w-full",
                !block.imageSize && "max-w-md"
              ), children: [
                block.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 dark:text-neutral-400 text-center mb-2", children: block.caption }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: block.content, alt: block.caption || "Question image", className: "max-w-full h-auto object-contain" })
              ] }),
              block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-sm text-green-400 font-mono whitespace-pre-wrap", children: block.content }) }),
              block.type === "code-table" && block.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: block.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-neutral-900 p-4 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0", children: section.code })
              ] }, section.id || sIdx)) }),
              block.type === "pseudocode" && block.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
              ] }, line.id || idx)) }) }),
              block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono", children: block.dataTable.tableName }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: block.dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0", children: col.header }, col.id)) }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-neutral-300 dark:border-neutral-700", children: row.cells.map((cell, cellIndex) => {
                    if (isCellHidden(cell)) return null;
                    const cellRole = getCellRole(cell);
                    const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                    const colSpan = getCellColSpan(cell);
                    const rowSpan = getCellRowSpan(cell);
                    return /* @__PURE__ */ jsxRuntimeExports.jsx(
                      CellTag,
                      {
                        colSpan: colSpan > 1 ? colSpan : void 0,
                        rowSpan: rowSpan > 1 ? rowSpan : void 0,
                        className: cn(
                          "px-4 py-2 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                          cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                          cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                        ),
                        children: getCellValue(cell)
                      },
                      cellIndex
                    );
                  }) }, row.id)) })
                ] })
              ] }),
              block.type === "row-layout" && block.children && /* @__PURE__ */ jsxRuntimeExports.jsx(RowLayout, { children: block.children.map((child, childIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(RowLayoutItem, { children: [
                child.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx(RichTextDisplay, { content: child.content, className: "text-neutral-900 dark:text-white leading-relaxed" }),
                child.type === "image" && child.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
                  child.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 dark:text-neutral-400 text-center mb-2", children: child.caption }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: child.content, alt: child.caption || "Image", className: "max-w-full h-auto object-contain rounded" })
                ] }),
                child.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-900 p-3 rounded-lg font-mono text-sm text-neutral-300 overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { children: child.content }) }),
                child.type === "pseudocode" && child.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: child.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
                ] }, line.id || idx)) }) }),
                child.type === "code-table" && child.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: child.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-3 py-2 font-semibold text-sm border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-900 text-neutral-100 p-3 text-sm font-mono overflow-x-auto", children: section.code })
                ] }, section.id || sIdx)) }),
                child.type === "data-table" && child.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveDataTable, { dataTable: child.dataTable }),
                child.type === "database-schema" && child.databaseSchema && /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema: child.databaseSchema })
              ] }, child.id || childIdx)) })
            ] }, block.id)) }) : (
              /* Legacy content */
              /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                subQ.questionText && /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap my-4", children: subQ.questionText }),
                subQ.imageUrl && subQ.inputStyle !== "drawing" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center mx-auto max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: subQ.imageUrl, alt: "Question Illustration", className: "max-w-full h-auto max-h-[600px] object-contain" }) }) }),
                subQ.preCodeText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-4 text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap", children: subQ.preCodeText }),
                subQ.codeSnippet && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-4 p-4 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-sm text-green-400 font-mono whitespace-pre-wrap", children: subQ.codeSnippet }) }),
                subQ.imageCaption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "my-4 text-base text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap", children: subQ.imageCaption })
              ] })
            ),
            subQ.maxMarks > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-neutral-500 dark:text-neutral-400 italic text-center", children: [
              "Student input area (",
              subQ.inputStyle || "text",
              ")"
            ] }) }),
            subQ.subParts && subQ.subParts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 ml-4 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700 space-y-6", children: subQ.subParts.map((part) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
              part.label && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base font-bold text-neutral-800 dark:text-neutral-200", children: part.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-between items-start", children: part.maxMarks > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300", children: [
                  part.maxMarks,
                  " ",
                  part.maxMarks === 1 ? "Mark" : "Marks"
                ] }) }),
                part.contentBlocks && part.contentBlocks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 my-3", children: part.contentBlocks.map((block) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  block.type === "text" && (block.hasBorder ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
                    "border border-neutral-300 dark:border-neutral-600 rounded-lg p-3",
                    block.borderWidth === "xs" && "max-w-[150px]",
                    block.borderWidth === "sm" && "max-w-xs",
                    (!block.borderWidth || block.borderWidth === "md") && "max-w-md",
                    block.borderWidth === "lg" && "max-w-lg",
                    block.borderWidth === "xl" && "max-w-xl",
                    block.borderWidth === "full" && "w-full",
                    block.textAlign === "center" && "text-center",
                    block.textAlign === "right" && "text-right"
                  ), children: /* @__PURE__ */ jsxRuntimeExports.jsx(RichTextDisplay, { content: block.content, className: "text-base text-neutral-900 dark:text-white leading-relaxed" }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RichTextDisplay, { content: block.content, className: cn(
                    "text-base text-neutral-900 dark:text-white leading-relaxed",
                    block.textAlign === "center" && "text-center",
                    block.textAlign === "right" && "text-right"
                  ) })),
                  block.type === "image" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
                    "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                    block.imageSize === "small" && "max-w-xs",
                    block.imageSize === "medium" && "max-w-md",
                    block.imageSize === "large" && "max-w-2xl",
                    block.imageSize === "full" && "w-full",
                    !block.imageSize && "max-w-md"
                  ), children: [
                    block.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 dark:text-neutral-400 text-center mb-1", children: block.caption }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: block.content, alt: block.caption || "Question image", className: "max-w-full h-auto object-contain" })
                  ] }),
                  block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-sm text-green-400 font-mono whitespace-pre-wrap", children: block.content }) }),
                  block.type === "code-table" && block.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden text-sm", children: block.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-3 py-1.5 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-neutral-900 p-3 font-mono text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0", children: section.code })
                  ] }, section.id || sIdx)) }),
                  block.type === "pseudocode" && block.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-3 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
                  ] }, line.id || idx)) }) }),
                  block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-3 py-1.5 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono", children: block.dataTable.tableName }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: block.dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-1.5 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0", children: col.header }, col.id)) }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-neutral-300 dark:border-neutral-700", children: row.cells.map((cell, cellIndex) => {
                        if (isCellHidden(cell)) return null;
                        const cellRole = getCellRole(cell);
                        const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                        const colSpan = getCellColSpan(cell);
                        const rowSpan = getCellRowSpan(cell);
                        return /* @__PURE__ */ jsxRuntimeExports.jsx(
                          CellTag,
                          {
                            colSpan: colSpan > 1 ? colSpan : void 0,
                            rowSpan: rowSpan > 1 ? rowSpan : void 0,
                            className: cn(
                              "px-3 py-1.5 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                              cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                              cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                            ),
                            children: getCellValue(cell)
                          },
                          cellIndex
                        );
                      }) }, row.id)) })
                    ] })
                  ] }),
                  block.type === "row-layout" && block.children && /* @__PURE__ */ jsxRuntimeExports.jsx(RowLayout, { children: block.children.map((child, childIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(RowLayoutItem, { children: [
                    child.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap ${child.textAlign === "center" ? "text-center" : child.textAlign === "right" ? "text-right" : "text-left"}`, children: child.content }),
                    child.type === "image" && child.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
                      child.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 dark:text-neutral-400 text-center mb-1", children: child.caption }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: child.content, alt: child.caption || "Image", className: "max-w-full h-auto object-contain rounded" })
                    ] }),
                    child.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-900 p-2 rounded-lg font-mono text-xs text-neutral-300 overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { children: child.content }) }),
                    child.type === "pseudocode" && child.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: child.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-3 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
                    ] }, line.id || idx)) }) }),
                    child.type === "code-table" && child.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: child.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-2 py-1 font-semibold text-xs border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-900 text-neutral-100 p-2 text-xs font-mono overflow-x-auto", children: section.code })
                    ] }, section.id || sIdx)) }),
                    child.type === "data-table" && child.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveDataTable, { dataTable: child.dataTable }),
                    child.type === "database-schema" && child.databaseSchema && /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema: child.databaseSchema })
                  ] }, child.id || childIdx)) })
                ] }, block.id)) }) : (
                  /* Legacy content for sub-parts */
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    part.questionText && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap my-3", children: part.questionText }),
                    part.imageUrl && part.inputStyle !== "drawing" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center mx-auto max-w-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: part.imageUrl, alt: "Question Illustration", className: "max-w-full h-auto max-h-[400px] object-contain" }) }) }),
                    part.preCodeText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-3 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap", children: part.preCodeText }),
                    part.codeSnippet && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-3 p-3 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-sm text-green-400 font-mono whitespace-pre-wrap", children: part.codeSnippet }) }),
                    part.imageCaption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "my-3 text-sm text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap", children: part.imageCaption })
                  ] })
                ),
                part.maxMarks > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-neutral-500 dark:text-neutral-400 italic text-center", children: [
                  "Student input area (",
                  part.inputStyle || "text",
                  ")"
                ] }) })
              ] })
            ] }) }, part.id)) })
          ] })
        ] }) }, subQ.id)) }),
        formData.subQuestions.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-neutral-400", children: "No questions added yet." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DataTableEditorModal,
      {
        open: dataTableModalOpen,
        onOpenChange: setDataTableModalOpen,
        dataTable: (() => {
          if (!editingDataTable) return null;
          if (editingDataTable.type === "scenario") {
            const block = formData.scenario?.contentBlocks?.[editingDataTable.blockIndex];
            return block?.dataTable || null;
          }
          if (editingDataTable.type === "subQuestion" && editingDataTable.subIndex !== void 0) {
            const subQ = formData.subQuestions[editingDataTable.subIndex];
            const block = subQ?.contentBlocks?.[editingDataTable.blockIndex];
            return block?.dataTable || null;
          }
          if (editingDataTable.type === "subPart" && editingDataTable.subIndex !== void 0 && editingDataTable.partIndex !== void 0) {
            const subQ = formData.subQuestions[editingDataTable.subIndex];
            const part = subQ?.subParts?.[editingDataTable.partIndex];
            const block = part?.contentBlocks?.[editingDataTable.blockIndex];
            return block?.dataTable || null;
          }
          return null;
        })(),
        onSave: (updatedTable) => {
          if (!editingDataTable) return;
          if (editingDataTable.type === "scenario") {
            const blocks = [...formData.scenario?.contentBlocks || []];
            blocks[editingDataTable.blockIndex] = {
              ...blocks[editingDataTable.blockIndex],
              dataTable: updatedTable
            };
            setFormData((prev) => ({
              ...prev,
              scenario: {
                text: prev.scenario?.text || "",
                ...prev.scenario,
                contentBlocks: blocks
              }
            }));
          }
          if (editingDataTable.type === "subQuestion" && editingDataTable.subIndex !== void 0) {
            const subIndex = editingDataTable.subIndex;
            const blockIndex = editingDataTable.blockIndex;
            setFormData((prev) => {
              const updatedSubQuestions = [...prev.subQuestions];
              const blocks = [...updatedSubQuestions[subIndex]?.contentBlocks || []];
              blocks[blockIndex] = {
                ...blocks[blockIndex],
                dataTable: updatedTable
              };
              updatedSubQuestions[subIndex] = {
                ...updatedSubQuestions[subIndex],
                contentBlocks: blocks
              };
              return { ...prev, subQuestions: updatedSubQuestions };
            });
          }
          if (editingDataTable.type === "subPart" && editingDataTable.subIndex !== void 0 && editingDataTable.partIndex !== void 0) {
            const subIndex = editingDataTable.subIndex;
            const partIndex = editingDataTable.partIndex;
            const blockIndex = editingDataTable.blockIndex;
            setFormData((prev) => {
              const updatedSubQuestions = [...prev.subQuestions];
              const parts = [...updatedSubQuestions[subIndex]?.subParts || []];
              const blocks = [...parts[partIndex]?.contentBlocks || []];
              blocks[blockIndex] = {
                ...blocks[blockIndex],
                dataTable: updatedTable
              };
              parts[partIndex] = { ...parts[partIndex], contentBlocks: blocks };
              updatedSubQuestions[subIndex] = { ...updatedSubQuestions[subIndex], subParts: parts };
              return { ...prev, subQuestions: updatedSubQuestions };
            });
          }
          setDataTableModalOpen(false);
          setEditingDataTable(null);
        }
      }
    )
  ] });
}
export {
  QuestionEditor as default
};
//# sourceMappingURL=QuestionEditor-lHBD1O03.js.map
