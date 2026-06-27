import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function generateResumeReport(resume) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("Resume Analysis Report", 20, 25);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 33);

  doc.setTextColor(0, 0, 0);
  let y = 55;

  // File info
  doc.setFontSize(14);
  doc.text("Overview", 20, y);
  y += 10;
  doc.setFontSize(10);
  doc.text(`File: ${resume.fileName || "Resume"}`, 20, y);
  y += 7;
  doc.text(`Date: ${new Date(resume.createdAt).toLocaleDateString()}`, 20, y);
  y += 15;

  // Scores
  doc.setFontSize(14);
  doc.text("Scores", 20, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Score"]],
    body: [
      ["ATS Score", `${resume.atsScore}/100`],
      ["Grammar Score", `${resume.grammarScore}/100`],
      ["Readability Score", `${resume.readabilityScore}/100`],
      ["Formatting Score", `${resume.formattingScore}/100`],
    ],
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 20, right: 20 },
  });

  y = doc.lastAutoTable.finalY + 15;

  // Section scores
  if (resume.sectionScores) {
    doc.setFontSize(14);
    doc.text("Section Scores", 20, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [["Section", "Score"]],
      body: Object.entries(resume.sectionScores).map(([key, val]) => [
        key.charAt(0).toUpperCase() + key.slice(1),
        `${val}/100`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 },
    });

    y = doc.lastAutoTable.finalY + 15;
  }

  // Skills
  if (resume.extractedSkills?.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.text("Extracted Skills", 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(resume.extractedSkills.join(", "), 20, y, { maxWidth: pageWidth - 40 });
    y += 15;
  }

  // Recommendations
  if (resume.recommendations?.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.text("Recommendations", 20, y);
    y += 10;
    doc.setFontSize(10);
    resume.recommendations.forEach((rec, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, pageWidth - 40);
      doc.text(lines, 20, y);
      y += lines.length * 6 + 3;
    });
  }

  return doc.output("arraybuffer");
}

export function generateInterviewReport(session) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("Interview Report", 20, 25);
  doc.setFontSize(10);
  doc.text(`Role: ${session.targetRole || "N/A"}`, 20, 33);

  doc.setTextColor(0, 0, 0);
  let y = 55;

  doc.setFontSize(14);
  doc.text(`Overall Score: ${session.score}/100`, 20, y);
  y += 15;

  if (session.feedback) {
    doc.setFontSize(12);
    doc.text("Feedback", 20, y);
    y += 8;
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(session.feedback, pageWidth - 40);
    doc.text(lines, 20, y);
    y += lines.length * 6 + 10;
  }

  session.questions?.forEach((q, i) => {
    const answer = session.answers?.find((a) => a.questionId === q.id);
    if (y > 240) { doc.addPage(); y = 20; }

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text(`Q${i + 1}: ${q.question}`, 20, y, { maxWidth: pageWidth - 40 });
    y += 10;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);

    if (answer) {
      const ansLines = doc.splitTextToSize(`Answer: ${answer.answer}`, pageWidth - 40);
      doc.text(ansLines, 20, y);
      y += ansLines.length * 6 + 3;
      doc.text(`Score: ${answer.score}/100`, 20, y);
      y += 7;
      if (answer.feedback) {
        const fbLines = doc.splitTextToSize(`Feedback: ${answer.feedback}`, pageWidth - 40);
        doc.text(fbLines, 20, y);
        y += fbLines.length * 6 + 3;
      }
    }
    y += 10;
  });

  return doc.output("arraybuffer");
}
