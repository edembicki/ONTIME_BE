import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db/database';
import { generateTimesheetCSV } from '../services/reports/generateTimesheetCSV';
import { generateTimesheetPDF } from '../services/reports/generateTimesheetPDF';

const router = Router();

/**
 * 🔒 DESTINO FIXO (SEVENSYS)
 */
const DESTINATION_EMAIL = 'edudembicki@gmail.com';

/**
 * =========================
 * LISTA DE REPORTS (HISTÓRICO)
 * =========================
 */
router.get('/', (_, res) => {
  const reports = db
    .prepare(`
      SELECT *
        FROM reports
       ORDER BY created_at DESC
    `)
    .all();

  res.json(reports);
});

/**
 * =========================
 * ENVIO PARA SEVENSYS
 * =========================
 *
 * body:
 * {
 *   userId: string,
 *   senderEmail: string,
 *   periodStart: string (YYYY-MM-DD),
 *   periodEnd: string   (YYYY-MM-DD),
 *   format: 'csv' | 'pdf' | 'pdf+csv'
 * }
 */
router.post('/send', async (req, res) => {
  try {
    const id = crypto.randomUUID();

    const {
      userId,
      senderEmail,
      periodStart,
      periodEnd,
      format,
    } = req.body;

    if (
      !userId ||
      !senderEmail ||
      !periodStart ||
      !periodEnd ||
      !format
    ) {
      return res.status(400).json({
        error: 'Campos obrigatórios ausentes',
      });
    }

    /**
     * =========================
     * BUSCA TIME ENTRIES DO PERÍODO
     * =========================
     */
    const rows = db
      .prepare(
        `
        SELECT
          te.date,
          te.start,
          te.end,
          te.hours,
          te.notes,
          t.title,
          t.project
        FROM time_entries te
        JOIN tasks t ON t.id = te.task_id
        WHERE te.user_id = ?
          AND te.date BETWEEN ? AND ?
        ORDER BY te.date, te.start
      `
      )
      .all(userId, periodStart, periodEnd) as any[];

    /**
     * =========================
     * AGRUPA POR DIA (PADRÃO SEVENSYS)
     * =========================
     */
    const daysMap: Record<string, any> = {};

    for (const r of rows) {
      if (!daysMap[r.date]) {
        daysMap[r.date] = {
          date: r.date,
          jornada: '',
          total: 0,
          description: '',
        };
      }

      const start = r.start?.slice(11, 16) ?? '';
      const end = r.end?.slice(11, 16) ?? '';

      if (start && end && !daysMap[r.date].jornada) {
        daysMap[r.date].jornada = `${start} - ${end}`;
      }

      daysMap[r.date].total += r.hours ?? 0;

      const line = `${r.title}${r.project ? ` (${r.project})` : ''}`;

      daysMap[r.date].description +=
        (daysMap[r.date].description ? ' | ' : '') + line;
    }

    const days = Object.values(daysMap);

    /**
     * =========================
     * GERA ARQUIVOS (BASE64)
     * =========================
     */
    let csvBase64: string | null = null;
    let pdfBase64: string | null = null;

    if (format === 'csv' || format === 'pdf+csv') {
      csvBase64 = generateTimesheetCSV(days);
    }

    if (format === 'pdf' || format === 'pdf+csv') {
      pdfBase64 = await generateTimesheetPDF(days, {
        userName: userId,
        periodStart,
        periodEnd,
      });
    }

    /**
     * =========================
     * 🔜 AQUI ENTRA O ENVIO REAL
     * =========================
     *
     * from: senderEmail
     * to: financeiro@sevensys.tech
     * attachments:
     *   - timesheet.csv (base64)
     *   - timesheet.pdf (base64)
     *
     * (SMTP / API SevenSys)
     */

    /**
     * =========================
     * SALVA REPORT
     * =========================
     */
    db.prepare(
      `
      INSERT INTO reports (
        id,
        user_id,
        sender_email,
        destination_email,
        period_start,
        period_end,
        format,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `
    ).run(
      id,
      userId,
      senderEmail,
      DESTINATION_EMAIL,
      periodStart,
      periodEnd,
      format
    );

    /**
     * =========================
     * RETORNO
     * =========================
     */
    res.status(201).json({
      id,
      message: 'Relatório gerado com sucesso',
      destinationEmail: DESTINATION_EMAIL,
      files: {
        csvBase64,
        pdfBase64,
      },
    });
  } catch (err) {
    console.error('[REPORTS][SEND] ERRO', err);
    res.status(500).json({
      error: 'Erro ao gerar relatório',
    });
  }
});

export default router;
