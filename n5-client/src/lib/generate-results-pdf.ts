import jsPDF from "jspdf";

interface PDFBreakdownItem {
  label: string;
  questionText?: string;
  maxMarks: number;
  score: number;
  userAnswer: string;
  feedback?: string;
  suggestions?: string;
}

interface PDFResultData {
  title: string;
  studentName: string;
  date: string;
  totalScore: number;
  maxScore: number;
  breakdown: PDFBreakdownItem[];
  questionLabel?: string;
}

function getGradeInfo(pct: number): { grade: string; color: [number, number, number]; bgColor: [number, number, number] } {
  if (pct >= 70) return { grade: "A", color: [22, 163, 74], bgColor: [240, 253, 244] };
  if (pct >= 60) return { grade: "B", color: [37, 99, 235], bgColor: [239, 246, 255] };
  if (pct >= 50) return { grade: "C", color: [124, 58, 237], bgColor: [245, 243, 255] };
  if (pct >= 40) return { grade: "D", color: [234, 88, 12], bgColor: [255, 247, 237] };
  return { grade: "No Award", color: [220, 38, 38], bgColor: [254, 242, 242] };
}

function getScoreColor(score: number, max: number): [number, number, number] {
  if (max === 0) return [150, 150, 150];
  const pct = (score / max) * 100;
  if (pct >= 80) return [22, 163, 74];
  if (pct >= 60) return [37, 99, 235];
  if (pct >= 40) return [234, 88, 12];
  return [220, 38, 38];
}

export function generateResultsPDF(data: PDFResultData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxWidth);
  };

  const pct = data.maxScore > 0 ? Math.round((data.totalScore / data.maxScore) * 100) : 0;
  const gradeInfo = getGradeInfo(pct);

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 44, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text("Results Report", pageWidth / 2, 30, { align: "center" });

  doc.setFontSize(9);
  doc.text(data.date, pageWidth / 2, 39, { align: "center" });

  y = 54;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 42, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 42, 3, 3, "S");

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Student", margin + 6, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.text(data.studentName, margin + 6, y + 18);

  const gradeBoxX = pageWidth - margin - 52;
  doc.setFillColor(...gradeInfo.bgColor);
  doc.roundedRect(gradeBoxX, y + 4, 46, 34, 3, 3, "F");
  doc.setDrawColor(...gradeInfo.color);
  doc.roundedRect(gradeBoxX, y + 4, 46, 34, 3, 3, "S");

  doc.setTextColor(...gradeInfo.color);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("GRADE", gradeBoxX + 23, y + 13, { align: "center" });
  doc.setFontSize(18);
  doc.text(gradeInfo.grade, gradeBoxX + 23, y + 28, { align: "center" });

  const scoreBoxX = gradeBoxX - 56;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(scoreBoxX, y + 4, 50, 34, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(scoreBoxX, y + 4, 50, 34, 3, 3, "S");

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("SCORE", scoreBoxX + 25, y + 13, { align: "center" });
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.text(`${data.totalScore}/${data.maxScore}`, scoreBoxX + 25, y + 24, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(...gradeInfo.color);
  doc.text(`${pct}%`, scoreBoxX + 25, y + 33, { align: "center" });

  y += 48;

  const barY = y;
  const barHeight = 6;
  const barWidth = contentWidth;
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(margin, barY, barWidth, barHeight, 3, 3, "F");
  if (pct > 0) {
    const fillWidth = Math.max(6, (pct / 100) * barWidth);
    doc.setFillColor(...gradeInfo.color);
    doc.roundedRect(margin, barY, fillWidth, barHeight, 3, 3, "F");
  }
  y += 16;

  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Breakdown", margin + 6, y + 7);
  y += 16;

  data.breakdown.forEach((item, idx) => {
    checkPage(45);

    const scorePct = item.maxMarks > 0 ? (item.score / item.maxMarks) * 100 : 0;
    const scoreColor = getScoreColor(item.score, item.maxMarks);

    doc.setFillColor(...(scorePct >= 60 ? [240, 253, 244] as [number, number, number] : scorePct >= 40 ? [255, 247, 237] as [number, number, number] : [254, 242, 242] as [number, number, number]));
    doc.roundedRect(margin, y - 5, contentWidth, 12, 2, 2, "F");
    doc.setDrawColor(...scoreColor);
    doc.roundedRect(margin, y - 5, contentWidth, 12, 2, 2, "S");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    const qLabel = data.questionLabel || "Question";
    const heading = item.label || `${qLabel} ${idx + 1}`;
    doc.text(heading, margin + 4, y + 2);

    const scoreText = `${item.score}/${item.maxMarks}`;
    doc.setTextColor(...scoreColor);
    doc.text(scoreText, pageWidth - margin - 4, y + 2, { align: "right" });

    y += 14;

    if (item.questionText) {
      checkPage(15);
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${data.questionLabel || "Question"}:`, margin + 2, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const lines = wrapText(item.questionText, contentWidth - 6, 9);
      checkPage(lines.length * 4 + 5);
      doc.setFontSize(9);
      doc.text(lines, margin + 4, y);
      y += lines.length * 4 + 4;
    }

    checkPage(15);
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Student Answer:", margin + 2, y);
    y += 5;

    doc.setFillColor(239, 246, 255);
    const answerText = item.userAnswer || "No answer provided";
    const answerLines = wrapText(answerText, contentWidth - 12, 9);
    checkPage(answerLines.length * 4 + 8);
    const answerBlockH = answerLines.length * 4 + 6;
    doc.roundedRect(margin + 2, y - 3, contentWidth - 4, answerBlockH, 2, 2, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.text(answerLines, margin + 6, y + 1);
    y += answerBlockH + 3;

    if (item.feedback) {
      checkPage(15);
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Feedback:", margin + 2, y);
      y += 5;

      doc.setFillColor(240, 253, 244);
      const fbLines = wrapText(item.feedback, contentWidth - 12, 9);
      checkPage(fbLines.length * 4 + 8);
      const fbBlockH = fbLines.length * 4 + 6;
      doc.roundedRect(margin + 2, y - 3, contentWidth - 4, fbBlockH, 2, 2, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(fbLines, margin + 6, y + 1);
      y += fbBlockH + 3;
    }

    if (item.suggestions) {
      checkPage(15);
      doc.setTextColor(124, 58, 237);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("How to Improve:", margin + 2, y);
      y += 5;

      doc.setFillColor(245, 243, 255);
      const sugLines = wrapText(item.suggestions, contentWidth - 12, 9);
      checkPage(sugLines.length * 4 + 8);
      const sugBlockH = sugLines.length * 4 + 6;
      doc.roundedRect(margin + 2, y - 3, contentWidth - 4, sugBlockH, 2, 2, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(sugLines, margin + 6, y + 1);
      y += sugBlockH + 3;
    }

    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  });

  const safeName = data.studentName.replace(/[^a-zA-Z0-9]/g, "_");
  const safeTitle = data.title.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`${safeName}_${safeTitle}_Results.pdf`);
}
