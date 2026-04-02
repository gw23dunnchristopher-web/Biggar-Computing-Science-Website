export type Topic = "sdcs" | "dd" | "wd";

// Content block types for flexible question building
export type ContentBlockType = "text" | "image" | "code" | "pseudocode" | "code-table" | "data-table" | "database-schema" | "row-layout" | "heading";
export type ImageSize = "xs" | "small" | "medium" | "large" | "xl" | "2xl" | "full";

// Code section for code-table blocks
export interface CodeSection {
  id: string;
  label: string; // e.g., "JavaScript Code", "CSS Code", "HTML Code"
  code: string;
}

// Pseudocode line for pseudocode blocks (table with line numbers)
export interface PseudocodeLine {
  id: string;
  lineLabel: string; // e.g., "Line 1", "1.", "1.1"
  content: string; // The pseudocode content for this line
}

// Data table for displaying database-style tables in scenarios/questions
export type DataTableColumnConstraint = "pk-fk" | "type" | "number-only" | "y-n";

export interface DataTableColumn {
  id: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  constraint?: DataTableColumnConstraint;
}

// Cell type for data tables with optional merging and role support
export type DataTableCellRole = "data" | "header" | "title";

export interface DataTableCell {
  value: string;
  role?: DataTableCellRole; // "data" (default), "header", or "title" (merged header spanning columns)
  colSpan?: number; // Number of columns this cell spans (default: 1)
  rowSpan?: number; // Number of rows this cell spans (default: 1)
  hidden?: boolean; // True if this cell is covered by a merged cell above/left
}

export interface DataTableRow {
  id: string;
  cells: (string | DataTableCell)[]; // Values for each column - supports both string and cell objects
}

export type DataTableVerticalAlign = "top" | "middle" | "bottom";

export interface DataTable {
  tableName?: string; // Optional table name (e.g., "CUSTOMER", "ORDER")
  columns: DataTableColumn[];
  rows: DataTableRow[];
  centered?: boolean; // Center-align all data cells
  hideHeaders?: boolean; // Hide the column headers row
  verticalAlign?: DataTableVerticalAlign; // Vertical cell alignment
}

// Database schema for database design questions
export interface DatabaseSchemaField {
  id: string;
  name: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
}

export interface DatabaseSchemaTable {
  id: string;
  name: string;
  fields: DatabaseSchemaField[];
}

export interface DatabaseSchema {
  tables: DatabaseSchemaTable[];
}

export type BorderWidth = "xs" | "sm" | "md" | "lg" | "xl" | "full";

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string; // For text: the text content; for image: URL/base64; for code: the code snippet
  caption?: string; // Optional caption (mainly for images)
  textAlign?: "left" | "center" | "right"; // Text alignment for text blocks
  imageSize?: ImageSize; // Image display size (small, medium, large, full)
  codeSections?: CodeSection[]; // For code-table blocks: array of labeled code sections
  dataTable?: DataTable; // For data-table blocks: structured table data
  databaseSchema?: DatabaseSchema; // For database-schema blocks: schema with tables and fields
  pseudocodeLines?: PseudocodeLine[]; // For pseudocode blocks: lines with labels and content
  children?: ContentBlock[]; // For row-layout blocks: child blocks to display side-by-side
  hasBorder?: boolean; // Whether to display a border around the text block
  borderWidth?: BorderWidth; // Width of bordered text block (xs, sm, md, lg, xl, full)
}

