export interface Medicao {
  id: string;
  numero: number; // 1 a 6
  data: string; // YYYY-MM-DD
  valor: number;
}

export interface Contrato {
  id: string;
  fornecedor: string;
  contratoSap: string; // inicia com 46000
  contratoJuridico: string;
  objeto: string;
  categoriaServico: string;
  dataInicio: string;  // formato YYYY-MM-DD
  dataFim: string;     // formato YYYY-MM-DD
  valorContrato: number;
  fiscal: string;
  responsavelMedicao: string;
  temAditivo: 'sim' | 'não' | 'em andamento';
  temRepique: 'sim' | 'não' | 'pendente';
  obs: string;
  responsavelResolver: string;
  medicoes: Medicao[]; // sempre 6 medições
}

export interface AlertaNotificacao {
  dias: number;
  ativo: boolean;
  canal: 'email' | 'sistema' | 'todos';
  destinatarios: string;
}

export interface NotificacoesConfig {
  emailDestinatario: string;
  alertas: AlertaNotificacao[];
}
