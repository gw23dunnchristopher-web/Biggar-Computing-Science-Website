import jsPDF from "jspdf";

interface PDFBreakdownItem {
  questionTitle: string;
  subLabel?: string;
  questionText?: string;
  maxMarks: number;
  score: number;
  userAnswer: string;
  feedback?: string;
  suggestions?: string;
}

interface PDFData {
  title: string;
  subtitle?: string;
  date: string;
  totalScore: number;
  maxScore: number;
  grade: string;
  percentage: number;
  breakdown: PDFBreakdownItem[];
}

function wrapText(doc: jsPDF, text: string, x: number, maxWidth: number, lineHeight: number): { lines: string[]; height: number } {
  const lines = doc.splitTextToSize(text, maxWidth);
  return { lines, height: lines.length * lineHeight };
}

function addPageIfNeeded(doc: jsPDF, y: number, needed: number, margin: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - margin) {
    doc.addPage();
    return margin + 10;
  }
  return y;
}

export function generateResultsPDF(data: PDFData) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  doc.text(data.title, pageWidth / 2, y, { align: "center" });
  y += 8;

  if (data.subtitle) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(data.subtitle, pageWidth / 2, y, { align: "center" });
    y += 6;
  }

  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(data.date, pageWidth / 2, y, { align: "center" });
  y += 12;

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, "F");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const gradeColor = data.grade === "A" ? [22, 163, 74] :
    data.grade === "B" ? [37, 99, 235] :
    data.grade === "C" ? [202, 138, 4] :
    data.grade === "D" ? [234, 88, 12] : [107, 114, 128];
  doc.setTextColor(gradeColor[0], gradeColor[1], gradeColor[2]);
  doc.text(`Grade: ${data.grade}`, margin + 8, y + 10);

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`${data.totalScore} / ${data.maxScore} marks (${data.percentage}%)`, margin + 8, y + 20);

  const barX = pageWidth / 2 + 10;
  const barW = contentWidth / 2 - 18;
  const barH = 6;
  const barY = y + 11;
  doc.setFillColor(220, 220, 220);
  doc.roundedRect(barX, barY, barW, barH, 2, 2, "F");
  const fillW = Math.max(0, (data.percentage / 100) * barW);
  if (fillW > 0) {
    doc.setFillColor(gradeColor[0], gradeColor[1], gradeColor[2]);
    doc.roundedRect(barX, barY, fillW, barH, 2, 2, "F");
  }

  y += 36;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Question Breakdown", margin, y);
  y += 8;

  const lineH = 4.5;

  for (const item of data.breakdown) {
    const label = item.subLabel
      ? `${item.questionTitle} - Part ${item.subLabel}`
      : item.questionTitle;

    const answerText = item.userAnswer || "No answer provided";
    const answerWrapped = wrapText(doc, answerText, 0, contentWidth - 10, lineH);
    const feedbackWrapped = item.feedback ? wrapText(doc, item.feedback, 0, contentWidth - 10, lineH) : null;
    const suggestionsWrapped = item.suggestions ? wrapText(doc, item.suggestions, 0, contentWidth - 10, lineH) : null;

    y = addPageIfNeeded(doc, y, 20, margin);

    const statusColor = item.score === item.maxMarks ? [22, 163, 74] :
      item.score > 0 ? [202, 138, 4] : [220, 38, 38];
    doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin, y + 2);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(label, margin + 4, y + 1);

    const scoreText = `${item.score} / ${item.maxMarks}`;
    doc.setFontSize(9);
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(scoreText, pageWidth - margin, y + 1, { align: "right" });
    y += 7;

    if (item.questionText) {
      const qWrapped = wrapText(doc, item.questionText, 0, contentWidth - 10, lineH);
      y = addPageIfNeeded(doc, y, qWrapped.height + 4, margin);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(qWrapped.lines, margin + 5, y);
      y += qWrapped.height + 3;
    }

    y = addPageIfNeeded(doc, y, answerWrapped.height + 8, margin);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(140, 100, 20);
    doc.text("Your Answer:", margin + 5, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(answerWrapped.lines, margin + 5, y);
    y += answerWrapped.height + 3;

    if (feedbackWrapped) {
      y = addPageIfNeeded(doc, y, feedbackWrapped.height + 8, margin);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 80, 160);
      doc.text("Feedback:", margin + 5, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(feedbackWrapped.lines, margin + 5, y);
      y += feedbackWrapped.height + 3;
    }

    if (suggestionsWrapped) {
      y = addPageIfNeeded(doc, y, suggestionsWrapped.height + 8, margin);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 100, 22);
      doc.text("How to Improve:", margin + 5, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(suggestionsWrapped.lines, margin + 5, y);
      y += suggestionsWrapped.height + 3;
    }

    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(margin + 5, y, pageWidth - margin - 5, y);
    y += 5;
  }

  y = addPageIfNeeded(doc, y, 15, margin);
  doc.setFontSize(7);
  doc.setTextColor(170, 170, 170);
  doc.text("Generated by Higher Computing Science Revision Platform", pageWidth / 2, y + 5, { align: "center" });

  const safeTitle = data.title.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`${safeTitle}_Results.pdf`);
}

export type { PDFData, PDFBreakdownItem };