export interface SubQuestion {
  id: string;
  label?: string; // e.g., "(a)", "(b)(i)"
  questionText: string; // Legacy field - kept for backwards compatibility
  contentBlocks?: ContentBlock[]; // New flexible content system
  maxMarks: number;
  imageUrl?: string; // Legacy field
  imageCaption?: string; // Legacy field
  drawingBackgroundUrl?: string; // Separate background image for drawing/annotation questions
  preCodeText?: string; // Legacy field
  codeSnippet?: string; // Legacy field
  markingScheme: string[];
  acceptedAnswers?: string[];
  keywords?: string[];
  aiGuidance?: string; // Additional guidance for AI marking (e.g., answers to reject, special instructions)
  inputStyle?: "text" | "table" | "labeled-inputs" | "code-editor" | "drawing" | "design-choice" | "fill-in-blanks" | "info-only" | "erd-annotation" | "nav-structure" | "nav-structure-higher" | "tag-matching" | "structure-dataflow" | "form-wireframe" | "webpage-wireframe" | "structure-diagram" | "entity-occurrence-diagram" | "database-schema";
  codeRequirement?: "programming-language" | "design-notation" | "either";
  // Nested sub-questions (e.g., a) with (i), (ii), (iii) under it)
  subParts?: SubQuestion[];
  inputConfig?: {
    headers?: string[];
    rows?: Array<{ label: string; value?: string; isInput?: boolean; key?: string; width?: string; placeholder?: string; multiline?: boolean }>;
    fields?: Array<{ label: string; key: string }>;
    codeTemplate?: string; // Code with {{blank_1}}, {{blank_2}} placeholders for fill-in-blanks
    blanks?: Array<{ key: string; answer: string; hint?: string; width?: number }>; // Expected answers for each blank
    starterCode?: string; // Pre-filled code for code-editor questions that students complete
    // Column-based table: each column has a header and input below it (e.g., input/process/output)
    columns?: Array<{ header: string; key: string; width?: string; placeholder?: string }>;
    // Multi-row column table: headers with multiple input rows below
    inputRows?: number; // Number of input rows for column-based tables
    // Flexible grid table: full control over each cell
    grid?: {
      headers: string[];
      rows: Array<{
        cells: Array<{ value?: string; isInput?: boolean; key?: string; width?: string; placeholder?: string; multiline?: boolean }>;
      }>;
    };
    // ERD annotation: base diagram and attributes that can be marked
    baseErdDiagram?: string; // JSON string of DiagramItem[] - the teacher's drawn ERD
    correctErdDiagram?: string; // JSON string of DiagramItem[] - the correct ERD with proper markings (for AI grading reference)
    erdAttributes?: Array<{
      id: string; // Maps to a shape ID in baseErdDiagram
      entityName: string;
      attributeName: string;
      correctMarking: "primary" | "foreign" | "none";
    }>;
    // Required additions that students must add to the ERD
    erdRequiredAttributes?: Array<{
      attributeName: string; // The attribute name student should add (case-insensitive match)
      nearEntityName?: string; // Optional: which entity it should be near
    }>;
    erdRequiredLines?: Array<{
      entity1: string; // First entity name
      entity2: string; // Second entity name
    }>;
    erdRequiredCrowfootLines?: Array<{
      entity1: string; // "One" side entity
      entity2: string; // "Many" side entity
    }>;
    // Navigation structure: optional base diagram for students to complete
    baseNavDiagram?: string; // JSON string of DiagramItem[] - the teacher's drawn navigation structure
    // Navigation structure (N5): example answer for AI grading
    navExampleData?: string; // JSON string of DiagramItem[] - the expected answer for AI grading
    navExampleCanvas?: string; // Data URL of the expected answer canvas drawing
    // Navigation structure (Advanced): solution diagram for AI grading
    solutionNavDiagram?: string; // JSON string of DiagramItem[] - the expected solution for AI grading
    // Structure diagram: solution diagram for AI grading
    solutionStructureDiagram?: string; // JSON string of DiagramItem[] - the expected solution for AI grading
    // Structure dataflow: teacher draws structure diagram, students annotate with dataflow arrows
    baseStructureDiagram?: string; // JSON string of DiagramItem[] - the teacher's drawn structure diagram with function boxes
    structureDataflowRequirements?: Array<{
      functionName: string; // Name of the function (content of the box)
      expectedInputs?: string[]; // Variable names expected to be passed IN (up arrows)
      expectedOutputs?: string[]; // Variable names expected to be passed OUT (down arrows)
    }>;
    // Tag matching: source tags and target zones
    tagMatchingConfig?: {
      sourceTags: Array<{
        id: string;
        label: string; // The tag text (e.g., "<h1>", "<nav>")
        x: number; // Position on canvas
        y: number;
      }>;
      targetZones: Array<{
        id: string;
        label: string; // Zone name for reference (e.g., "Header area")
        x: number; // Zone top-left corner
        y: number;
        width: number;
        height: number;
        correctTagId: string; // ID of the tag that should connect here
      }>;
    };
    // Form wireframe: students draw a form/wireframe for a webpage
    formWireframeExpectations?: Array<{
      fieldType: "text-input" | "textarea" | "dropdown" | "radio-group" | "checkbox" | "submit-button" | "label";
      labelText?: string; // Expected label text (fuzzy match)
      required?: boolean; // Whether the field should be marked as required
      options?: string[]; // For dropdown/radio: expected options
      groupName?: string; // For radio buttons: the group name
      validationMin?: number; // Min value for validation rules
      validationMax?: number; // Max value for validation rules
      validationMessage?: string; // Custom validation message
    }>;
    wireframeExampleData?: string;
    wireframeExampleCanvas?: string;
    // Entity occurrence diagram: students draw entity ovals with occurrences inside
    baseEntityOccurrenceDiagram?: string; // JSON string of DiagramItem[] - optional teacher-provided base diagram
    solutionEntityOccurrenceDiagram?: string; // JSON string of DiagramItem[] - teacher's solution for AI grading
    // Database schema diagram: tables with fields marked as primary/foreign keys
    databaseSchema?: {
      tables: Array<{
        id: string;
        name: string; // Table name (e.g., "Customer", "Order")
        fields: Array<{
          id: string;
          name: string; // Field name (e.g., "customerID", "forename")
          isPrimaryKey?: boolean; // Underlined in display
          isForeignKey?: boolean; // Shows asterisk (*) in display
        }>;
      }>;
    };
  };
}

export interface Question {
  id: string;
  year: number;
  topic: Topic;
  title: string; // e.g., "Question 4"
  isPractice?: boolean; // True if this is a practice question not from a past paper
  isQuizOnly?: boolean; // True if this question is only for custom quizzes (not visible in main question bank)
  isAdditionalExam?: boolean; // True if this is an additional exam question (not a past paper, no year)
  additionalPaperId?: string | null; // ID of the additional paper this question belongs to
  scenario?: {
    text: string; // Legacy field
    contentBlocks?: ContentBlock[]; // New flexible content system
    imageUrl?: string; // Legacy field
    preCodeText?: string; // Legacy field
    codeSnippet?: string; // Legacy field
    postImageText?: string; // Legacy field
  };
  subQuestions: SubQuestion[];
}

export const TOPICS: { id: Topic; name: string; description: string; icon: string }[] = [
  {
    id: "sdcs",
    name: "Software Development and Computer Systems",
    description: "Programming, algorithms, data types, computer architecture, and security.",
    icon: "code"
  },
  {
    id: "dd",
    name: "Database Design and Development",
    description: "SQL, entity relationships, and database structures.",
    icon: "database"
  },
  {
    id: "wd",
    name: "Web Design and Development",
    description: "HTML, CSS, JavaScript, and UI/UX principles.",
    icon: "globe"
  },
];

export const PAST_PAPERS: Question[] = [
  // N5 Level questions will be added through the Teacher Dashboard
];
