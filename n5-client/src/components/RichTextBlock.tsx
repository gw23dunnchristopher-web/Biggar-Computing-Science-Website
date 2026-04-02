import DOMPurify from "dompurify";

function decodeAndSanitize(raw: string): { html: string; isHtml: boolean } {
  let content = raw;
  if (/&lt;[a-z/]/i.test(content)) {
    const tmp = document.createElement("textarea");
    tmp.innerHTML = content;
    content = tmp.value;
  }
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  if (isHtml) {
    const processed = content.replace(/<p><\/p>/g, "<p>&nbsp;</p>");
    return { html: DOMPurify.sanitize(processed), isHtml: true };
  }
  return { html: content, isHtml: false };
}

export default function RichTextBlock({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const { html, isHtml } = decodeAndSanitize(content);

  if (isHtml) {
    return (
      <div
        className={`rich-text-content ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  const paragraphs = html.split(/\n\n/);
  return (
    <div className={`rich-text-content ${className}`.trim()}>
      {paragraphs.map((para, i) => (
        <p key={i}>
          {para.split(/\n/).map((line, j, arr) => (
            <span key={j}>
              {line || "\u00A0"}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
