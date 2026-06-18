import React, { useState } from 'react';
import { Contrato, NotificacoesConfig, AlertaNotificacao } from '../types';
import { getDiasRestantes, formatBRL, formatBrDate } from '../utils/contractUtils';
import { Bell, Mail, ToggleLeft, ToggleRight, Check, Send, AlertTriangle, Play, Sparkles, Clock } from 'lucide-react';

interface NotificationSettingsProps {
  contratos: Contrato[];
  config: NotificacoesConfig;
  onUpdateConfig: (newConfig: NotificacoesConfig) => void;
  dataPesquisa: string;
}

export default function NotificationSettings({ contratos, config, onUpdateConfig, dataPesquisa }: NotificationSettingsProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'trigger' | 'logs'>('config');
  const [emailInput, setEmailInput] = useState(config.emailDestinatario);
  const [simulatedLogs, setSimulatedLogs] = useState<Array<{ timestamp: string, type: string, text: string, details?: any }>>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: 'sistema',
      text: 'Serviço de disparo centralizado de e-mails de alerta inicializado com sucesso.'
    }
  ]);
  const [selectedSimulateContract, setSelectedSimulateContract] = useState<Contrato | null>(null);
  const [selectedSimulateDay, setSelectedSimulateDay] = useState<number>(30);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleToggleAlerta = (dias: number) => {
    const updatedAlertas = config.alertas.map(alerta => {
      if (alerta.dias === dias) {
        return { ...alerta, ativo: !alerta.ativo };
      }
      return alerta;
    });
    onUpdateConfig({
      ...config,
      alertas: updatedAlertas
    });
    
    const target = updatedAlertas.find(a => a.dias === dias);
    addLog('config', `Canal de alerta de ${dias} dias foi ${target?.ativo ? 'ATIVADO' : 'DESATIVADO'}.`);
  };

  const handleSaveEmail = () => {
    onUpdateConfig({
      ...config,
      emailDestinatario: emailInput,
      alertas: config.alertas.map(a => ({ ...a, destinatarios: emailInput }))
    });
    setSuccessMessage("Configurações de e-mail atualizadas!");
    addLog('config', `E-mail de recebimento alterado para: ${emailInput}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const addLog = (type: string, text: string, details?: any) => {
    setSimulatedLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        text,
        details
      },
      ...prev
    ]);
  };

  // Find contracts that are currently triggering any alerts based on the search date
  const contratosComAlertasAtivos = contratos.map(c => {
    const diasRestantes = getDiasRestantes(c.dataFim, dataPesquisa);
    const alertasQueCoincidem = config.alertas.filter(a => a.ativo && a.dias === diasRestantes);
    return {
      contrato: c,
      diasRestantes,
      alertasQueCoincidem
    };
  }).filter(item => item.alertasQueCoincidem.length > 0);

  // Run global simulation
  const handleSimulateGlobal = () => {
    addLog('simulacao', 'Iniciando varredura diária de prazos nos contratos ativos...');
    
    let matchesCount = 0;
    contratos.forEach(c => {
      const diasRestantes = getDiasRestantes(c.dataFim, dataPesquisa);
      
      config.alertas.forEach(alerta => {
        if (alerta.ativo && alerta.dias === diasRestantes) {
          matchesCount++;
          const msg = `ALERTA DISPARADO! Contrato SAP ${c.contratoSap} (${c.fornecedor}) está a exatamente ${diasRestantes} dias do vencimento.`;
          addLog('alerta', msg, {
            emailSentTo: alerta.destinatarios || config.emailDestinatario,
            contratoSap: c.contratoSap,
            fornecedor: c.fornecedor,
            vencimento: formatBrDate(c.dataFim),
            diasRestantes: diasRestantes,
            assunto: `[ALERTA DE FIM DE PRAZO - ${diasRestantes} DIAS] Contrato SAP ${c.contratoSap} - ${c.fornecedor}`
          });
        }
      });
    });

    if (matchesCount === 0) {
      addLog('sistema', `Varredura concluída. Nenhum contrato atingiu os limites exatos de disparo hoje (${formatBrDate(dataPesquisa)}) para os dias configurados.`);
    } else {
      addLog('sistema', `Varredura de alertas concluída com sucesso. ${matchesCount} e-mail(s) disparado(s) simuladamente.`);
    }
    setActiveTab('logs');
  };

  // Run single custom simulation trigger
  const handleTriggerSingleSimulation = () => {
    if (!selectedSimulateContract) return;

    const c = selectedSimulateContract;
    const dias = selectedSimulateDay;
    const assunto = `[AVISO DE EXPIRAÇÃO - ${dias} DIAS] Fiscalização de Contrato SAP: ${c.contratoSap}`;
    
    addLog('simulacao_manual', `Disparando SIMULAÇÃO de e-mail customizado de ${dias} dias para o contrato ${c.contratoSap}.`);
    
    addLog('alerta', `E-mail enviado! Contrato ${c.contratoSap} (${c.fornecedor}) simulado com prazo de ${dias} dias.`, {
      emailSentTo: config.emailDestinatario,
      contratoSap: c.contratoSap,
      fornecedor: c.fornecedor,
      vencimento: formatBrDate(c.dataFim),
      diasRestantes: dias,
      assunto
    });

    setActiveTab('logs');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-800">
            <Bell className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Canais e Notificações de Vencimento</h3>
            <p className="text-xs text-slate-500">
              Controle centralizado para e-mails automáticos quando faltar exatamente 120, 90, 30, 15, 10, 5 ou 1 dia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateGlobal}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Varrer Prazos Hoje
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 my-4 text-xs font-semibold text-slate-400">
        <button
          onClick={() => setActiveTab('config')}
          className={`pb-2 px-3 transition-colors border-b-2 -mb-0.5 ${activeTab === 'config' ? 'border-slate-800 text-slate-800 font-bold' : 'border-transparent hover:text-slate-600'}`}
        >
          Configurações de Gatilhos
        </button>
        <button
          onClick={() => setActiveTab('trigger')}
          className={`pb-2 px-3 transition-colors border-b-2 -mb-0.5 ${activeTab === 'trigger' ? 'border-slate-800 text-slate-800 font-bold' : 'border-transparent hover:text-slate-600'}`}
        >
          Simulador de E-mail
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2 px-3 transition-colors border-b-2 -mb-0.5 ${activeTab === 'logs' ? 'border-slate-800 text-slate-800 font-bold' : 'border-transparent hover:text-slate-600'}`}
        >
          Fila / Logs de Envio ({simulatedLogs.length})
        </button>
      </div>

      {/* Tab 1: Config */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Destinatário Padrão para os Alertas (E-mail)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                  placeholder="exemplo@empresa.com"
                />
              </div>
            </div>
            <div>
              <button
                onClick={handleSaveEmail}
                className="w-full py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                Salvar Destinatário
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping" />
              {successMessage}
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Gatilhos Configurados</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {config.alertas.map(alerta => (
                <div 
                  key={alerta.dias}
                  onClick={() => handleToggleAlerta(alerta.dias)}
                  className={`p-3.5 border rounded-xl cursor-pointer select-none transition-all duration-200 flex items-center justify-between ${
                    alerta.ativo 
                      ? 'border-slate-800 bg-slate-800 text-white shadow-xs' 
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-350 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <div>
                      <p className="text-sm font-bold">{alerta.dias} dias</p>
                      <p className={`text-[10px] ${alerta.ativo ? 'text-slate-200' : 'text-slate-400'}`}>antes do término</p>
                    </div>
                  </div>
                  {alerta.ativo ? (
                    <div className="text-emerald-400">
                      <span className="text-[10px] uppercase font-bold mr-1">Ativo</span>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      <span className="text-[10px] uppercase font-bold">Inativo</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Gatilhos que coincidem EXATAMENTE com a pesquisa hoje ({formatBrDate(dataPesquisa)})
            </h4>
            {contratosComAlertasAtivos.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-500 italic">
                Nenhum contrato possui vencimento no dia desta pesquisa caindo exatamente nas datas dos alertas disparadores. Clique em "Simulador de E-mail" para simular qualquer gatilho ou ajuste a data de pesquisa.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {contratosComAlertasAtivos.map(item => (
                  <div key={item.contrato.id} className="p-3.5 bg-amber-50/30 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">
                        Contrato SAP {item.contrato.contratoSap} - {item.contrato.fornecedor}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Objeto: {item.contrato.objeto.substring(0, 80)}...
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        Faltam {item.diasRestantes} dias! (Vence: {formatBrDate(item.contrato.dataFim)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Live Simulator / Manual trigger draft generator */}
      {activeTab === 'trigger' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-slate-700" />
              Simular Envio de Qualquer Alerta
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Selecione o Contrato</label>
                <select 
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-750 font-semibold"
                  value={selectedSimulateContract ? selectedSimulateContract.id : ''}
                  onChange={e => {
                    const match = contratos.find(c => c.id === e.target.value);
                    setSelectedSimulateContract(match || null);
                  }}
                >
                  <option value="">-- Selecionar Contrato --</option>
                  {contratos.map(c => (
                    <option key={c.id} value={c.id}>
                      [{c.contratoSap}] {c.fornecedor.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Gatilho de Dias a Testar</label>
                <select 
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-bold"
                  value={selectedSimulateDay}
                  onChange={e => setSelectedSimulateDay(Number(e.target.value))}
                >
                  <option value={120}>120 dias (Aviso de Planejamento)</option>
                  <option value={90}>90 dias (Replanejamento e Opção de Aditivo)</option>
                  <option value={30}>30 dias (Urgência de Formalização)</option>
                  <option value={15}>15 dias (Aviso Crítico)</option>
                  <option value={10}>10 dias (Período de Transição)</option>
                  <option value={5}>5 dias (Iminência de Encerramento)</option>
                  <option value={1}>1 dia (Último dia de Validade SAP)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleTriggerSingleSimulation}
                  disabled={!selectedSimulateContract}
                  className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    selectedSimulateContract 
                      ? 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer shadow-xs' 
                      : 'bg-slate-150 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Gerar E-mail Simulado
                </button>
              </div>
            </div>
          </div>

          {/* Live Dynamic HTML Draft Viewer */}
          {selectedSimulateContract && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-400 font-bold">DE:</span> srv-alertas@sap-contratos.com.br <br />
                  <span className="text-slate-400 font-bold">PARA:</span> {config.emailDestinatario} <br />
                  <span className="text-slate-400 font-bold">ASSUNTO:</span> <span className="text-slate-800 font-bold">[ALERTA {selectedSimulateDay} DIAS] Contrato SAP {selectedSimulateContract.contratoSap} - {selectedSimulateContract.fornecedor}</span>
                </div>
                <div className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-1 rounded-sm uppercase">
                  Rascunho Ativo
                </div>
              </div>

              {/* Email Content Box */}
              <div className="p-6 bg-white space-y-4 text-xs font-sans text-slate-700">
                <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-center">
                  <div className="font-extrabold text-sm tracking-wider text-slate-900">
                    SISCONTRATOS <span className="text-slate-400 font-light">| Alerta de Validade</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">ID Alerta: #{Math.floor(Math.random()*900000+100000)}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">Prezado Gestor / Fiscal da Medição,</p>
                  <p>
                    Constatamos em nosso sistema que o contrato referenciado abaixo está atingindo a marca de <strong>{selectedSimulateDay} dias</strong> para o encerramento da vigência estabelecida.
                  </p>
                </div>

                {/* Contract Spec Table */}
                <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between"><span className="text-slate-400 font-bold">Fornecedor:</span> <span className="font-bold text-slate-800">{selectedSimulateContract.fornecedor}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-bold">Nº Contrato SAP:</span> <span className="font-bold text-slate-800">{selectedSimulateContract.contratoSap}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-bold">Nº Contrato Jurídico:</span> <span className="font-semibold text-slate-700">{selectedSimulateContract.contratoJuridico}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-bold">Objeto:</span> <span className="text-slate-700 text-right max-w-sm shrink break-words">{selectedSimulateContract.objeto}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-bold">Valor Global:</span> <span className="font-bold text-slate-850">{formatBRL(selectedSimulateContract.valorContrato)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-bold">Término do Prazo:</span> <span className="font-bold text-rose-600">{formatBrDate(selectedSimulateContract.dataFim)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-bold">Fiscal Titular:</span> <span>{selectedSimulateContract.fiscal || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-bold">Responsável Medição:</span> <span>{selectedSimulateContract.responsavelMedicao || '-'}</span></div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-amber-850">
                    <p className="font-bold">Ação Geral Recomendada:</p>
                    {selectedSimulateDay >= 90 && <p>Iniciar negociações de aditivo de prazo/valor e avaliar saldo contratual restante de planejamento.</p>}
                    {selectedSimulateDay === 30 && <p>Atenção! Faltam 30 dias. Providenciar a formalização da renovação ou preparar o plano de encerramento com transição de fornecedor.</p>}
                    {selectedSimulateDay < 30 && <p>Ação Imediata! Risco de interrupção contratual iminente no sistema SAP R/3 que impedirá novos lançamentos de medição.</p>}
                  </div>
                </div>

                <p className="text-slate-500 italic text-[10px]">
                  Mensagem gerada de modo automatizado por srv-alertas@sap-contratos.com.br. Não responda diretamente a este e-mail.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
            <span>Registro acumulado de disparos na sessão</span>
            <button 
              onClick={() => {
                setSimulatedLogs([{
                  timestamp: new Date().toLocaleTimeString(),
                  type: 'sistema',
                  text: 'Registros limpos pelo operador.'
                }]);
              }}
              className="text-slate-600 hover:text-slate-800"
            >
              Limpar Logs
            </button>
          </div>

          <div className="bg-slate-900 text-slate-300 font-mono text-[11px] p-4 rounded-xl max-h-80 overflow-y-auto space-y-3 shadow-inner">
            {simulatedLogs.map((log, i) => (
              <div key={i} className="border-b border-slate-800 pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <span>[{log.timestamp}]</span>
                  <span className={`uppercase font-bold px-1.5 py-0.2 rounded-sm ${
                    log.type === 'alerta' ? 'bg-amber-900/40 text-amber-300 border border-amber-800' :
                    log.type === 'config' ? 'bg-blue-900/40 text-blue-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {log.type}
                  </span>
                </div>
                <div className={`${log.type === 'alerta' ? 'text-amber-200 font-semibold' : 'text-slate-300'}`}>
                  {log.text}
                </div>
                {log.details && (
                  <div className="mt-1.5 ml-4 p-2 bg-slate-950 text-slate-400 rounded-md space-y-0.5 border border-slate-800/60 leading-relaxed">
                    <p><span className="text-slate-500 font-bold">Para:</span> {log.details.emailSentTo}</p>
                    <p><span className="text-slate-500 font-bold">Assunto:</span> {log.details.assunto}</p>
                    <p><span className="text-slate-500 font-bold">Contrato Vigente Até:</span> {log.details.vencimento} ({log.details.diasRestantes} dias restantes)</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
