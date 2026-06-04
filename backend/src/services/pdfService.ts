import PDFDocument from 'pdfkit';
import { IAssignmentDocument } from '../models/Assignment';

export const generateAssignmentPDF = (assignment: IAssignmentDocument): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Page number tracker
    let currentPage = 1;
    doc.on('pageAdded', () => {
      currentPage++;
    });

    // Color Palette
    const primaryColor = '#1e293b'; // Slate 800
    const secondaryColor = '#475569'; // Slate 600
    const accentColor = '#e2e8f0'; // Slate 200
    const lineFill = '#94a3b8'; // Slate 400

    // Header Title
    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text(assignment.schoolName, { align: 'center' });

    doc.moveDown(0.3);

    // Subheader
    doc
      .fillColor(secondaryColor)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(`Subject: ${assignment.subject}   |   Class: ${assignment.gradeClass}`, { align: 'center' });

    doc.moveDown(0.2);
    doc
      .font('Helvetica')
      .fontSize(11)
      .text(`Topic: ${assignment.title}`, { align: 'center' });

    doc.moveDown(0.8);

    // Meta Block (Time & Max Marks)
    const yMeta = doc.y;
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(`Time Allowed: ${assignment.timeAllowed} minutes`, 50, yMeta);
    doc.text(`Maximum Marks: ${assignment.questionConfigs.reduce((acc, c) => acc + c.count * c.marks, 0)}`, 350, yMeta, {
      align: 'right',
      width: 195
    });

    doc.moveDown(0.5);

    // Divider Line
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor(accentColor)
      .lineWidth(1.5)
      .stroke();

    doc.moveDown(0.8);

    // Student Info Form Block
    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('All questions are compulsory unless stated otherwise.', 50, doc.y);

    doc.moveDown(0.8);

    // Student Input Lines
    const startY = doc.y;
    doc.font('Helvetica').fontSize(10);
    doc.text('Name: ____________________________________', 50, startY);
    doc.text('Roll Number: ___________________', 330, startY);
    doc.moveDown(0.6);
    doc.text('Class & Section: ___________________________', 50, doc.y);

    doc.moveDown(1.5);

    // Divider
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor(accentColor)
      .lineWidth(1)
      .stroke();

    doc.moveDown(1);

    // Render Questions by Section
    if (assignment.sections && assignment.sections.length > 0) {
      assignment.sections.forEach((section, sIdx) => {
        // Section Title
        doc
          .fillColor(primaryColor)
          .font('Helvetica-Bold')
          .fontSize(14)
          .text(section.title, { align: 'center' });

        doc.moveDown(0.2);

        // Section Instructions
        doc
          .fillColor(secondaryColor)
          .font('Helvetica-Oblique')
          .fontSize(10)
          .text(section.instruction, { align: 'center' });

        doc.moveDown(0.8);

        // Questions List
        section.questions.forEach((q, qIdx) => {
          doc.fillColor(primaryColor).font('Helvetica').fontSize(10.5);

          // Build question string with badges in text
          const prefix = `${qIdx + 1}. [${q.difficulty}]  `;
          const suffix = `  [${q.marks} Mark${q.marks > 1 ? 's' : ''}]`;
          
          // Print item with list numbering and wrapping
          const fullText = `${prefix}${q.text}${suffix}`;
          
          doc.text(fullText, 50, doc.y, {
            width: 495,
            align: 'left',
            lineGap: 3
          });
          
          doc.moveDown(1);
        });

        doc.moveDown(1.5);
      });
    }

    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('End of Question Paper', { align: 'center' });

    // Answer Key Page
    if (assignment.answerKey && assignment.answerKey.length > 0) {
      doc.addPage();

      doc
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .fontSize(16)
        .text('Answer Key & Explanations', { align: 'center' });

      doc.moveDown(0.3);
      doc
        .fillColor(secondaryColor)
        .font('Helvetica')
        .fontSize(10)
        .text('For Evaluators Use Only', { align: 'center' });

      doc.moveDown(0.8);
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor(accentColor)
        .lineWidth(1)
        .stroke();

      doc.moveDown(1.2);

      let currentSection = '';
      assignment.answerKey.forEach((item) => {
        if (item.sectionTitle !== currentSection) {
          currentSection = item.sectionTitle;
          doc
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text(`${currentSection} Solutions`, 50, doc.y);
          doc.moveDown(0.5);
        }

        doc
          .font('Helvetica-Bold')
          .fontSize(10.5)
          .text(`Q${item.questionIndex}. ${item.questionText}`, 60, doc.y, { width: 485 });

        doc.moveDown(0.2);

        doc
          .font('Helvetica')
          .fillColor('#0284c7') // Blue 600 for answer key
          .fontSize(10)
          .text(`Answer: ${item.answer}`, 75, doc.y, { width: 470, lineGap: 2 });

        doc.moveDown(1);
      });
    }

    // End Document
    doc.end();
  });
};
