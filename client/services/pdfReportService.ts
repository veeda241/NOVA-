import { jsPDF } from "jspdf";
import type { AnalysisReport } from "../types";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = PAGE_H - 10;

type RGB = [number, number, number];

const INDIGO: RGB = [79, 70, 229];
const INDIGO_SOFT: RGB = [199, 210, 254];
const TEXT_DARK: RGB = [15, 23, 42];
const TEXT_BODY: RGB = [51, 65, 85];
const TEXT_MUTED: RGB = [100, 116, 139];
const TRACK: RGB = [226, 232, 240];
const DIVIDER: RGB = [203, 213, 225];
const AMBER_BG: RGB = [255, 251, 235];
const AMBER_BORDER: RGB = [252, 211, 77];
const EMERALD_BG: RGB = [236, 253, 245];
const EMERALD_BORDER: RGB = [167, 243, 208];
const EMERALD_DOT: RGB = [16, 185, 129];
const RED: RGB = [239, 68, 68];
const ORANGE: RGB = [251, 146, 60];
const EMERALD: RGB = [16, 185, 129];

const sanitize = (value: unknown): string =>
  String(value ?? "")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\xFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hexToRgb = (hex?: string): RGB => {
  const match = hex ? /^#?([0-9a-f]{6})$/i.exec(hex.trim()) : null;
  if (!match) return [99, 102, 241];
  return [
    parseInt(match[1].slice(0, 2), 16),
    parseInt(match[1].slice(2, 4), 16),
    parseInt(match[1].slice(4, 6), 16),
  ];
};

const stressTier = (level: number): { color: RGB; label: string } => {
  if (level > 70)
    return {
      color: RED,
      label:
        "Critical. High stress levels detected. Immediate grounding techniques recommended.",
    };
  if (level > 40)
    return {
      color: ORANGE,
      label: "Elevated. Moderate stress levels. Recommend monitoring triggers.",
    };
  return { color: EMERALD, label: "Nominal. Emotional state appears stable." };
};

const fill = (doc: jsPDF, color: RGB) =>
  doc.setFillColor(color[0], color[1], color[2]);
const stroke = (doc: jsPDF, color: RGB) =>
  doc.setDrawColor(color[0], color[1], color[2]);
const ink = (doc: jsPDF, color: RGB) =>
  doc.setTextColor(color[0], color[1], color[2]);

