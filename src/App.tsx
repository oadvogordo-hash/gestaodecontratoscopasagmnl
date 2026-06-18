import React, { useState, useMemo } from 'react';
import { Contrato, NotificacoesConfig } from './types';
import { defaultContracts, defaultNotificationConfig, CATEGORIAS_SERVICO } from './data/defaultContracts';
import { 
  formatBRL, 
  formatBrDate, 
  getDiasRestantes, 
  getResumoFinanceiro, 
  parseContractXls, 
  exportSampleXls 
} from './utils/contractUtils';
import ContractModal from './components/ContractModal';
import NotificationSettings from './components/NotificationSettings';
import { 
  Briefcase, 
  Calendar, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Download, 
  Plus, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Edit, 
  Wallet, 
  TrendingUp, 
  HelpCircle, 
  User, 
  FileText,
  Percent,
  XCircle
} from 'lucide-react';
import sapContractsIcon from './assets/images/sap_contracts_icon_1781804611937.jpg';

export default function App() {
  // Application State
  const [contratos, setContratos] = useState<Contrato[]>(defaultContracts);
  const [notifConfig, setNotifConfig] = useState<NotificacoesConfig>(defaultNotificationConfig);
  const [dataPesquisa, setDataPesquisa] = useState<string>('2026-06-18'); // Default local date specified in metadata
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFornecedor, setSelectedFornecedor] = useState<string>('todos');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  
  // UI Interaction States
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedContractForEdit, setSelectedContractForEdit] = useState<Contrato | null>(null);
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Stats / KPIs calculated dynamically from state
  const kpis = useMemo(() => {
    let valorGlobalTotal = 0;
    let totalMedidoGlobal = 0;
    
    contratos.forEach(c => {
      valorGlobalTotal += c.valorContrato;
      const res = getResumoFinanceiro(c);
      totalMedidoGlobal += res.totalMedido;
    });

    const saldoResidualGlobal = Math.max(0, valorGlobalTotal - totalMedidoGlobal);
    const percentualConsumidoGeral = valorGlobalTotal > 0 ? (totalMedidoGlobal / valorGlobalTotal) * 100 : 0;

    return {
      totalContratos: contratos.length,
      valorGlobalTotal,
      saldoResidualGlobal,
      percentualConsumidoGeral: Math.round(percentualConsumidoGeral * 100) / 100
    };
  }, [contratos]);

  // Expiration Alarm Categories
  const alarmsInfo = useMemo(() => {
    let criticos = 0; // expired or < 15 days
    let alerta = 0;   // 16 to 45 days
    let vigentes = 0; // > 45 days

    contratos.forEach(c => {
      const dias = getDiasRestantes(c.dataFim, dataPesquisa);
      if (dias <= 15) {
        criticos++;
      } else if (dias <= 45) {
        alerta++;
      } else {
        vigentes++;
      }
    });

    return { criticos, alerta, vigentes };
  }, [contratos, dataPesquisa]);

  // Unique lists for filtering dropdowns
  const fornecedoresUnicos = useMemo(() => {
    const list = contratos.map(c => c.fornecedor.trim());
    return ['todos', ...Array.from(new Set(list))].sort();
  }, [contratos]);

  const categoriasUnicas = useMemo(() => {
    const list = contratos.map(c => c.categoriaServico.trim());
    return ['todos', ...Array.from(new Set(list))].sort();
  }, [contratos]);

  // Filtered Contracts
  const filteredContracts = useMemo(() => {
    return contratos.filter(c => {
      const matchSearch = 
        c.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contratoSap.includes(searchTerm) ||
        c.contratoJuridico.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.objeto.toLowerCase().includes(searchTerm.toLowerCase());

      const matchFornecedor = selectedFornecedor === 'todos' || c.fornecedor.trim() === selectedFornecedor;
      const matchCategoria = selectedCategoria === 'todos' || c.categoriaServico.trim() === selectedCategoria;

      const dias = getDiasRestantes(c.dataFim, dataPesquisa);
      let matchStatus = true;
      if (selectedStatus === 'vigentes') {
        matchStatus = dias > 0;
      } else if (selectedStatus === 'vencidos') {
        matchStatus = dias <= 0;
      } else if (selectedStatus === 'a_vencer') {
        matchStatus = dias > 0 && dias <= 45;
      } else if (selectedStatus === 'criticos') {
        matchStatus = dias <= 15;
      } else if (selectedStatus === 'alerta') {
        matchStatus = dias > 15 && dias <= 45;
      } else if (selectedStatus === 'vigentes_regulares') {
        matchStatus = dias > 45;
      }

      return matchSearch && matchFornecedor && matchCategoria && matchStatus;
    });
  }, [contratos, searchTerm, selectedFornecedor, selectedCategoria, selectedStatus, dataPesquisa]);

  // Toggle Row Expand for Medições
  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Reset to initial PDF screenshot data sets
  const handleResetToDefault = () => {
    if (confirm("Deseja restaurar a base de contratos original do PDF? Quaisquer alterações locais serão substituídas.")) {
      setContratos(defaultContracts);
      setExpandedRows({});
    }
  };

  // Create new blank contract modal
  const handleOpenNewContract = () => {
    const newContract: Contrato = {
      id: `c-new-${Date.now()}`,
      fornecedor: "Nova Empresa Prestadora",
      contratoSap: "46000" + Math.floor(Math.random() * 90000 + 10000),
      contratoJuridico: "20.250." + Math.floor(Math.random() * 900 + 100),
      objeto: "Descrição do objeto do contrato...",
      categoriaServico: "Manutenção Especializada",
      dataInicio: dataPesquisa,
      dataFim: new Date(new Date(dataPesquisa).setFullYear(new Date(dataPesquisa).getFullYear() + 1)).toISOString().split('T')[0],
      valorContrato: 100000,
      fiscal: "Gestor Técnico",
      responsavelMedicao: "Luiz Wander",
      temAditivo: "não",
      temRepique: "não",
      obs: "",
      responsavelResolver: "",
      medicoes: [
        { id: `m1-${Date.now()}`, numero: 1, data: dataPesquisa, valor: 10000 },
        { id: `m2-${Date.now()}`, numero: 2, data: dataPesquisa, valor: 10000 },
        { id: `m3-${Date.now()}`, numero: 3, data: dataPesquisa, valor: 10000 },
        { id: `m4-${Date.now()}`, numero: 4, data: dataPesquisa, valor: 10000 },
        { id: `m5-${Date.now()}`, numero: 5, data: dataPesquisa, valor: 10000 },
        { id: `m6-${Date.now()}`, numero: 6, data: dataPesquisa, valor: 10000 },
      ]
    };
    setSelectedContractForEdit(newContract);
  };

  // Save Modal Edited Contract
  const handleSaveContract = (updated: Contrato) => {
    const exists = contratos.some(c => c.id === updated.id);
    if (exists) {
      setContratos(prev => prev.map(c => c.id === updated.id ? updated : c));
    } else {
      setContratos(prev => [updated, ...prev]);
    }
    setSelectedContractForEdit(null);
  };

  // Handlers for File Upload XLS
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(false);

    try {
      const buffer = await file.arrayBuffer();
      const newContracts = await parseContractXls(buffer);
      if (newContracts.length === 0) {
        throw new Error("Nenhum contrato pôde ser extraído. Verifique o cabeçalho e as linhas da planilha modelo.");
      }

      // Merge new contracts with existing ones, matching by SAP contract number
      setContratos(prev => {
        const cleanedPrev = [...prev];
        newContracts.forEach(newC => {
          const matchedIndex = cleanedPrev.findIndex(c => c.contratoSap === newC.contratoSap);
          if (matchedIndex !== -1) {
            // override existing
            cleanedPrev[matchedIndex] = {
              ...newC,
              id: cleanedPrev[matchedIndex].id // keep index id
            };
          } else {
            cleanedPrev.unshift(newC); // append to front
          }
        });
        return cleanedPrev;
      });

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (err: any) {
      setUploadError(err.message || "Erro desconhecido ao processar planilha.");
    } finally {
      // Clear input so same file can be uploaded again
      event.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    exportSampleXls();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-slate-200">
      
      {/* Top Professional Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <img 
              src={sapContractsIcon} 
              alt="Logo Gestor de Contratos" 
              className="w-11 h-11 rounded-xl shadow-sm border border-slate-200 object-cover"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">
                Acompanhamento e Medições
              </span>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Gestão de Contratos
              </h1>
            </div>
          </div>

          {/* Search Reference Date & User Info */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Real Search Date picker */}
            <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div className="text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">
                  Data da Pesquisa
                </span>
                <input 
                  type="date" 
                  value={dataPesquisa} 
                  onChange={(e) => setDataPesquisa(e.target.value)} 
                  className="bg-transparent border-0 p-0 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end text-right">
              <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>oadvogordo@gmail.com</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* KPI Grid Panel */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Contratos Ativos
              </span>
              <span className="text-3xl font-black text-slate-900 mt-1 block">
                {kpis.totalContratos}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                Filtros aplicados: {filteredContracts.length} de {contratos.length}
              </span>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Valor Global Estimado
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1.5 block">
                {formatBRL(kpis.valorGlobalTotal)}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                <CheckCircle className="w-3 h-3 inline" /> 100% de Lançamentos SAP
              </span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Saldo Residual Total
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-1.5 block">
                {formatBRL(kpis.saldoResidualGlobal)}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                {100 - kpis.percentualConsumidoGeral}% do orçamento livre
              </span>
            </div>
            <div className="p-3 bg-emerald-50/40 rounded-xl text-emerald-800">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Orçamento Utilizado
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900">
                  {kpis.percentualConsumidoGeral}%
                </span>
                <span className="text-xs font-bold text-slate-400">gasto</span>
              </div>
              <div className="w-32 bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-slate-800 h-full rounded-full" 
                  style={{ width: `${Math.min(100, kpis.percentualConsumidoGeral)}%` }}
                />
              </div>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700 font-bold">
              <Percent className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Alarm and Alerts Panel Row */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Alertas de Vencimento de Prazos (Pesquisa em: {formatBrDate(dataPesquisa)})
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Calculados dinamicamente em relação à data de pesquisa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/20 flex items-center gap-4.5">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xl">
                {alarmsInfo.criticos}
              </div>
              <div className="text-slate-700">
                <p className="text-xs font-bold text-rose-700 uppercase">Estado Crítico</p>
                <p className="text-sm font-extrabold mt-0.5">Expira em ≤ 15 dias ou já expirou</p>
                <p className="text-[10px] text-slate-500">Exige renovação jurídica ou aditivos urgentes.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/20 flex items-center gap-4.5">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
                {alarmsInfo.alerta}
              </div>
              <div className="text-slate-700">
                <p className="text-xs font-bold text-amber-700 uppercase font-sans">Atenção Próxima</p>
                <p className="text-sm font-extrabold mt-0.5">Expira em 16 a 45 dias</p>
                <p className="text-[10px] text-slate-500">Ideal para levantamento de orçamentos e prazos.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/10 flex items-center gap-4.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
                {alarmsInfo.vigentes}
              </div>
              <div className="text-slate-700">
                <p className="text-xs font-bold text-emerald-800 uppercase">Situação Regular</p>
                <p className="text-sm font-extrabold mt-0.5">Mais de 45 dias de vigência</p>
                <p className="text-[10px] text-slate-500">Operação fluida sob execução normal no SAP.</p>
              </div>
            </div>

          </div>
        </section>

        {/* Actions Bar: Upload Spreadsheet & Search / Custom filters */}
        <section className="bg-white rounded-2xl border border-slate-205 p-6 shadow-xs space-y-6">
          
          {/* Section Head: Management XLS import templates */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h3 className="text-md font-bold text-slate-800">Alimentação Automática via Planilha de Contratos</h3>
              <p className="text-xs text-slate-500 mt-1">
                Fórmula de extração automática de dados. Importe arquivos .xls / .xlsx gerados pelo SAP ou utilize o layout padrão.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Reset PDF default data */}
              <button
                onClick={handleResetToDefault}
                className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Restaurar a lista fornecida no documento original"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar Base PDF
              </button>

              {/* Download Standard Template */}
              <button
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 text-slate-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Baixar planilha de exemplo pré-formatada para teste"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                Planilha Modelo (.xlsx)
              </button>

              {/* Upload Input Style trigger */}
              <label className="px-4 py-2 bg-slate-800 hover:bg-slate-900 hover:shadow-md text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-xs">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Carregar Planilha XLS
                <input 
                  type="file" 
                  accept=".xls,.xlsx" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>

              {/* Manual insertion */}
              <button
                onClick={handleOpenNewContract}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Contrato SAP
              </button>
            </div>
          </div>

          {/* Upload Status messages */}
          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                Sucesso! Planilha processada. Contratos importados/sincronizados com a base mantendo as 6 medições simuladas.
              </span>
              <button onClick={() => setUploadSuccess(false)} className="text-emerald-500 hover:text-emerald-700">Ocultar</button>
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <XCircle className="w-4.5 h-4.5 text-rose-600" />
                Erro no Processamento: {uploadError}
              </span>
              <button onClick={() => setUploadError(null)} className="text-rose-500 hover:text-rose-700">Ocultar</button>
            </div>
          )}

          {/* Dual Dropdowns Filters Area */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Filtros Dinâmicos de Pesquisa
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Search text input */}
              <div className="relative lg:col-span-3 col-span-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por Fornecedor, Nº SAP, Jurídico ou Objeto..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 text-slate-700 font-medium transition-colors"
                />
              </div>

              {/* Supplier Dropdown Filter */}
              <div className="lg:col-span-3 col-span-1">
                <select
                  value={selectedFornecedor}
                  onChange={e => setSelectedFornecedor(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-450 focus:bg-white cursor-pointer"
                >
                  <option value="todos">Fornecedores: Todos</option>
                  {fornecedoresUnicos.filter(f => f !== 'todos').map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Service Category Dropdown Filter */}
              <div className="lg:col-span-3 col-span-1">
                <select
                  value={selectedCategoria}
                  onChange={e => setSelectedCategoria(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-450 focus:bg-white cursor-pointer"
                >
                  <option value="todos">Categorias: Todas</option>
                  {categoriasUnicas.filter(c => c !== 'todos').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Status de Vigência Dropdown Filter */}
              <div className="lg:col-span-3 col-span-1">
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-450 focus:bg-white cursor-pointer"
                >
                  <option value="todos">Status de Vigência: Todos</option>
                  <option value="vigentes">Vigentes (Ativos)</option>
                  <option value="vencidos">Vencidos (Expirados)</option>
                  <option value="a_vencer">A Vencer (Até 45 dias)</option>
                  <option value="criticos">Alerta Crítico (Até 15 dias ou expirados)</option>
                  <option value="alerta">Atenção Próxima (16 a 45 dias)</option>
                  <option value="vigentes_regulares">Situação Regular (Mais de 45 dias)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Interactive Core Table containing main features */}
          <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-xs bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[10.5px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-10">M_6</th>
                  <th className="py-3 px-4 min-w-[200px]">Empresa Prestadora (Fornecedor)</th>
                  <th className="py-3 px-4">Contratos (SAP / Jurídico)</th>
                  <th className="py-3 px-4 min-w-[150px]">Responsável</th>
                  <th className="py-3 px-4">Área / Categoria</th>
                  <th className="py-3 px-4">Prazos de Validade</th>
                  <th className="py-3 px-4 text-right">Valor Global</th>
                  <th className="py-3 px-4 text-center">Aditivo</th>
                  <th className="py-3 px-4 text-center">Repique</th>
                  <th className="py-3 px-4 text-right min-w-[120px]">Saldo Residual (% Utilizado)</th>
                  <th className="py-3 px-4 text-center w-20">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-500 italic font-medium bg-slate-50/50">
                      Nenhum contrato corresponde aos filtros aplicados. Tente reiniciar os filtros ou limpar a pesquisa.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map(c => {
                    const r = getResumoFinanceiro(c);
                    const isExpanded = !!expandedRows[c.id];
                    const diasRestantes = getDiasRestantes(c.dataFim, dataPesquisa);
                    const expired = diasRestantes <= 0;
                    
                    // define styling category based on remaining days
                    let badgeClass = "bg-emerald-100 text-emerald-800";
                    let rowBorderLeft = "border-l-4 border-l-emerald-500";
                    if (diasRestantes <= 15) {
                      badgeClass = "bg-rose-100 text-rose-800 animate-pulse";
                      rowBorderLeft = "border-l-4 border-l-rose-500 bg-rose-50/10";
                    } else if (diasRestantes <= 45) {
                      badgeClass = "bg-amber-100 text-amber-800 font-bold";
                      rowBorderLeft = "border-l-4 border-l-amber-500 bg-amber-50/5";
                    }

                    return (
                      <React.Fragment key={c.id}>
                        <tr className={`${rowBorderLeft} hover:bg-slate-50/70 transition-colors uppercase`}>
                          
                          {/* Toggle Expand 6 Medições button */}
                          <td className="py-4 px-4 text-center">
                            <button 
                              onClick={() => toggleRowExpand(c.id)}
                              className="p-1 rounded-sm hover:bg-slate-200 text-slate-500 cursor-pointer"
                              title="Mostrar últimas 6 medições"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>

                          {/* Fornecedor */}
                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-900 tracking-tight leading-tight">{c.fornecedor}</p>
                            {c.obs && (
                              <p className="text-[9.5px] text-slate-500 mt-1 capitalize font-medium italic border-l border-slate-300 pl-1.5 max-w-xs truncate" title={c.obs}>
                                Obs: {c.obs}
                              </p>
                            )}
                          </td>

                          {/* Contratos */}
                          <td className="py-4 px-4 font-mono font-semibold text-slate-600 space-y-0.5">
                            <p className="text-slate-900 font-bold">SAP: {c.contratoSap}</p>
                            <p className="text-[10px] text-slate-400">JUR: {c.contratoJuridico}</p>
                          </td>

                          {/* Responsável */}
                          <td className="py-4 px-4 min-w-[150px]">
                            <p className="font-bold text-slate-900 tracking-tight leading-tight">{c.fiscal || 'Não Informado'}</p>
                            {(c.responsavelMedicao || c.responsavelResolver) && (
                              <div className="text-[10px] text-slate-500 mt-1 space-y-0.5 font-medium border-t border-slate-100 pt-1">
                                {c.responsavelMedicao && (
                                  <p className="truncate" title={`Medição: ${c.responsavelMedicao}`}>
                                    <span className="text-slate-400 text-[9px] font-extrabold uppercase mr-1">Medição:</span>
                                    {c.responsavelMedicao}
                                  </p>
                                )}
                                {c.responsavelResolver && (
                                  <p className="truncate" title={`Resolutor: ${c.responsavelResolver}`}>
                                    <span className="text-slate-400 text-[9px] font-extrabold uppercase mr-1">Resolver:</span>
                                    {c.responsavelResolver}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Area / Categoria */}
                          <td className="py-4 px-3 text-slate-500 font-medium max-w-[150px] truncate" title={c.categoriaServico}>
                            {c.categoriaServico}
                          </td>

                          {/* Vigência / Prazos */}
                          <td className="py-4 px-4 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${badgeClass}`}>
                                {expired ? "Expirado" : `${diasRestantes} dias restantes`}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono font-bold">
                              {formatBrDate(c.dataInicio)} até {formatBrDate(c.dataFim)}
                            </p>
                          </td>

                          {/* Valor Global */}
                          <td className="py-4 px-4 text-right font-extrabold text-slate-900 font-mono">
                            {formatBRL(c.valorContrato)}
                          </td>

                          {/* Aditivo */}
                          <td className="py-4 px-4 text-center">
                            {c.temAditivo === 'sim' ? (
                              <span className="inline-block px-2 py-0.5 text-[9.5px] bg-emerald-100 text-emerald-800 font-extrabold rounded-full">SIM</span>
                            ) : c.temAditivo === 'em andamento' ? (
                              <span className="inline-block px-2 py-0.5 text-[9.5px] bg-amber-100 text-amber-800 font-extrabold rounded-full animate-pulse">EM ANDAMENTO</span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 text-[9.5px] bg-slate-100 text-slate-450 rounded-full font-bold">NÃO</span>
                            )}
                          </td>

                          {/* Repique */}
                          <td className="py-4 px-4 text-center font-bold">
                            {c.temRepique === 'sim' ? (
                              <span className="inline-block px-2 py-0.5 text-[9.5px] bg-emerald-100 text-emerald-800 font-extrabold rounded-full">REAJUSTADO</span>
                            ) : c.temRepique === 'pendente' ? (
                              <span className="inline-block px-2 py-0.5 text-[9.5px] bg-amber-100 text-amber-850 font-bold rounded-full">PENDENTE</span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 text-[9.5px] bg-slate-100 text-slate-450 rounded-full">NÃO</span>
                            )}
                          </td>

                          {/* Saldo Residual (% Utilizado) */}
                          <td className="py-4 px-4 text-right min-w-[130px] space-y-1">
                            <p className="font-extrabold text-slate-800 font-mono text-[13px]">{formatBRL(r.saldoResidual)}</p>
                            
                            <div className="flex items-center justify-end gap-1.5">
                              <span className={`text-[10px] font-bold ${r.percentualUtilizado > 85 ? 'text-rose-600 font-extrabold' : 'text-slate-500'}`}>
                                {r.percentualUtilizado}% usado
                              </span>
                              <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                                <div 
                                  className={`h-full rounded-full ${r.percentualUtilizado > 90 ? 'bg-rose-500' : r.percentualUtilizado > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(100, r.percentualUtilizado)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Editar trigger */}
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => setSelectedContractForEdit(c)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                              title="Editar contrato e medições"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </td>

                        </tr>

                        {/* Collapsed/Expanded row showcasing detailed list of last 6 measurements */}
                        {isExpanded && (
                          <tr className="bg-slate-50/40 border-l-4 border-l-slate-700">
                            <td colSpan={11} className="py-3 px-6 pb-4">
                              <div className="border border-slate-205 rounded-xl bg-white p-4 shadow-sm space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <h5 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    Detalhamento dos Lançamentos (Últimas 6 Medições)
                                  </h5>
                                  <p className="text-[10px] text-slate-550 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                                    Total Medido: {formatBRL(r.totalMedido)}
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                  {c.medicoes.map((med) => (
                                    <div key={med.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg space-y-1">
                                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase">
                                        <span>Med#{med.numero}</span>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                      </div>
                                      <p className="text-xs font-black text-slate-800 font-mono">{formatBRL(med.valor)}</p>
                                      <p className="text-[9.5px] text-slate-450 font-mono font-bold uppercase">{formatBrDate(med.data)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </section>

        {/* Centralized Notifications Control Panel View */}
        <section>
          <NotificationSettings 
            contratos={contratos}
            config={notifConfig}
            onUpdateConfig={setNotifConfig}
            dataPesquisa={dataPesquisa}
          />
        </section>

      </main>

      {/* Editor Modal Overlay */}
      {selectedContractForEdit && (
        <ContractModal 
          contrato={selectedContractForEdit}
          onClose={() => setSelectedContractForEdit(null)}
          onSave={handleSaveContract}
        />
      )}

      {/* Footer System Credits */}
      <footer className="bg-white border-t border-slate-200 mt-20 py-8 text-xs text-center text-slate-450 font-medium">
        <div className="max-w-7xl mx-auto px-4">
          <p>SISCONTRATOS • Controle Integrado de Vigência, Saldos Residuais e Alertas de Contratos SAP S/4HANA</p>
          <p className="mt-1 text-slate-400">Desenvolvido em conformidade para fiscalização de suprimentos e serviços industriais.</p>
        </div>
      </footer>

    </div>
  );
}
