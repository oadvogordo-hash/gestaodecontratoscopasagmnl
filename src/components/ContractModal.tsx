import React, { useState } from 'react';
import { Contrato, Medicao } from '../types';
import { formatBRL, formatBrDate, getResumoFinanceiro } from '../utils/contractUtils';
import { X, Save, Plus, Trash2, TrendingUp, Calendar, ShieldCheck, DollarSign, ArrowUpRight } from 'lucide-react';

interface ContractModalProps {
  contrato: Contrato | null;
  onClose: () => void;
  onSave: (contratoAtualizado: Contrato) => void;
}

export default function ContractModal({ contrato, onClose, onSave }: ContractModalProps) {
  if (!contrato) return null;

  const [fornecedor, setFornecedor] = useState(contrato.fornecedor);
  const [contratoSap, setContratoSap] = useState(contrato.contratoSap);
  const [contratoJuridico, setContratoJuridico] = useState(contrato.contratoJuridico);
  const [objeto, setObjeto] = useState(contrato.objeto);
  const [categoriaServico, setCategoriaServico] = useState(contrato.categoriaServico);
  const [dataInicio, setDataInicio] = useState(contrato.dataInicio);
  const [dataFim, setDataFim] = useState(contrato.dataFim);
  const [valorContrato, setValorContrato] = useState(contrato.valorContrato);
  const [fiscal, setFiscal] = useState(contrato.fiscal);
  const [responsavelMedicao, setResponsavelMedicao] = useState(contrato.responsavelMedicao);
  const [temAditivo, setTemAditivo] = useState<any>(contrato.temAditivo);
  const [temRepique, setTemRepique] = useState<'sim' | 'não' | 'pendente'>(contrato.temRepique || 'não');
  const [obs, setObs] = useState(contrato.obs);
  const [responsavelResolver, setResponsavelResolver] = useState(contrato.responsavelResolver);
  
  // Last 6 measurements state
  const [medicoes, setMedicoes] = useState<Medicao[]>([...contrato.medicoes]);

  const handleMedicaoChange = (id: string, field: 'data' | 'valor', value: string | number) => {
    setMedicoes(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          [field]: field === 'valor' ? Number(value) || 0 : value
        };
      }
      return m;
    }));
  };

  const handleSave = () => {
    onSave({
      ...contrato,
      fornecedor,
      contratoSap,
      contratoJuridico,
      objeto,
      categoriaServico,
      dataInicio,
      dataFim,
      valorContrato,
      fiscal,
      responsavelMedicao,
      temAditivo,
      temRepique,
      obs,
      responsavelResolver,
      medicoes: medicoes.sort((a,b) => a.numero - b.numero)
    });
  };

  const financeiro = getResumoFinanceiro({
    ...contrato,
    valorContrato,
    medicoes
  });

  const totalMedido = financeiro.totalMedido;
  const saldoResidual = financeiro.saldoResidual;
  const percentualUtilizado = financeiro.percentualUtilizado;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col">
        
        {/* Modal Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              Sistemas SAP R/3
            </span>
            <h3 className="text-xl font-bold text-slate-800 mt-1">
              Contrato: {contratoSap || 'Novo Contrato'} • Jurídico: {contratoJuridico}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 px-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-8 flex-1">
          {/* Sessão 1: Informações Gerais */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-slate-600" />
              Informações Gerais do Contrato
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Empresa Prestadora (Fornecedor)</label>
                <input 
                  type="text" 
                  value={fornecedor} 
                  onChange={e => setFornecedor(e.target.value)} 
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-700 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Número do Contrato SAP</label>
                <input 
                  type="text" 
                  value={contratoSap} 
                  onChange={e => setContratoSap(e.target.value)} 
                  placeholder="Inicia com 46000..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Contrato Jurídico</label>
                <input 
                  type="text" 
                  value={contratoJuridico} 
                  onChange={e => setContratoJuridico(e.target.value)} 
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-700 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Objeto do Contrato</label>
                <textarea 
                  value={objeto} 
                  rows={2}
                  onChange={e => setObjeto(e.target.value)} 
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria de Serviço</label>
                <select 
                  value={categoriaServico} 
                  onChange={e => setCategoriaServico(e.target.value)} 
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-700"
                >
                  <option value="Manutenção Especializada">Manutenção Especializada</option>
                  <option value="Locação de Geradores e Equipamentos">Locação de Geradores e Equipamentos</option>
                  <option value="Serviços Técnicos e Monitoramento">Serviços Técnicos e Monitoramento</option>
                  <option value="Usinagem, Caldeiraria e Solda">Usinagem, Caldeiraria e Solda</option>
                  <option value="Obras e Adequações de Segurança">Obras e Adequações de Segurança</option>
                  <option value="Fornecimento de Materiais">Fornecimento de Materiais</option>
                  <option value="Outros Serviços">Outros Serviços</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Início da Validade</label>
                <input 
                  type="date" 
                  value={dataInicio} 
                  onChange={e => setDataInicio(e.target.value)} 
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Fim da Validade</label>
                <input 
                  type="date" 
                  value={dataFim} 
                  onChange={e => setDataFim(e.target.value)} 
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Valor do Contrato (R$)</label>
                <input 
                  type="number" 
                  value={valorContrato} 
                  onChange={e => setValorContrato(Number(e.target.value) || 0)} 
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-700 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tem Aditivo?</label>
                <select 
                  value={temAditivo} 
                  onChange={e => setTemAditivo(e.target.value)} 
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-700"
                >
                  <option value="não">Não</option>
                  <option value="sim">Sim</option>
                  <option value="em andamento">Em Andamento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tem Repique? (Readequação/Ajuste)</label>
                <select 
                  value={temRepique} 
                  onChange={e => setTemRepique(e.target.value as any)} 
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-700"
                >
                  <option value="não">Não</option>
                  <option value="sim">Sim</option>
                  <option value="pendente">Pendente de Reajuste</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Responsável Resolver Pendências</label>
                <input 
                  type="text" 
                  value={responsavelResolver} 
                  onChange={e => setResponsavelResolver(e.target.value)} 
                  placeholder="Ex: Eduardo"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Fiscal do Contrato</label>
                <input 
                  type="text" 
                  value={fiscal} 
                  onChange={e => setFiscal(e.target.value)} 
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Responsável pela Medição</label>
                <input 
                  type="text" 
                  value={responsavelMedicao} 
                  onChange={e => setResponsavelMedicao(e.target.value)} 
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-700"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Observações do Contrato</label>
                <input 
                  type="text" 
                  value={obs} 
                  onChange={e => setObs(e.target.value)} 
                  placeholder="Relatos, impedimentos ou comentários de acompanhamento"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Sessão 2: Resumo Financeiro Residual */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4.5 h-4.5 text-emerald-600" />
              Posição de Saldo Residual
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400">Valor Total do Contrato</p>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5">{formatBRL(valorContrato)}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Medido/Faturado</p>
                <p className="text-lg font-extrabold text-slate-700 mt-0.5">{formatBRL(totalMedido)}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-50 shadow-xs bg-emerald-50/20">
                <p className="text-[10px] uppercase font-bold text-emerald-600">Saldo Residual Disponível</p>
                <p className="text-lg font-extrabold text-emerald-700 mt-0.5">{formatBRL(saldoResidual)}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400">Percentual Consumido</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-lg font-extrabold text-slate-800">{percentualUtilizado}%</p>
                  <span className={`text-[10px] px-1.5 py-0.5 font-bold rounded-full ${percentualUtilizado > 85 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                    {percentualUtilizado > 85 ? 'Crítico' : 'Saudável'}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>0% Consumido</span>
                <span>{percentualUtilizado}% Utilizado</span>
                <span>100% (Limite SAP)</span>
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    percentualUtilizado > 90 
                      ? 'bg-rose-500' 
                      : percentualUtilizado > 70 
                      ? 'bg-amber-500' 
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, percentualUtilizado)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sessão 3: Últimas 6 Medições */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <TrendingUp className="w-4.5 h-4.5 text-slate-600" />
                Resumo das Últimas 6 Medições
              </h4>
              <p className="text-xs text-slate-500 italic">
                Últimos lançamentos de faturamento para cálculo do saldo residual.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs font-bold text-slate-500">
                <div>MEDIÇÃO / PARCELA</div>
                <div>DATA DO FATURAMENTO</div>
                <div className="text-right">VALOR DO LANÇAMENTO (R$)</div>
              </div>

              <div className="divide-y divide-slate-100">
                {medicoes.map((med, index) => (
                  <div key={med.id} className="grid grid-cols-3 px-4 py-2.5 items-center">
                    <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        {med.numero}
                      </span>
                      Medição #{med.numero}
                    </div>
                    <div>
                      <input 
                        type="date" 
                        value={med.data} 
                        onChange={e => handleMedicaoChange(med.id, 'data', e.target.value)} 
                        className="px-2 py-1 text-sm bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-slate-400 text-xs font-semibold">R$</span>
                      <input 
                        type="number" 
                        value={med.valor} 
                        onChange={e => handleMedicaoChange(med.id, 'valor', parseFloat(e.target.value))} 
                        className="w-32 px-2 py-1 text-sm text-right bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-hidden font-mono font-semibold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom SVG Trend Line Bar representing the 6 measurements */}
            <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Histórico Visual das Medições</p>
              <div className="flex items-end justify-between h-24 pt-2 px-6">
                {medicoes.map((m, idx) => {
                  const maxVal = Math.max(...medicoes.map(item => item.valor), 1);
                  const barHeight = (m.valor / maxVal) * 80; // scale to max 80% to fit labels
                  return (
                    <div key={m.id} className="flex flex-col items-center gap-1.5 flex-1">
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">
                        {formatBRL(m.valor).replace('R$', '').trim()}
                      </span>
                      <div 
                        className="w-8 bg-slate-400 hover:bg-slate-600 rounded-t-md transition-colors"
                        style={{ height: `${barHeight}px` }}
                        title={`Medição ${m.numero}: ${formatBRL(m.valor)}`}
                      />
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Med {m.numero}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-slate-50 z-10 px-6 py-4 border-t border-slate-150 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            * Alterações salvas serão computadas imediatamente para atualizar o saldo sob controle.
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