export const buildReportPdf = (report: AnalysisReport): jsPDF => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const subject =
    sanitize(report.patientName || "Subject").trim() || "Subject";
  let y = 0;

  const addContinuationHeader = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    ink(doc, TEXT_MUTED);
    doc.text(`Psychological Assessment - ${subject} (continued)`, MARGIN, 12);
    y = 20;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_H - 20) {
      doc.addPage();
      addContinuationHeader();
    }
  };

  const writeParagraph = (text: string, lineHeight = 5.2) => {
    const lines = doc.splitTextToSize(sanitize(text), CONTENT_W) as string[];
    lines.forEach((line) => {
      ensureSpace(lineHeight);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      ink(doc, TEXT_BODY);
      doc.text(line, MARGIN, y);
      y += lineHeight;
    });
  };

  const sectionTitle = (title: string) => {
    ensureSpace(14);
    fill(doc, INDIGO);
    doc.rect(MARGIN, y - 3.4, 2.2, 4.4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    ink(doc, TEXT_DARK);
    doc.setCharSpace(0.3);
    doc.text(sanitize(title), MARGIN + 5, y);
    doc.setCharSpace(0);
    y += 7;
  };

  // Header banner
  fill(doc, INDIGO);
  doc.rect(0, 0, PAGE_W, 34, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  ink(doc, INDIGO_SOFT);
  doc.setCharSpace(0.6);
  doc.text("CONFIDENTIAL REPORT", MARGIN, 13);
  doc.setCharSpace(0);
  doc.setFontSize(20);
  ink(doc, [255, 255, 255]);
  doc.text("Psychological Assessment", MARGIN, 25);
  doc.setFontSize(15);
  doc.text("NOVA", PAGE_W - MARGIN, 20, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  ink(doc, INDIGO_SOFT);
  doc.text("Emotional AI Engine", PAGE_W - MARGIN, 26, { align: "right" });

  // Subject row
  y = 46;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  ink(doc, TEXT_MUTED);
  doc.text("Subject:", MARGIN, y);
  doc.setFont("helvetica", "bold");
  ink(doc, TEXT_DARK);
  doc.text(subject, MARGIN + 18, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  ink(doc, TEXT_MUTED);
  const generatedDate = report.timestamp ? new Date(report.timestamp) : new Date();
  const stamp = Number.isNaN(generatedDate.getTime())
    ? sanitize(report.timestamp)
    : generatedDate.toLocaleString();
  doc.text(`Generated: ${sanitize(stamp)}`, PAGE_W - MARGIN, y, {
    align: "right",
  });
  stroke(doc, DIVIDER);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 4, PAGE_W - MARGIN, y + 4);

  // Stress indicator
  y = 60;
  const stress = Math.max(0, Math.min(100, Number(report.stressLevel) || 0));
  const tier = stressTier(stress);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  ink(doc, TEXT_MUTED);
  doc.setCharSpace(0.4);
  doc.text("STRESS INDICATOR", MARGIN, y);
  doc.setCharSpace(0);
  doc.setFontSize(13);
  ink(doc, tier.color);
  doc.text(`${Math.round(stress)}%`, PAGE_W - MARGIN, y, { align: "right" });
  y += 4;
  fill(doc, TRACK);
  doc.roundedRect(MARGIN, y, CONTENT_W, 6, 3, 3, "F");
  const stressW = (CONTENT_W * stress) / 100;
  if (stressW > 0.5) {
    fill(doc, tier.color);
    const radius = Math.min(3, stressW / 2);
    doc.roundedRect(MARGIN, y, stressW, 6, radius, radius, "F");
  }
  y += 11;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  ink(doc, TEXT_MUTED);
  const statusLines = doc.splitTextToSize(sanitize(tier.label), CONTENT_W) as string[];
  statusLines.forEach((line) => {
    doc.text(line, MARGIN, y);
    y += 4.5;
  });
  y += 6;

  // Emotional profile
  sectionTitle("EMOTIONAL PROFILE");
  const profile = Array.isArray(report.emotionalProfile)
    ? report.emotionalProfile.slice(0, 5)
    : [];
  if (profile.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    ink(doc, TEXT_MUTED);
    doc.text("No emotional data captured.", MARGIN, y);
    y += 8;
  }
  const BAR_X = MARGIN + 46;
  const BAR_W = 112;
  const ROW_H = 9;
  profile.forEach((item) => {
    ensureSpace(ROW_H);
    const score = Math.max(0, Math.min(100, Number(item.score) || 0));
    const color = hexToRgb(item.color);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    ink(doc, TEXT_DARK);
    const labelLines = doc.splitTextToSize(
      sanitize(item.emotion || "Unknown"),
      42
    ) as string[];
    doc.text(labelLines[0] ?? "Unknown", MARGIN, y + 1);
    fill(doc, TRACK);
    doc.roundedRect(BAR_X, y - 2.6, BAR_W, 5, 2.5, 2.5, "F");
    const barW = (BAR_W * score) / 100;
    if (barW > 0.5) {
      fill(doc, color);
      const radius = Math.min(2.5, barW / 2);
      doc.roundedRect(BAR_X, y - 2.6, barW, 5, radius, radius, "F");
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    ink(doc, color);
    doc.text(`${Math.round(score)}%`, PAGE_W - MARGIN, y + 1, {
      align: "right",
    });
    y += ROW_H;
  });
  y += 6;

  stroke(doc, DIVIDER);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 12;

  // Clinical analysis
  sectionTitle("ROOT CAUSE ANALYSIS");
  writeParagraph(report.rootCauseAnalysis || "No root cause analysis provided.");
  y += 4;

  sectionTitle("LONG TERM STRATEGY");
  writeParagraph(report.longTermStrategy || "No long-term strategy provided.");
  y += 4;

  // Key observations
  const summaryLines = doc.splitTextToSize(
    sanitize(report.inputSummary || "No observations recorded."),
    CONTENT_W - 12
  ) as string[];
  const boxH = summaryLines.length * 4.8 + 10;
  sectionTitle("KEY OBSERVATIONS");
  ensureSpace(boxH + 4);
  fill(doc, AMBER_BG);
  stroke(doc, AMBER_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2, "FD");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  ink(doc, TEXT_BODY);
  summaryLines.forEach((line, i) => {
    doc.text(line, MARGIN + 6, y + 7 + i * 4.8);
  });
  y += boxH + 12;

  // Recommended actions
  sectionTitle("RECOMMENDED ACTIONS");
  const actions = Array.isArray(report.suggestedInterventions)
    ? report.suggestedInterventions
    : [];
  if (actions.length === 0) {
    writeParagraph("No actions recorded.");
  }
  actions.forEach((action) => {
    const lines = doc.splitTextToSize(
      sanitize(action),
      CONTENT_W - 6
    ) as string[];
    ensureSpace(lines.length * 5 + 4);
    fill(doc, EMERALD_DOT);
    doc.circle(MARGIN + 1.3, y - 1.2, 0.9, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    ink(doc, TEXT_BODY);
    lines.forEach((line, i) => {
      doc.text(line, MARGIN + 5.5, y + i * 5);
    });
    y += lines.length * 5 + 3.5;
  });

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    stroke(doc, DIVIDER);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    ink(doc, TEXT_MUTED);
    doc.text(
      "NOVA Emotional AI - Confidential Psychological Assessment",
      MARGIN,
      FOOTER_Y
    );
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, FOOTER_Y, {
      align: "right",
    });
  }

  doc.setProperties({
    title: `NOVA Psychological Assessment - ${subject}`,
    subject: "Emotional AI generated assessment",
    creator: "NOVA Emotional AI",
  });

  return doc;
};

export const downloadReportPdf = (report: AnalysisReport): void => {
  const doc = buildReportPdf(report);
  const date = new Date(report.timestamp);
  const stamp = Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10)
    : date.toISOString().slice(0, 10);
  const name =
    sanitize(report.patientName || "Subject")
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "") || "Subject";
  doc.save(`NOVA_Report_${name}_${stamp}.pdf`);
};
