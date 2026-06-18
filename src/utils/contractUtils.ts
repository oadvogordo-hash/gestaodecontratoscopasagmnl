import * as XLSX from 'xlsx';
import { Contrato, Medicao } from '../types';
import { getCategoriaByObjeto } from '../data/defaultContracts';

// Helper to convert date strings in formats like "DD/MM/YYYY" or "DD.MM.YYYY" to YYYY-MM-DD
export function parseDateToISO(dateStr: any): string {
  if (!dateStr) return '';
  
  // If it's a number (Excel serialized date)
  if (typeof dateStr === 'number') {
    const date = XLSX.SSF.parse_date_code(dateStr);
    const yStr = date.y.toString().padStart(4, '0');
    const mStr = date.m.toString().padStart(2, '0');
    const dStr = date.d.toString().padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  }

  const str = String(dateStr).trim();
  
  // check ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // split by "/" or "."
  const parts = str.split(/[./-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD probably
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    // DD/MM/YYYY
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) {
      year = '20' + year; // assume 20xx
    }
    return `${year}-${month}-${day}`;
  }

  return str;
}

// Format numbers to BRL currency
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Convert ISO date YYYY-MM-DD to Brazilian DD/MM/YYYY
export function formatBrDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Calculate remaining days between search date and end date
export function getDiasRestantes(fimValidade: string, dataPesquisa: string): number {
  if (!fimValidade || !dataPesquisa) return 0;
  const tFim = new Date(fimValidade + 'T00:00:00').getTime();
  const tPesquisa = new Date(dataPesquisa + 'T00:00:00').getTime();
  const diffTime = tFim - tPesquisa;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calculate residual balance on a contract
export function getResumoFinanceiro(contrato: Contrato) {
  const totalMedido = contrato.medicoes.reduce((acc, med) => acc + med.valor, 0);
  const saldoResidual = Math.max(0, contrato.valorContrato - totalMedido);
  const percentualUtilizado = contrato.valorContrato > 0 ? (totalMedido / contrato.valorContrato) * 100 : 0;
  return {
    totalMedido,
    saldoResidual,
    percentualUtilizado: Math.round(percentualUtilizado * 100) / 100
  };
}

// Checks if remaining days matches any centralized alert trigger
// Triggers are precisely for: 120, 90, 30, 15, 10, 5, 1 days.
export function checkAlertaAtivo(diasRestantes: number, diasAlerta: number): boolean {
  return diasRestantes === diasAlerta;
}

// Generate realistic mock measurements for newly imported contracts
export function generateMockMedicoes(valorTotal: number, dataInicioStr: string): Medicao[] {
  const list: Medicao[] = [];
  const usagePercent = 0.3 + Math.random() * 0.6; // random usage between 30% and 90%
  const totalSpent = valorTotal * usagePercent;
  const averageMedicaoValue = totalSpent / 6;
  const start = new Date(dataInicioStr || '2025-01-01');

  for (let i = 1; i <= 6; i++) {
    const medDate = new Date(start.getTime());
    medDate.setMonth(start.getMonth() + i);
    
    const variance = (Math.random() * 0.2 - 0.1) * averageMedicaoValue;
    const val = Math.round((averageMedicaoValue + variance) * 100) / 100;
    
    list.push({
      id: `m-${Math.random().toString(36).substr(2, 9)}`,
      numero: i,
      data: medDate.toISOString().split('T')[0],
      valor: Math.min(val, valorTotal - list.reduce((sum, item) => sum + item.valor, 0))
    });
  }
  return list;
}

// Parse uploaded XLS or XLSX file and return contracts
export function parseContractXls(fileBuffer: ArrayBuffer): Promise<Contrato[]> {
  return new Promise((resolve, reject) => {
    try {
      const data = new Uint8Array(fileBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (rows.length < 2) {
        throw new Error('Planilha vazia ou com cabeçalhos ausentes.');
      }

      // Find headers in the first few rows (sometimes there are empty rows or generic titles)
      let headerIndex = 0;
      let headers: string[] = [];
      
      for (let i = 0; i < Math.min(rows.length, 5); i++) {
        const r = rows[i];
        // checking if this row looks like header row (has 'fornecedor' or 'contrato' or similar)
        const hasFornecedor = r.some(cell => cell && String(cell).toLowerCase().includes('fornec'));
        const hasContrato = r.some(cell => cell && String(cell).toLowerCase().includes('contrat'));
        
        if (hasFornecedor || hasContrato) {
          headerIndex = i;
          headers = r.map(h => String(h || '').trim().toLowerCase());
          break;
        }
      }

      if (headers.length === 0) {
        headers = rows[0].map(h => String(h || '').trim().toLowerCase());
        headerIndex = 0;
      }

      // Helper to find column index by synonyms
      const getColIndex = (synonyms: string[]): number => {
        return headers.findIndex(h => synonyms.some(syn => h.includes(syn)));
      };

      const idxFornecedor = getColIndex(['fornec', 'prestador', 'empresa']);
      const idxContratoSap = getColIndex(['nro. contrato', 'sap', 'contrato sap', 'numero contrato']);
      const idxContratoJur = getColIndex(['juridico', 'jurídico', 'nro. juridico', 'contrato jurídico']);
      const idxObjeto = getColIndex(['objeto', 'descrição', 'serviço']);
      const idxInicio = getColIndex(['inicio', 'início', 'começo', 'data de inicio']);
      const idxFim = getColIndex(['fim', 'validade', 'vencimento', 'data de fim']);
      const idxValor = getColIndex(['valor', 'preço', 'contrato valor']);
      const idxFiscal = getColIndex(['fiscal', 'gestor']);
      const idxMedicaoResp = getColIndex(['responsavel pela medi', 'medição', 'responsável pela medição']);
      const idxAditivo = getColIndex(['aditivo', 'adit']);
      const idxObs = getColIndex(['obs', 'observ', 'comentários']);
      const idxResolver = getColIndex(['resolver', 'responsavel por resolver']);

      const parsedContracts: Contrato[] = [];

      for (let i = headerIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        // skip empty rows or rows without Fornecedor / Contrato SAP
        if (!row || row.length === 0) continue;
        
        const fornecedorVal = idxFornecedor !== -1 ? String(row[idxFornecedor] || '').trim() : '';
        const contratoSapVal = idxContratoSap !== -1 ? String(row[idxContratoSap] || '').trim() : '';
        const valorRaw = idxValor !== -1 ? row[idxValor] : 0;
        
        if (!fornecedorVal && !contratoSapVal) continue;

        // Clean values
        let valorContratoVal = 0;
        if (typeof valorRaw === 'number') {
          valorContratoVal = valorRaw;
        } else if (valorRaw) {
          // clean R$, dots and commas
          const cleaned = String(valorRaw)
            .replace(/R\$/g, '')
            .replace(/\s/g, '')
            .replace(/\./g, '')
            .replace(',', '.');
          valorContratoVal = parseFloat(cleaned) || 0;
        }

        const dataInicioVal = idxInicio !== -1 ? parseDateToISO(row[idxInicio]) : '';
        const dataFimVal = idxFim !== -1 ? parseDateToISO(row[idxFim]) : '';
        
        const aditivoRaw = idxAditivo !== -1 ? String(row[idxAditivo] || '').trim().toLowerCase() : '';
        let temAditivoVal: 'sim' | 'não' | 'em andamento' = 'não';
        if (aditivoRaw.includes('sim')) temAditivoVal = 'sim';
        else if (aditivoRaw.includes('andamento') || aditivoRaw.includes('proce')) temAditivoVal = 'em andamento';

        const obsVal = idxObs !== -1 ? String(row[idxObs] || '').trim() : '';
        let temRepiqueVal: 'sim' | 'não' | 'pendente' = 'não';
        if (obsVal.toLowerCase().includes('reajuste') || obsVal.toLowerCase().includes('repique') || obsVal.toLowerCase().includes('readequação')) {
          temRepiqueVal = 'pendente';
        }

        const objetoVal = idxObjeto !== -1 ? String(row[idxObjeto] || '').trim() : '';
        const categoria = getCategoriaByObjeto(objetoVal);

        const contrato: Contrato = {
          id: `c-xls-${Date.now()}-${i}`,
          fornecedor: fornecedorVal || 'Fornecedor Não Identificado',
          contratoSap: contratoSapVal || '4600000000',
          contratoJuridico: idxContratoJur !== -1 ? String(row[idxContratoJur] || '').trim() : '-',
          objeto: objetoVal || 'Sem objeto especificado',
          categoriaServico: categoria,
          dataInicio: dataInicioVal || '2025-01-01',
          dataFim: dataFimVal || '2026-12-31',
          valorContrato: valorContratoVal,
          fiscal: idxFiscal !== -1 ? String(row[idxFiscal] || '').trim() : '-',
          responsavelMedicao: idxMedicaoResp !== -1 ? String(row[idxMedicaoResp] || '').trim() : '-',
          temAditivo: temAditivoVal,
          temRepique: temRepiqueVal,
          obs: obsVal,
          responsavelResolver: idxResolver !== -1 ? String(row[idxResolver] || '').trim() : '-',
          medicoes: []
        };

        // generate mock measurements for newly loaded contracts to maintain consistency of the 6 measurements feature
        contrato.medicoes = generateMockMedicoes(contrato.valorContrato, contrato.dataInicio);
        parsedContracts.push(contrato);
      }

      resolve(parsedContracts);
    } catch (err) {
      reject(err);
    }
  });
}

export function exportSampleXls() {
  const headers = [
    'Fornecedor',
    'Nro. Contrato',
    'Nro. Juridico',
    'Objeto',
    'Inicio de Validade',
    'Fim de Validade',
    'Valor do contrato',
    'Fiscal',
    'Responsavel pela medição',
    'Aditivo',
    'Obs'
  ];
  
  const data = [
    [
      'A.D.B INDUSTRIA E COMERCIO LTDA',
      '4600081618',
      '20.242.737',
      'GMNL/GRMC - MANUTENÇÃO EM CENTRÍFUGA',
      '04/10/2024',
      '04/06/2026',
      '137600.00',
      'Clésio',
      'Luiz Wander',
      'sim',
      'Aditivo em andamento'
    ],
    [
      'AUGEN ENGENHARIA S.A',
      '4600082004',
      'A220240450',
      'GMNL - SERVIÇO DE MONITORAMENTO POÇOS',
      '15/03/2025',
      '15/03/2026',
      '50245.56',
      '',
      '',
      'não',
      'Pedencias de pagamentos de pedidos'
    ],
    [
      'LIMA SOLUÇÕES ENERGÉTICAS LTDA',
      '4600082305',
      '2024-3270',
      'GMNL - ARP - LOCAÇÃO GERADORES 12 A 1500KVA',
      '19/11/2024',
      '18/11/2025',
      '3820470.95',
      'Thiago Talma',
      'Luiz Wander',
      'sim',
      'Volume extraordinário'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contratos_SAP');
  
  XLSX.writeFile(wb, 'Modelo_Contratos_SAP.xlsx');
}

