import { Contrato, Medicao, NotificacoesConfig } from '../types';

// Helper to generate 6 sequential monthly measurements representing normal execution
function generateMedicoes(totalValue: number, usagePercent: number, startDateStr: string): Medicao[] {
  const list: Medicao[] = [];
  const totalSpent = totalValue * usagePercent;
  const averageMedicaoValue = totalSpent / 6;
  const start = new Date(startDateStr);

  for (let i = 1; i <= 6; i++) {
    const medDate = new Date(start.getTime());
    medDate.setMonth(start.getMonth() + i); // monthly interval
    
    // add small random variance (-10% to +10%)
    const variance = (Math.random() * 0.2 - 0.1) * averageMedicaoValue;
    const val = Math.round((averageMedicaoValue + variance) * 100) / 100;
    
    list.push({
      id: `m-${Math.random().toString(36).substr(2, 9)}`,
      numero: i,
      data: medDate.toISOString().split('T')[0],
      valor: Math.min(val, totalValue - list.reduce((sum, item) => sum + item.valor, 0))
    });
  }
  return list;
}

export const CATEGORIAS_SERVICO = [
  'Manutenção Especializada',
  'Locação de Geradores e Equipamentos',
  'Serviços Técnicos e Monitoramento',
  'Usinagem, Caldeiraria e Solda',
  'Obras e Adequações de Segurança',
  'Fornecimento de Materiais',
  'Outros Serviços'
];

export function getCategoriaByObjeto(objeto: string): string {
  const objUpper = objeto.toUpperCase();
  if (objUpper.includes('MANUTENÇÃO') || objUpper.includes('MANUTENÇÕES')) {
    return 'Manutenção Especializada';
  }
  if (objUpper.includes('LOCAÇÃO') || objUpper.includes('LOC.') || objUpper.includes('GERADORES') || objUpper.includes('SUBCONTRATO')) {
    return 'Locação de Geradores e Equipamentos';
  }
  if (objUpper.includes('MONITORAMENTO') || objUpper.includes('TÉCNICOS ESPECIALIZADOS') || objUpper.includes('SERVIÇOS TÉCNICOS')) {
    return 'Serviços Técnicos e Monitoramento';
  }
  if (objUpper.includes('TORNEARIA') || objUpper.includes('USINAGEM') || objUpper.includes('CALDEIRARIA') || objUpper.includes('SOLDA')) {
    return 'Usinagem, Caldeiraria e Solda';
  }
  if (objUpper.includes('ADEQUAÇÕES') || objUpper.includes('MELHORIAS') || objUpper.includes('OBRAS')) {
    return 'Obras e Adequações de Segurança';
  }
  if (objUpper.includes('FORNECIMENTO') || objUpper.includes('MATERIAIS')) {
    return 'Fornecimento de Materiais';
  }
  return 'Outros Serviços';
}

