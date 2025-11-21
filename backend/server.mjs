import express from 'express';
import cors from 'cors';
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.post('/excel/checklist', async (req, res) => {
  try {
    const {
      modoChecklist,
      tipoEquipe,
      codigoEquipe,
      eletricista1,
      eletricista2,
      colaboradorIndividual,
      responsavelChecklist,
      linhas,
    } = req.body;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Checklist');

    sheet.properties.defaultRowHeight = 18;

    // Colunas principais (tabela)
    sheet.columns = [
      { header: '', key: 'tipo', width: 8 },
      { header: '', key: 'descricao', width: 55 },
      { header: '', key: 'qtde', width: 18 },
      { header: '', key: 'obs', width: 32 },
    ];

    // Logo Engelétrica
    try {
      const logoPath = path.join(__dirname, '../public/logo-engeletrica.png');
      const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
      });
      sheet.addImage(logoId, {
        tl: { col: 0, row: 0 },
        ext: { width: 140, height: 50 },
      });
    } catch {
      // sem logo, segue normal
    }

    // Título
    sheet.mergeCells('C1:D2');
    const titleCell = sheet.getCell('C1');
    titleCell.value = 'Checklist EPI / EPC / Ferramental';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    let rowIdx = 4;

    const addInfoRow = (label1, value1, label2, value2) => {
      const row = sheet.getRow(rowIdx++);
      sheet.mergeCells(row.number, 1, row.number, 4);

      const left =
        value1 !== undefined && value1 !== null && value1 !== ''
          ? `${label1} ${value1}`
          : label1;

      const right =
        label2 && value2 !== undefined && value2 !== null && value2 !== ''
          ? `${label2} ${value2}`
          : label2 && !value2
          ? label2
          : '';

      row.getCell(1).value = right ? `${left}    ${right}` : left;
      row.getCell(1).alignment = { horizontal: 'left' };
      row.font = { size: 11 };
    };

    addInfoRow(
      'Tipo de checklist:',
      modoChecklist === 'VIATURA' ? 'Viatura' : 'Colaborador',
      'Data/Hora:',
      new Date().toLocaleString(),
    );
    addInfoRow(
      'Equipe:',
      codigoEquipe || '',
      'Tipo de equipe:',
      tipoEquipe === 'RURAL' ? 'Atendimento rural' : 'Atendimento urbano',
    );
    addInfoRow('Eletricista 1:', eletricista1 || '', 'Eletricista 2:', eletricista2 || '');
    addInfoRow('Colaborador:', colaboradorIndividual || '', 'Responsavel:', responsavelChecklist || '');

    rowIdx += 1;

    // Cabeçalho da tabela
    const headerRow = sheet.getRow(rowIdx++);
    const headerValues = ['Tipo', 'Descricao', 'Qtde encontrada', 'Observacao'];
    const thinBorder = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };

    headerValues.forEach((text, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = text;
      cell.font = { bold: true, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E5E5' },
      };
      cell.border = thinBorder;
    });

    // Linhas de itens
    if (Array.isArray(linhas)) {
      linhas.forEach((linha) => {
        const row = sheet.getRow(rowIdx++);
        row.getCell(1).value = linha.tipo ?? '';
        row.getCell(2).value = linha.descricao ?? '';
        row.getCell(3).value = linha.qtdeEncontrada ?? '';
        row.getCell(4).value = linha.observacao ?? '';

        for (let c = 1; c <= 4; c++) {
          const cell = row.getCell(c);
          cell.border = thinBorder;
          cell.font = { size: 11 };
          if (c === 3) {
            cell.alignment = { horizontal: 'center' };
          }
        }
      });
    }

    const lastDataRowNumber = rowIdx - 1;

    rowIdx += 2;

    // Assinaturas
    const ass1 = sheet.getRow(rowIdx++);
    ass1.getCell(1).value = 'Colaborador / Equipe:';
    ass1.getCell(2).value = colaboradorIndividual || eletricista1 || codigoEquipe || '';
    ass1.getCell(4).value = 'Assinatura: _____________________________';

    const ass2 = sheet.getRow(rowIdx++);
    ass2.getCell(1).value = 'Responsavel:';
    ass2.getCell(2).value = responsavelChecklist || '';
    ass2.getCell(4).value = 'Assinatura: _____________________________';

    // Configuração de página para sair pronto na impressão
    sheet.pageSetup.paperSize = 9; // A4
    sheet.pageSetup.orientation = 'portrait';
    sheet.pageSetup.fitToWidth = 1;
    sheet.pageSetup.fitToHeight = 0;
    sheet.pageSetup.horizontalCentered = false;
    sheet.pageSetup.verticalCentered = true;
    sheet.pageSetup.margins = {
      left: 1.22, // ~3,1 cm
      right: 0,
      top: 0.2, // ~0,5 cm
      bottom: 0.16, // ~0,4 cm
      header: 0.31, // ~0,8 cm
      footer: 0.31, // ~0,8 cm
    };
    sheet.pageSetup.printTitlesRow = `${headerRow.number}:${headerRow.number}`;

    // Altura das linhas da tabela
    for (let r = headerRow.number; r <= lastDataRowNumber; r++) {
      const row = sheet.getRow(r);
      row.height = 18;
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="checklist_epi_epc_ferramental.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar Excel' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor de Excel rodando em http://localhost:${PORT}`);
});
