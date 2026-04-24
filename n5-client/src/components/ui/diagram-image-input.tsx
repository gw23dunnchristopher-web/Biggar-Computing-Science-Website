import { ImagePasteInput } from "@/components/ui/image-paste-input";

interface DiagramImageInputProps {
  value: string;
  onChange: (value: string) => void;
  startingImageUrl?: string;
  placeholder?: string;
  hint?: string;
}

const DIAGRAM_HINTS: Record<string, string> = {
  drawing: "Create your diagram in another application (e.g. Google Slides, draw.io, or paper), take a screenshot, then paste it below.",
  "erd-annotation": "Draw your Entity-Relationship Diagram in another application, screenshot it, then paste it below.",
  "nav-structure": "Draw your navigation structure diagram in another application, screenshot it, then paste it below.",
  "nav-structure-higher": "Draw your navigation structure diagram in another application, screenshot it, then paste it below.",
  "structure-dataflow": "Draw your structure/data-flow diagram in another application, screenshot it, then paste it below.",
  "form-wireframe": "Design your form wireframe in another application, screenshot it, then paste it below.",
  "webpage-wireframe": "Design your webpage wireframe in another application, screenshot it, then paste it below.",
  "structure-diagram": "Draw your structure diagram in another application, screenshot it, then paste it below.",
  "image-paste": "Draw your answer in another application (or on paper and photograph it), then paste the image below.",
};

export function DiagramImageInput({ value, onChange, startingImageUrl, placeholder, hint }: DiagramImageInputProps) {
  return (
    <ImagePasteInput
      value={value}
      onChange={onChange}
      startingImage={startingImageUrl}
      instructions={hint || placeholder}
    />
  );
}

export { DIAGRAM_HINTS };
