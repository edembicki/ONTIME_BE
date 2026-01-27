import PDFDocument from 'pdfkit';

type DayReport = {
  date: string;
  jornada: string;
  total: number;
  description: string;
};

export async function generateTimesheetPDF(
  days: DayReport[],
  options: {
    userName: string;
    periodStart: string;
    periodEnd: string;
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
      });

      const buffers: Buffer[] = [];
      doc.on('data', (b) => buffers.push(b));
      doc.on('end', () =>
        resolve(Buffer.concat(buffers).toString('base64'))
      );

      /* =========================
       * HEADER
       * ========================= */
      doc
        .fontSize(16)
        .text('Relatório de Horas Trabalhadas', {
          align: 'center',
        })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .text(`Colaborador: ${options.userName}`)
        .text(
          `Período: ${options.periodStart} até ${options.periodEnd}`
        )
        .moveDown();

      /* =========================
       * COLUNAS
       * ========================= */
      const col = {
        date: 40,
        jornada: 120,
        total: 230,
        desc: 290,
      };

      doc.fontSize(9).font('Helvetica-Bold');
      const headerY = doc.y;

      doc.text('Data', col.date, headerY);
      doc.text('Jornada', col.jornada, headerY);
      doc.text('Total (h)', col.total, headerY);
      doc.text('Descrição', col.desc, headerY);

      doc
        .moveTo(40, headerY + 12)
        .lineTo(555, headerY + 12)
        .stroke();

      doc.moveDown(1);
      doc.font('Helvetica');

      /* =========================
       * ROWS
       * ========================= */
      days.forEach((d) => {
        const rowY = doc.y;

        doc.text(d.date, col.date, rowY);

        doc.text(d.jornada || '-', col.jornada, rowY);

        doc.text(d.total.toFixed(2), col.total, rowY, {
          width: 40,
          align: 'right',
        });

        const descHeight = doc.heightOfString(
          d.description || '-',
          { width: 250 }
        );

        doc.text(d.description || '-', col.desc, rowY, {
          width: 250,
        });

        const rowHeight = Math.max(descHeight, 14);
        doc.y = rowY + rowHeight + 6;

        if (doc.y > 760) {
          doc.addPage();
        }
      });

      /* =========================
       * TOTAL GERAL
       * ========================= */
      const totalGeral = days.reduce(
        (sum, d) => sum + (d.total || 0),
        0
      );

      doc
        .moveDown()
        .font('Helvetica-Bold')
        .text(
          `Total no período: ${totalGeral.toFixed(2)} horas`,
          { align: 'right' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
