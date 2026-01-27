type DayReport = {
  date: string;
  jornada: string;
  total: number;
  description: string;
};

/**
 * Gera o CSV em Base64 (UTF-8)
 * - Não escreve em disco
 * - Pronto para salvar no banco ou anexar em email
 */
export function generateTimesheetCSV(
  days: DayReport[]
): string {
  let csv =
    'Data,Jornada de Trabalho,Total de Horas,Descrição\n';

  for (const d of days) {
    const line = [
      d.date,
      `"${d.jornada || ''}"`,
      d.total.toFixed(2),
      `"${(d.description || '').replace(/"/g, '""')}"`
    ].join(',');

    csv += line + '\n';
  }

  // 🔐 Converte para Base64
  return Buffer.from(csv, 'utf8').toString('base64');
}

