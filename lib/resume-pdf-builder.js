import { jsPDF } from "jspdf";

export function generateBuiltResumePdf(resumeSession) {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const session = resumeSession?.toObject ? resumeSession.toObject() : resumeSession;
  const generated = session?.generatedResume || {};
  const resumeData = generated.resumeData || {};
  const template = generated.template || "modern";
  const personal = resumeData.personal || {};

  let y = margin;

  const ensureSpace = (neededHeight) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // -------------------------------------------------------------
  // Header / Personal Info
  // -------------------------------------------------------------
  if (template === "classic") {
    // Centered Classic Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text(personal.fullName || "Candidate Name", pageWidth / 2, y, { align: "center" });
    y += 6;

    if (personal.targetRole) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text(personal.targetRole, pageWidth / 2, y, { align: "center" });
      y += 5;
    }

    // Contact details line
    const contacts = [
      personal.email,
      personal.phone,
      personal.location,
      personal.linkedin ? "LinkedIn: " + personal.linkedin : null,
      personal.github ? "GitHub: " + personal.github : null,
    ].filter(Boolean);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(contacts.join("  |  "), pageWidth / 2, y, { align: "center" });
    y += 5;

    // Divider rule
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;
  } else if (template === "executive") {
    // Executive Style Header with subtle top accent block
    doc.setFillColor(30, 58, 138); // Deep Navy
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text(personal.fullName || "Candidate Name", margin, 14);

    if (personal.targetRole) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(224, 231, 255);
      doc.text(personal.targetRole, margin, 20);
    }

    const contacts = [personal.email, personal.phone, personal.location, personal.linkedin, personal.portfolio]
      .filter(Boolean)
      .join("  •  ");

    doc.setFontSize(8.5);
    doc.setTextColor(199, 210, 254);
    doc.text(contacts, margin, 25);

    y = 35;
  } else {
    // Modern & Minimal Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text(personal.fullName || "Candidate Name", margin, y);
    y += 5.5;

    if (personal.targetRole) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(37, 99, 235); // Blue accent
      doc.text(personal.targetRole, margin, y);
      y += 5;
    }

    const contacts = [
      personal.email,
      personal.phone,
      personal.location,
      personal.linkedin ? "LinkedIn: " + personal.linkedin : null,
      personal.github ? "GitHub: " + personal.github : null,
      personal.portfolio,
    ].filter(Boolean);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(contacts.join("  •  "), margin, y);
    y += 4.5;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  }

  // Section Header Helper
  const drawSectionHeader = (title) => {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);

    if (template === "executive") {
      doc.setTextColor(30, 58, 138);
    } else if (template === "modern") {
      doc.setTextColor(37, 99, 235);
    } else {
      doc.setTextColor(15, 23, 42);
    }

    doc.text(title.toUpperCase(), margin, y);
    y += 1.5;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  const sectionOrder = generated.sectionOrder || [
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications",
    "achievements",
    "languages",
  ];

  for (const section of sectionOrder) {
    if (section === "personal") continue;

    // 1. PROFESSIONAL SUMMARY
    if (section === "summary" && resumeData.summary) {
      drawSectionHeader("Professional Summary");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);

      const splitSummary = doc.splitTextToSize(resumeData.summary, contentWidth);
      ensureSpace(splitSummary.length * 4.5 + 4);
      doc.text(splitSummary, margin, y);
      y += splitSummary.length * 4.5 + 4;
    }

    // 2. CORE SKILLS
    else if (section === "skills" && Array.isArray(resumeData.skills) && resumeData.skills.length > 0) {
      drawSectionHeader("Core Skills & Competencies");
      for (const skillCat of resumeData.skills) {
        if (!skillCat.items || skillCat.items.length === 0) continue;
        ensureSpace(6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        const catLabel = `${skillCat.category || "Skills"}: `;
        doc.text(catLabel, margin, y);

        const catLabelWidth = doc.getTextWidth(catLabel);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);

        const itemsText = skillCat.items.join(", ");
        const splitItems = doc.splitTextToSize(itemsText, contentWidth - catLabelWidth);

        doc.text(splitItems[0], margin + catLabelWidth, y);
        y += 4.5;

        if (splitItems.length > 1) {
          for (let i = 1; i < splitItems.length; i++) {
            ensureSpace(4.5);
            doc.text(splitItems[i], margin + 5, y);
            y += 4.5;
          }
        }
      }
      y += 2;
    }

    // 3. WORK EXPERIENCE
    else if (section === "experience" && Array.isArray(resumeData.experience) && resumeData.experience.length > 0) {
      drawSectionHeader("Professional Experience");

      for (const exp of resumeData.experience) {
        ensureSpace(14);
        // Role & Company
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(exp.title || "Role Title", margin, y);

        // Date right-aligned
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        const dateStr = `${exp.startDate || ""} - ${exp.current ? "Present" : exp.endDate || ""}`;
        doc.text(dateStr, pageWidth - margin, y, { align: "right" });
        y += 4.5;

        // Company & Location
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const companyLoc = [exp.company, exp.location].filter(Boolean).join(" • ");
        doc.text(companyLoc, margin, y);
        y += 4.5;

        // Bullets
        if (Array.isArray(exp.bullets)) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);

          for (const bullet of exp.bullets) {
            const splitBullet = doc.splitTextToSize(bullet, contentWidth - 6);
            ensureSpace(splitBullet.length * 4.2 + 2);
            doc.text("•", margin + 1, y);
            doc.text(splitBullet, margin + 5, y);
            y += splitBullet.length * 4.2 + 1.5;
          }
        }
        y += 2;
      }
    }

    // 4. PROJECTS
    else if (section === "projects" && Array.isArray(resumeData.projects) && resumeData.projects.length > 0) {
      drawSectionHeader("Key Projects & Portfolio");

      for (const proj of resumeData.projects) {
        ensureSpace(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(proj.name || "Project Name", margin, y);

        if (proj.role) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(proj.role, pageWidth - margin, y, { align: "right" });
        }
        y += 4.5;

        if (proj.description) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);
          const splitDesc = doc.splitTextToSize(proj.description, contentWidth);
          ensureSpace(splitDesc.length * 4.2);
          doc.text(splitDesc, margin, y);
          y += splitDesc.length * 4.2 + 2;
        }

        if (Array.isArray(proj.bullets)) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);

          for (const bullet of proj.bullets) {
            const splitBullet = doc.splitTextToSize(bullet, contentWidth - 6);
            ensureSpace(splitBullet.length * 4.2 + 2);
            doc.text("•", margin + 1, y);
            doc.text(splitBullet, margin + 5, y);
            y += splitBullet.length * 4.2 + 1.5;
          }
        }

        if (Array.isArray(proj.technologies) && proj.technologies.length > 0) {
          ensureSpace(4.5);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`Technologies: ${proj.technologies.join(", ")}`, margin, y);
          y += 4.5;
        }
        y += 2;
      }
    }

    // 5. EDUCATION
    else if (section === "education" && Array.isArray(resumeData.education) && resumeData.education.length > 0) {
      drawSectionHeader("Education & Qualifications");

      for (const edu of resumeData.education) {
        ensureSpace(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        const degreeField = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(" in ");
        doc.text(degreeField || "Degree", margin, y);

        const dateStr = [edu.startDate, edu.current ? "Present" : edu.endDate].filter(Boolean).join(" - ");
        if (dateStr) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(dateStr, pageWidth - margin, y, { align: "right" });
        }
        y += 4.5;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const instLoc = [edu.institution, edu.location].filter(Boolean).join(" • ");
        doc.text(instLoc, margin, y);
        y += 4.5;

        if (edu.gpa) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`GPA: ${edu.gpa}`, margin, y);
          y += 4;
        }

        if (Array.isArray(edu.highlights) && edu.highlights.length > 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          for (const h of edu.highlights) {
            ensureSpace(4);
            doc.text(`• ${h}`, margin + 3, y);
            y += 4;
          }
        }
        y += 2;
      }
    }

    // 6. CERTIFICATIONS
    else if (section === "certifications" && Array.isArray(resumeData.certifications) && resumeData.certifications.length > 0) {
      drawSectionHeader("Certifications & Licenses");

      for (const cert of resumeData.certifications) {
        ensureSpace(6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(`• ${cert.name}`, margin + 2, y);

        const meta = [cert.issuer, cert.issueDate].filter(Boolean).join(" | ");
        if (meta) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(meta, pageWidth - margin, y, { align: "right" });
        }
        y += 4.5;
      }
      y += 2;
    }

    // 7. ACHIEVEMENTS & AWARDS
    else if (section === "achievements" && Array.isArray(resumeData.achievements) && resumeData.achievements.length > 0) {
      drawSectionHeader("Honors & Achievements");

      for (const ach of resumeData.achievements) {
        ensureSpace(6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(`• ${ach.title}`, margin + 2, y);
        y += 4;

        if (ach.description) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          const splitAch = doc.splitTextToSize(ach.description, contentWidth - 8);
          ensureSpace(splitAch.length * 4);
          doc.text(splitAch, margin + 6, y);
          y += splitAch.length * 4 + 1;
        }
      }
      y += 2;
    }

    // 8. LANGUAGES
    else if (section === "languages" && Array.isArray(resumeData.languages) && resumeData.languages.length > 0) {
      drawSectionHeader("Languages");
      ensureSpace(6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const langs = resumeData.languages
        .map((l) => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ""}`)
        .join("  •  ");
      doc.text(langs, margin, y);
      y += 6;
    }
  }

  return doc.output("arraybuffer");
}