export const defaultContracts: Contrato[] = [
  {
    id: "c-1",
    fornecedor: "FAST ADB INDUSTRIA E COMERCIO LTDA",
    contratoSap: "4600081618",
    contratoJuridico: "20.242.737",
    objeto: "GMNL/GRMC - MANUTENÇÃO EM CENTRÍFUGA",
    categoriaServico: "Manutenção Especializada",
    dataInicio: "2024-10-04",
    dataFim: "2026-06-04",
    valorContrato: 137600.00,
    fiscal: "Clésio",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "sim",
    temRepique: "não",
    obs: "Aditivo em andamento",
    responsavelResolver: "Eduardo",
    medicoes: generateMedicoes(137600.00, 0.85, "2024-10-04")
  },
  {
    id: "c-2",
    fornecedor: "AUGEN ENGENHARIA S.A",
    contratoSap: "4600082004",
    contratoJuridico: "A220240450",
    objeto: "GMNL - SERVIÇO DE MONITORAMENTO POÇOS - SANTA CRUZ DO ESCALVADO",
    categoriaServico: "Serviços Técnicos e Monitoramento",
    dataInicio: "2025-03-15",
    dataFim: "2026-03-15",
    valorContrato: 50245.56,
    fiscal: "Clésio",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "Pedencias de pagamentos de pedidos",
    responsavelResolver: "",
    medicoes: generateMedicoes(50245.56, 0.95, "2025-03-15")
  },
  {
    id: "c-3",
    fornecedor: "G.M.P LOCAÇÕES DE MAQUINAS",
    contratoSap: "4600082201",
    contratoJuridico: "20.243.183",
    objeto: "GMNL/GRJA - BRASILÂNDIA DE MINAS - LOC. GERADORES",
    categoriaServico: "Locação de Geradores e Equipamentos",
    dataInicio: "2024-11-11",
    dataFim: "2026-07-11",
    valorContrato: 331315.00,
    fiscal: "Flávio",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "sim",
    temRepique: "não",
    obs: "Possibilidade de atendimento a demanda de locação pelo contrato do leste de locação de geradores, Thiago",
    responsavelResolver: "Thiago",
    medicoes: generateMedicoes(331315.00, 0.72, "2024-11-11")
  },
  {
    id: "c-4",
    fornecedor: "LIMA SOLUÇÕES ENERGÉTICAS LTDA",
    contratoSap: "4600082305",
    contratoJuridico: "2024-3270",
    objeto: "GMNL - ARP - LOCAÇÃO GERADORES 12 A 1500KVA",
    categoriaServico: "Locação de Geradores e Equipamentos",
    dataInicio: "2024-11-19",
    dataFim: "2025-11-18",
    valorContrato: 3820470.95,
    fiscal: "Thiago Talma",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "sim",
    temRepique: "sim",
    obs: "Volume extraordinário de manutenção no período",
    responsavelResolver: "",
    medicoes: generateMedicoes(3820470.95, 0.98, "2024-11-19")
  },
  {
    id: "c-5",
    fornecedor: "HIDRO ELETRICA LTDA",
    contratoSap: "4600082347",
    contratoJuridico: "20.243.274",
    objeto: "GMNL - MANUTENÇÃO CMB - SCHNEIDER, EBARA, FAMAC",
    categoriaServico: "Manutenção Especializada",
    dataInicio: "2025-02-14",
    dataFim: "2026-10-14",
    valorContrato: 177840.00,
    fiscal: "Adailton",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "Empresa não conseguiu atender a demanda de manutenção",
    responsavelResolver: "",
    medicoes: generateMedicoes(177840.00, 0.40, "2025-02-14")
  },
  {
    id: "c-6",
    fornecedor: "RAMAC INDÚSTRIA MECÂNICA LTDA",
    contratoSap: "4600082532",
    contratoJuridico: "20.243.303",
    objeto: "GMNL - SERVIÇOS DE MANUTENÇÃO, COM FORNECIMENTO TOTAL OU PARCIAL",
    categoriaServico: "Manutenção Especializada",
    dataInicio: "2025-01-28",
    dataFim: "2026-09-23",
    valorContrato: 898622.05,
    fiscal: "Adailton",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "",
    responsavelResolver: "",
    medicoes: generateMedicoes(898622.05, 0.65, "2025-01-28")
  },
  {
    id: "c-7",
    fornecedor: "CRISTON INDUSTRIA COMERCIO E SERVIÇOS",
    contratoSap: "4600082562",
    contratoJuridico: "20.243.628",
    objeto: "GMNL - MANUTENÇÃO EM INVERSORES DE FREQUÊNCIA",
    categoriaServico: "Manutenção Especializada",
    dataInicio: "2025-01-10",
    dataFim: "2026-09-10",
    valorContrato: 434500.00,
    fiscal: "Adailton",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "Empresa tem demorado em executar as manutenções",
    responsavelResolver: "",
    medicoes: generateMedicoes(434500.00, 0.58, "2025-01-10")
  },
  {
    id: "c-8",
    fornecedor: "RMV MOTORES ELÉTRICOS EIRELI",
    contratoSap: "4600082631",
    contratoJuridico: "20.243.644",
    objeto: "GMNL - SERVIÇOS TÉCNICOS ESPECIALIZADOS PARA PRESTAÇÃO",
    categoriaServico: "Serviços Técnicos e Monitoramento",
    dataInicio: "2025-02-03",
    dataFim: "2026-10-03",
    valorContrato: 316647.01,
    fiscal: "Clésio",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "",
    responsavelResolver: "",
    medicoes: generateMedicoes(316647.01, 0.70, "2025-02-03")
  },
  {
    id: "c-9",
    fornecedor: "USINORTE COMÉRCIO E SERVIÇOS EIRELI",
    contratoSap: "4600082959",
    contratoJuridico: "20.250.346",
    objeto: "GMNL - TORNEARIA, SOLDA, USINAGEM",
    categoriaServico: "Usinagem, Caldeiraria e Solda",
    dataInicio: "2025-02-14",
    dataFim: "2026-10-14",
    valorContrato: 841500.00,
    fiscal: "Estenio",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "",
    responsavelResolver: "",
    medicoes: generateMedicoes(841500.00, 0.78, "2025-02-14")
  },
  {
    id: "c-10",
    fornecedor: "CONSORCIO O & F",
    contratoSap: "4600082978",
    contratoJuridico: "20.250.351",
    objeto: "GMNL - ADEQUAÇÕES E MELHORIAS DE SEGURANÇA",
    categoriaServico: "Obras e Adequações de Segurança",
    dataInicio: "2025-05-08",
    dataFim: "2027-01-08",
    valorContrato: 6414058.73,
    fiscal: "Flávio",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "",
    responsavelResolver: "",
    medicoes: generateMedicoes(6414058.73, 0.35, "2025-05-08")
  },
  {
    id: "c-11",
    fornecedor: "LIMA SOLUÇÕES ENERGÉTICAS LTDA",
    contratoSap: "4600083008",
    contratoJuridico: "20.250.480",
    objeto: "GMNL - SUBCONTRATO LOCAÇÃO GERADORES - SPMN",
    categoriaServico: "Locação de Geradores e Equipamentos",
    dataInicio: "2025-02-24",
    dataFim: "2026-10-24",
    valorContrato: 1842995.60,
    fiscal: "Thiago Talma",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "",
    responsavelResolver: "",
    medicoes: generateMedicoes(1842995.60, 0.62, "2025-02-24")
  },
  {
    id: "c-12",
    fornecedor: "VTC DO BRASIL COMÉRCIO DE VÁLVULAS",
    contratoSap: "4600083757",
    contratoJuridico: "2025-1348",
    objeto: "GMNL/GRAL - JEQUITINHONHA E ITAOBIM - CMB",
    categoriaServico: "Locação de Geradores e Equipamentos",
    dataInicio: "2025-05-23",
    dataFim: "2026-02-22",
    valorContrato: 53800.00,
    fiscal: "Clésio",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "",
    responsavelResolver: "Denis / Eduardo",
    medicoes: generateMedicoes(53800.00, 0.90, "2025-05-23")
  },
  {
    id: "c-13",
    fornecedor: "DM CONTROLES ELÉTRICOS LTDA",
    contratoSap: "4600083834",
    contratoJuridico: "20.251.716",
    objeto: "GMNL - Execução, com fornecimento total de materiais, das obras e...",
    categoriaServico: "Obras e Adequações de Segurança",
    dataInicio: "2025-09-08",
    dataFim: "2027-05-08",
    valorContrato: 6987770.02,
    fiscal: "Thiago Talma",
    responsavelMedicao: "Aline",
    temAditivo: "não",
    temRepique: "pendente",
    obs: "Medição pendente de reajuste",
    responsavelResolver: "",
    medicoes: generateMedicoes(6987770.02, 0.44, "2025-09-08")
  },
  {
    id: "c-14",
    fornecedor: "MVL ENERGY - SOLUÇÕES EM EQUIPAM.",
    contratoSap: "4600084439",
    contratoJuridico: "20.252.063",
    objeto: "GMNL - MANUTENÇÃO TRANSF. ELÉTRICOS",
    categoriaServico: "Manutenção Especializada",
    dataInicio: "2025-08-01",
    dataFim: "2026-08-01",
    valorContrato: 326010.83,
    fiscal: "Thiago Talma",
    responsavelMedicao: "Aline",
    temAditivo: "sim",
    temRepique: "não",
    obs: "/Aditivo já está sendo solicitado",
    responsavelResolver: "",
    medicoes: generateMedicoes(326010.83, 0.81, "2025-08-01")
  },
  {
    id: "c-15",
    fornecedor: "PRES BRASIL VENDAS E MANUTENÇÃO",
    contratoSap: "4600084499",
    contratoJuridico: "20.252.238",
    objeto: "GMNL - MANUTENÇÕES CMB - ABS/SULZER",
    categoriaServico: "Manutenção Especializada",
    dataInicio: "2025-10-07",
    dataFim: "2027-06-07",
    valorContrato: 944000.00,
    fiscal: "Clésio",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "",
    responsavelResolver: "",
    medicoes: generateMedicoes(944000.00, 0.38, "2025-10-07")
  },
  {
    id: "c-16",
    fornecedor: "PRES BRASIL VENDAS E MANUTENÇÃO",
    contratoSap: "4600084501",
    contratoJuridico: "20.252.238",
    objeto: "GMNL - MANUTENÇÃO CMB - FLYGT",
    categoriaServico: "Manutenção Especializada",
    dataInicio: "2025-10-07",
    dataFim: "2027-06-07",
    valorContrato: 548000.00,
    fiscal: "Clésio",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "",
    responsavelResolver: "",
    medicoes: generateMedicoes(548000.00, 0.42, "2025-10-07")
  },
  {
    id: "c-17",
    fornecedor: "GERSON HILTON COUTINHO",
    contratoSap: "4600084823",
    contratoJuridico: "20.252.314",
    objeto: "GMNL/NLSA - TRANSPORTE DE CAIXAS DE COLETA",
    categoriaServico: "Outros Serviços",
    dataInicio: "2025-11-01",
    dataFim: "2026-11-01",
    valorContrato: 99162.96,
    fiscal: "Clésio",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "",
    responsavelResolver: "",
    medicoes: generateMedicoes(99162.96, 0.50, "2025-11-01")
  },
  {
    id: "c-18",
    fornecedor: "SULZER PUMPS WASTEWATER",
    contratoSap: "4600084988",
    contratoJuridico: "20.253.014",
    objeto: "CONJUNTO MOTOBOMBA - GMNL ETE VIEIRA",
    categoriaServico: "Usinagem, Caldeiraria e Solda",
    dataInicio: "2025-10-30",
    dataFim: "2026-04-30",
    valorContrato: 826979.76,
    fiscal: "Adailton",
    responsavelMedicao: "Eduardo",
    temAditivo: "não",
    temRepique: "não",
    obs: "CMBs enviadas com peça diferente da solicitada",
    responsavelResolver: "",
    medicoes: generateMedicoes(826979.76, 0.90, "2025-10-30")
  },
  {
    id: "c-19",
    fornecedor: "IMBIL INDÚSTRIA E MANUTENÇÃO",
    contratoSap: "4600085010",
    contratoJuridico: "20.252.997",
    objeto: "CONJUNTO MOTOBOMBA - GMNL",
    categoriaServico: "Usinagem, Caldeiraria e Solda",
    dataInicio: "2025-10-29",
    dataFim: "2026-04-29",
    valorContrato: 243781.92,
    fiscal: "Thiago Talma",
    responsavelMedicao: "Encerrado",
    temAditivo: "não",
    temRepique: "não",
    obs: "OK / Pago",
    responsavelResolver: "",
    medicoes: generateMedicoes(243781.92, 1.0, "2025-10-29")
  },
  {
    id: "c-20",
    fornecedor: "ALEX SILVA SOARES",
    contratoSap: "4600085223",
    contratoJuridico: "A220240451",
    objeto: "TORNEARIA E USINAGEM na GMNL/GRAL",
    categoriaServico: "Usinagem, Caldeiraria e Solda",
    dataInicio: "2025-11-06",
    dataFim: "2026-11-05",
    valorContrato: 56518.00,
    fiscal: "Aline",
    responsavelMedicao: "Adailton",
    temAditivo: "não",
    temRepique: "não",
    obs: "",
    responsavelResolver: "",
    medicoes: generateMedicoes(56518.00, 0.60, "2025-11-06")
  },
  {
    id: "c-21",
    fornecedor: "ESA ELETROTÉCNICA SANTO AMARO",
    contratoSap: "4600085654",
    contratoJuridico: "200086",
    objeto: "SERVIÇOS TÉCNICOS DE MANUTENÇÃO CORRETIVA E PREVENTIVA",
    categoriaServico: "Serviços Técnicos e Monitoramento",
    dataInicio: "2026-01-28",
    dataFim: "2027-09-27",
    valorContrato: 4718995.16,
    fiscal: "Adailton",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "",
    responsavelResolver: "",
    medicoes: generateMedicoes(4718995.16, 0.20, "2026-01-28")
  },
  {
    id: "c-22",
    fornecedor: "XYLEM BRASIL SOLUÇÕES PARA",
    contratoSap: "4600085842",
    contratoJuridico: "CT200439",
    objeto: "SERVIÇOS DE LOCAÇÃO DE CMB'S SUBMERSÍVEIS COM POTÊNCIAS VARIANDO",
    categoriaServico: "Locação de Geradores e Equipamentos",
    dataInicio: "2026-03-17",
    dataFim: "2027-03-17",
    valorContrato: 6158220.00,
    fiscal: "Flávio",
    responsavelMedicao: "Aline",
    temAditivo: "não",
    temRepique: "não",
    obs: "",
    responsavelResolver: "",
    medicoes: generateMedicoes(6158220.00, 0.15, "2026-03-17")
  },
  {
    id: "c-23",
    fornecedor: "VTC DO BRASIL COMÉRCIO DE VÁLVULAS",
    contratoSap: "4600085925",
    contratoJuridico: "CT200367",
    objeto: "conjunto motobomba - GMNL",
    categoriaServico: "Usinagem, Caldeiraria e Solda",
    dataInicio: "2026-03-18",
    dataFim: "2026-08-17",
    valorContrato: 101037.34,
    fiscal: "Clésio",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "",
    responsavelResolver: "",
    medicoes: generateMedicoes(101037.34, 0.40, "2026-03-18")
  },
  {
    id: "c-24",
    fornecedor: "NICOLAS TRATORES E PEÇAS LTDA",
    contratoSap: "4600085940",
    contratoJuridico: "720260198",
    objeto: "SERVIÇO DE USINAGEM E CALDEIRARIA - GRTO",
    categoriaServico: "Usinagem, Caldeiraria e Solda",
    dataInicio: "2026-03-09",
    dataFim: "2027-03-08",
    valorContrato: 68285.91,
    fiscal: "Luiz Wander",
    responsavelMedicao: "Luiz Wander",
    temAditivo: "não",
    temRepique: "não",
    obs: "",
    responsavelResolver: "",
    medicoes: generateMedicoes(68285.91, 0.25, "2026-03-09")
  }
];

export const defaultNotificationConfig: NotificacoesConfig = {
  emailDestinatario: "oadvogordo@gmail.com",
  alertas: [
    { dias: 120, ativo: true, canal: 'email', destinatarios: "oadvogordo@gmail.com" },
    { dias: 90,  ativo: true, canal: 'email', destinatarios: "oadvogordo@gmail.com" },
    { dias: 30,  ativo: true, canal: 'todos', destinatarios: "oadvogordo@gmail.com, fiscal@empresa.com" },
    { dias: 15,  ativo: true, canal: 'todos', destinatarios: "oadvogordo@gmail.com, fiscal@empresa.com, gerente@empresa.com" },
    { dias: 10,  ativo: true, canal: 'todos', destinatarios: "oadvogordo@gmail.com, fiscal@empresa.com, gerente@empresa.com" },
    { dias: 5,   ativo: true, canal: 'todos', destinatarios: "oadvogordo@gmail.com, fiscal@empresa.com, gerente@empresa.com, diretoria@empresa.com" },
    { dias: 1,   ativo: true, canal: 'todos', destinatarios: "oadvogordo@gmail.com, fiscal@empresa.com, gerente@empresa.com, diretoria@empresa.com" }
  ]
};
