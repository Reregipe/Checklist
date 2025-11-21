import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { initialItems, obrasLvItems, obrasLmItems } from './dadosChecklist';
import { equipes, type Setor } from './equipes';

type LinhaChecklist = {
  id: number;
  tipo: string;
  qtdePadrao: number;
  descricao: string;
  somenteRural?: boolean;
  qtdeEncontrada: number | null;
  observacao: string;
  evidencias: string[];
};

type ModoChecklist = 'VIATURA' | 'COLABORADOR';
type TipoEquipe = 'URBANO' | 'RURAL';
type Etapa = 1 | 2;
type SetorSelecionado = Setor | '';

type ChecklistSalvo = {
  id: string;
  criadoEm: string;
  titulo: string;
  setor: SetorSelecionado;
  modalidadeObras: 'LV' | 'LM' | '';
  modoChecklist: ModoChecklist | '';
  codigoEquipe: string;
  tipoEquipe: TipoEquipe;
  eletricista1: string;
  eletricista2: string;
  responsavelChecklist: string;
  colaboradorIndividual: string;
  linhas: LinhaChecklist[];
};

const SALVAR_KEY = 'checklist-salvos';

export function Checklist() {
  const [linhas, setLinhas] = useState<LinhaChecklist[]>(
    initialItems.map((item) => ({
      ...item,
      qtdeEncontrada: null,
      observacao: '',
      evidencias: [],
    })),
  );
  const [linhasSnapshot, setLinhasSnapshot] = useState<LinhaChecklist[] | null>(null);

  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [tipoEquipe, setTipoEquipe] = useState<TipoEquipe>('URBANO');
  const [codigoEquipe, setCodigoEquipe] = useState<string>('');
  const [setor, setSetor] = useState<SetorSelecionado>('');
  const [modalidadeObras, setModalidadeObras] = useState<'LV' | 'LM' | ''>('');
  const [modoChecklist, setModoChecklist] = useState<ModoChecklist | ''>('');
  const [eletricista1, setEletricista1] = useState<string>('');
  const [eletricista2, setEletricista2] = useState<string>('');
  const [responsavelChecklist, setResponsavelChecklist] = useState<string>('');
  const [colaboradorIndividual, setColaboradorIndividual] = useState<string>('');
  const [conferido, setConferido] = useState<boolean>(false);
  const [confirmacaoFinal, setConfirmacaoFinal] = useState<boolean>(false);
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [checklistsSalvos, setChecklistsSalvos] = useState<ChecklistSalvo[]>(() => {
    try {
      const raw = localStorage.getItem(SALVAR_KEY);
      return raw ? (JSON.parse(raw) as ChecklistSalvo[]) : [];
    } catch {
      return [];
    }
  });

  // Troca a base de materiais conforme setor/modalidade (STC, Obras LV/LM)
  useEffect(() => {
    // Sem setor selecionado: não mostra itens
    if (!setor) {
      setLinhas([]);
      setFiltroTipo('TODOS');
      setConferido(false);
      setConfirmacaoFinal(false);
      setEtapa(1);
      return;
    }

    let base = initialItems;
    if (setor === 'OBRAS') {
      base = modalidadeObras === 'LV' ? obrasLvItems : obrasLmItems;
    }

    const ferramentasIndividuaisLv = new Set([
      // Ferramentas individuais LV (usadas pelo colaborador)
      2051, // Alicate universal nº 8
      2052, // Alicate bomba d’água isolado 1 kV
      2057, // Chave de fenda
      2060, // Chave com catraca (completa) isolação 1 kV
      2061, // Chave combinada 1/2" isolação 1 kV
      2062, // Chave combinada 3/4" isolação 1 kV
      2063, // Chave combinada 11/16" isolação 1 kV
      2064, // Chave combinada 5/8" isolação 1 kV
      2065, // Chave combinada 7/8" isolação 1 kV
      2066, // Chave combinada 9/16" isolação 1 kV
      2067, // Chave de regulagem 12" isolada 1 kV
      2068, // Chave de regulagem 8" isolada 1 kV
      2080, // Marreta 1 kg
      2081, // Marreta 2 kg
      2086, // Tesourão com cabo isolado pequeno
      2089, // Alicate com cremalheira para corte de cabo com alma de aço
    ]);

    const baseComClassificacao =
      setor === 'OBRAS' && modalidadeObras === 'LV'
        ? base.map((item) =>
            ferramentasIndividuaisLv.has(item.id)
              ? { ...item, tipo: 'Ferr. Ind' }
              : item,
          )
        : base;

    setLinhas(
      baseComClassificacao.map(
        (item) =>
          ({
            ...(item as any),
            qtdeEncontrada: null,
            observacao: '',
            evidencias: (item as any).evidencias ?? [],
          } as LinhaChecklist),
      ),
    );
    if (linhasSnapshot) {
      setLinhas(linhasSnapshot);
      setLinhasSnapshot(null);
    }

    setFiltroTipo('TODOS');
    if (setor === 'STC') {
      setTipoEquipe('URBANO');
    }
    setConferido(false);
    setConfirmacaoFinal(false);
    setEtapa(1);
  }, [setor, modalidadeObras]);

  const tipos = useMemo(() => {
    if (!setor || !modoChecklist) {
      return ['TODOS'];
    }

    if (modoChecklist === 'VIATURA') {
      return ['TODOS', 'EPC', 'Ferr. Colet'];
    }

    // COLABORADOR: EPI + Ferramenta individual
    return ['TODOS', 'EPI', 'Ferr. Ind'];
  }, [modoChecklist, setor]);

  const cabecalhoValido = useMemo(() => {
    if (modoChecklist === 'VIATURA') {
      if (setor === 'STC') {
        return Boolean(
          codigoEquipe &&
            eletricista1.trim() &&
            eletricista2.trim() &&
            responsavelChecklist.trim(),
        );
      }
      // Obras (caminhão) – equipe + encarregado (eletricista1) + responsável
      return Boolean(
        codigoEquipe && eletricista1.trim() && responsavelChecklist.trim(),
      );
    }
    // COLABORADOR (STC ou Obras)
    return Boolean(
      colaboradorIndividual.trim() && responsavelChecklist.trim(),
    );
  }, [
    setor,
    modoChecklist,
    codigoEquipe,
    eletricista1,
    eletricista2,
    colaboradorIndividual,
    responsavelChecklist,
  ]);

  const equipesFiltradas = useMemo(
    () =>
      equipes.filter((equipe) => {
        if (equipe.setor !== setor) return false;
        if (setor === 'OBRAS' && modalidadeObras) {
          return equipe.modalidadeObras === modalidadeObras;
        }
        return true;
      }),
    [setor, modalidadeObras],
  );

  const linhasFiltradas = useMemo(
    () =>
      linhas.filter((linha) => {
        if (tipoEquipe === 'URBANO' && linha.somenteRural) {
          return false;
        }

        if (
          (modoChecklist === 'VIATURA' &&
            !(linha.tipo === 'EPC' || linha.tipo === 'Ferr. Colet')) ||
          (modoChecklist === 'COLABORADOR' &&
            !(linha.tipo === 'EPI' || linha.tipo === 'Ferr. Ind'))
        ) {
          return false;
        }

        if (filtroTipo !== 'TODOS' && linha.tipo !== filtroTipo) {
          return false;
        }

        return true;
      }),
    [linhas, filtroTipo, tipoEquipe, modoChecklist],
  );

  const faltando = useMemo(
    () =>
      conferido
        ? linhasFiltradas.filter(
            (linha) => (linha.qtdeEncontrada ?? 0) < linha.qtdePadrao,
          )
        : [],
    [linhasFiltradas, conferido],
  );

  const filtrosPreenchidos = useMemo(() => {
    if (!setor) return false;
    if (setor === 'OBRAS' && !modalidadeObras) return false;
    if (!modoChecklist) return false;

    if (modoChecklist === 'VIATURA') {
      // Viatura / Caminhão → exige equipe selecionada
      return Boolean(codigoEquipe);
    }

    // Colaborador → exige nome do colaborador
    return Boolean(colaboradorIndividual.trim());
  }, [setor, modalidadeObras, modoChecklist, codigoEquipe, colaboradorIndividual]);

  function salvarChecklistLocal(snapshot: Omit<ChecklistSalvo, 'id' | 'criadoEm'>) {
    const novo: ChecklistSalvo = {
      ...snapshot,
      id: `${Date.now()}`,
      criadoEm: new Date().toISOString(),
    };
    const atualizados = [novo, ...checklistsSalvos].slice(0, 10);
    setChecklistsSalvos(atualizados);
    localStorage.setItem(SALVAR_KEY, JSON.stringify(atualizados));
  }

  function atualizarLinha(
    id: number,
    campo: keyof LinhaChecklist,
    valor: string | number | null,
  ) {
    setLinhas((anteriores) =>
      anteriores.map((linha) =>
        linha.id === id ? ({ ...linha, [campo]: valor } as LinhaChecklist) : linha,
      ),
    );
    if (conferido) {
      setConferido(false);
      setEtapa(1);
    }
    if (confirmacaoFinal) {
      setConfirmacaoFinal(false);
    }
  }

  function adicionarEvidencia(id: number, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLinhas((anteriores) =>
        anteriores.map((linha) =>
          linha.id === id
            ? { ...linha, evidencias: [...(linha.evidencias || []), dataUrl] }
            : linha,
        ),
      );
      if (conferido) {
        setConferido(false);
        setEtapa(1);
      }
      if (confirmacaoFinal) {
        setConfirmacaoFinal(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function conferirDivergencias() {
    if (!cabecalhoValido) {
      alert(
        modoChecklist === 'VIATURA'
          ? 'Preencha Equipe, Eletricista 1, Eletricista 2 e Responsável antes de finalizar.'
          : 'Preencha Colaborador e Responsável antes de finalizar.',
      );
      return;
    }
    setConferido(true);
    setEtapa(2);

    const snapshotTitulo =
      modoChecklist === 'VIATURA'
        ? `Caminhão/Viatura ${codigoEquipe || 'sem equipe'}`
        : `Colaborador ${colaboradorIndividual || 'sem nome'}`;

    salvarChecklistLocal({
      titulo: snapshotTitulo,
      setor,
      modalidadeObras,
      modoChecklist,
      codigoEquipe,
      tipoEquipe,
      eletricista1,
      eletricista2,
      responsavelChecklist,
      colaboradorIndividual,
      linhas,
    });
  }

  function iniciarNovoChecklist() {
    setLinhas(
      initialItems.map(
        (item) =>
          ({
            ...(item as any),
            qtdeEncontrada: null,
            observacao: '',
            evidencias: [],
          } as LinhaChecklist),
      ),
    );
    setFiltroTipo('TODOS');
    setTipoEquipe('URBANO');
    setCodigoEquipe('');
    setModoChecklist('VIATURA');
    setEletricista1('');
    setEletricista2('');
    setResponsavelChecklist('');
    setColaboradorIndividual('');
    setConferido(false);
    setConfirmacaoFinal(false);
    setEtapa(1);
  }

  async function exportarPDF() {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo menor
    try {
      const img = new Image();
      img.src = 'logo-engeletrica.png';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Erro ao carregar logo'));
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 10, 10, 25, 10);
      }
    } catch {
      // se não conseguir carregar a logo, segue sem
    }

    // Título
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Checklist EPI / EPC / Ferramental', pageWidth / 2, 18, {
      align: 'center',
    });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Cabeçalho em duas colunas
    let currentY = 26;
    const leftX = 10;
    const rightX = pageWidth / 2 + 5;

    const writeHeaderLine = (left: string, right: string) => {
      doc.text(left, leftX, currentY);
      doc.text(right, rightX, currentY);
      currentY += 5;
    };

    const labelTipoChecklist =
      modoChecklist === 'VIATURA'
        ? setor === 'OBRAS'
          ? 'Caminhão'
          : 'Viatura'
        : 'Colaborador';

    writeHeaderLine(
      `Tipo de checklist: ${labelTipoChecklist}`,
      `Data/Hora: ${new Date().toLocaleString()}`,
    );
    writeHeaderLine(
      `Equipe: ${codigoEquipe || ''}`,
      `Tipo de equipe: ${
        tipoEquipe === 'RURAL' ? 'Atendimento rural' : 'Atendimento urbano'
      }`,
    );
    writeHeaderLine(
      `Eletricista 1: ${eletricista1 || ''}`,
      `Eletricista 2: ${eletricista2 || ''}`,
    );
    writeHeaderLine(
      `Colaborador: ${colaboradorIndividual || ''}`,
      `Responsável: ${responsavelChecklist || ''}`,
    );

    const body = linhasFiltradas.map((linha) => [
      linha.tipo,
      linha.descricao,
      linha.qtdeEncontrada ?? '',
      linha.observacao || '',
    ]);

    autoTable(doc, {
      startY: currentY + 2,
      head: [['Tipo', 'Descrição', 'Qtde encontrada', 'Observação']],
      body,
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [229, 229, 229],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 90 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 50 },
      },
      margin: { left: 10, right: 10 },
    });

    // Assinaturas
    const lastTableY =
      (doc as any).lastAutoTable?.finalY != null
        ? (doc as any).lastAutoTable.finalY
        : currentY + 2;

    const sigStartY = lastTableY + 15;
    doc.setFontSize(10);

    doc.text(
      `Colaborador / Equipe: ${colaboradorIndividual || eletricista1 || codigoEquipe || ''}`,
      10,
      sigStartY,
    );
    doc.text(
      'Assinatura: _____________________________',
      pageWidth / 2,
      sigStartY,
    );

    const sig2Y = sigStartY + 10;
    doc.text(`Responsável: ${responsavelChecklist || ''}`, 10, sig2Y);
    doc.text(
      'Assinatura: _____________________________',
      pageWidth / 2,
      sig2Y,
    );

    doc.save('checklist_epi_epc_ferramental.pdf');
  }

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="logo-engeletrica.png" alt="Engeletrica" style={{ height: 40 }} />
          <div>
            <h1 className="app-title">Checklist de Equipes</h1>
            <p className="app-subtitle">Conferencia EPI / EPC / Ferramental</p>
          </div>
        </div>
      </header>

      {etapa === 1 && (
        <>
          <div className="filters-card">
            <div className="filters-grid">
                <div className="filter-group">
                  <span className="filter-label">Setor</span>
                  <select
                    className="filter-control"
                    value={setor}
                    onChange={(e) => {
                      const value = e.target.value as SetorSelecionado;
                      setSetor(value);
                      setCodigoEquipe('');
                      setModalidadeObras('');
                      setConferido(false);
                      setEtapa(1);
                    }}
                  >
                    <option value="">Selecione...</option>
                    <option value="STC">STC</option>
                    <option value="OBRAS">Obras</option>
                  </select>
                </div>

              {setor === 'OBRAS' && (
                <div className="filter-group">
                  <span className="filter-label">Modalidade</span>
                  <select
                    className="filter-control"
                    value={modalidadeObras}
                    onChange={(e) => {
                      const value = e.target.value;
                      setModalidadeObras(
                        value === 'LV' || value === 'LM' ? value : '',
                      );
                      setConferido(false);
                      setEtapa(1);
                    }}
                  >
                    <option value="">Selecione...</option>
                    <option value="LV">Linha Viva (LV)</option>
                    <option value="LM">Linha Morta (LM)</option>
                  </select>
                </div>
              )}

              <div className="filter-group">
                <span className="filter-label">Tipo de checklist</span>
                <select
                  className="filter-control"
                  value={modoChecklist}
                  onChange={(e) => {
                    const value = e.target.value as '' | ModoChecklist;
                    setModoChecklist(value);
                    setFiltroTipo('TODOS');
                    setConferido(false);
                    setEtapa(1);
                  }}
                >
                  <option value="">Selecione...</option>
                  <option value="VIATURA">
                    {setor === 'OBRAS' ? 'Caminhão' : 'Viatura'}
                  </option>
                  <option value="COLABORADOR">Colaborador</option>
                </select>
              </div>

              {modoChecklist === 'VIATURA' && (
                <>
                  <div className="filter-group">
                    <span className="filter-label">Equipe</span>
                    <select
                      className="filter-control"
                      value={codigoEquipe}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCodigoEquipe(value);
                        if (value.startsWith('ECB') || value.startsWith('EMS')) {
                          setTipoEquipe('URBANO');
                        } else if (value) {
                          setTipoEquipe('RURAL');
                        }
                        setConferido(false);
                        setEtapa(1);
                      }}
                    >
                        <option value="">Selecione...</option>
                        {equipesFiltradas.map((equipe) => (
                          <option key={equipe.codigo} value={equipe.codigo}>
                            {equipe.descricao}
                          </option>
                        ))}
                      </select>
                    </div>

                    {setor === 'OBRAS' ? (
                      <div className="filter-group">
                        <span className="filter-label">Encarregado</span>
                        <input
                          className="filter-control"
                          type="text"
                          value={eletricista1}
                          onChange={(e) => setEletricista1(e.target.value)}
                          placeholder="Nome completo do encarregado"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="filter-group">
                          <span className="filter-label">Eletricista 1</span>
                          <input
                            className="filter-control"
                            type="text"
                            value={eletricista1}
                            onChange={(e) => setEletricista1(e.target.value)}
                            placeholder="Nome completo do eletricista 1"
                          />
                        </div>

                        <div className="filter-group">
                          <span className="filter-label">Eletricista 2</span>
                          <input
                            className="filter-control"
                            type="text"
                            value={eletricista2}
                            onChange={(e) => setEletricista2(e.target.value)}
                            placeholder="Nome completo do eletricista 2"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

              {modoChecklist === 'COLABORADOR' && (
                <div className="filter-group">
                  <span className="filter-label">Colaborador</span>
                  <input
                    className="filter-control"
                    type="text"
                    value={colaboradorIndividual}
                    onChange={(e) => setColaboradorIndividual(e.target.value)}
                    placeholder="Nome completo do colaborador"
                  />
                </div>
              )}

              <div className="filter-group">
                <span className="filter-label">Responsavel</span>
                <input
                  className="filter-control"
                  type="text"
                  value={responsavelChecklist}
                  onChange={(e) => setResponsavelChecklist(e.target.value)}
                  placeholder="Quem realizou o checklist"
                />
              </div>

              {setor === 'STC' && modoChecklist === 'VIATURA' && codigoEquipe && (
                <div className="filter-group">
                  <span className="filter-label">Tipo de equipe</span>
                  <div>
                    <span
                      className={tipoEquipe === 'RURAL' ? 'tag rural' : 'tag urbano'}
                    >
                      {tipoEquipe === 'RURAL'
                        ? 'Atendimento rural'
                        : 'Atendimento urbano'}
                    </span>
                  </div>
                </div>
              )}

              <div className="filter-group">
                <span className="filter-label">Tipo de item</span>
                <select
                  className="filter-control"
                  value={filtroTipo}
                  onChange={(e) => {
                    setFiltroTipo(e.target.value);
                    setConferido(false);
                    setEtapa(1);
                  }}
                >
                  {tipos.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filters-grid" style={{ marginTop: '0.5rem' }}>
              {/* seção de checklists salvos removida a pedido */}
            </div>

            <div className="filters-actions">
              <label
                className="filter-label"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  letterSpacing: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={confirmacaoFinal}
                  onChange={(e) => setConfirmacaoFinal(e.target.checked)}
                />
                <span>
                  Confirmo que revisei o checklist e informei todas as divergencias.
                </span>
              </label>

              <button
                type="button"
                className="primary"
                onClick={conferirDivergencias}
                disabled={!confirmacaoFinal}
              >
                Finalizar checklist
              </button>
            </div>
          </div>

          {filtrosPreenchidos && (
            <div className="table-card">
              <div className="table-wrapper">
                <table className="checklist-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Descricao</th>
                      <th style={{ textAlign: 'center' }}>Qtde encontrada</th>
                      <th>Observacao</th>
                      <th>Evidencias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhasFiltradas.map((linha) => (
                      <tr key={linha.id}>
                        <td>{linha.tipo}</td>
                        <td>{linha.descricao}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            className="checklist-input-number"
                            type="number"
                            min={0}
                            value={linha.qtdeEncontrada ?? ''}
                            onChange={(e) =>
                              atualizarLinha(
                                linha.id,
                                'qtdeEncontrada',
                                e.target.value === '' ? null : Number(e.target.value),
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="checklist-input-text"
                            type="text"
                            value={linha.observacao}
                            onChange={(e) =>
                              atualizarLinha(linha.id, 'observacao', e.target.value)
                            }
                            placeholder="Ex: falta 1 unidade, fora da validade..."
                          />
                        </td>
                        <td>
                          <div className="evidencias-cell">
                            <div className="evidencias-list">
                              {linha.evidencias && linha.evidencias.length > 0 ? (
                                linha.evidencias.map((ev, idx) => (
                                  <a
                                    key={idx}
                                    href={ev}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="evidencia-link"
                                  >
                                    Ver {idx + 1}
                                  </a>
                                ))
                              ) : (
                                <span className="hint">Sem evidencias</span>
                              )}
                            </div>
                            <label className="upload-btn">
                              Anexar
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    adicionarEvidencia(linha.id, f);
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {etapa === 2 && (
        <div className="summary-card">
          <div className="summary-header">
            <div>
              <h2 className="summary-title">Checklist finalizado</h2>
              <p className="summary-status">
                {modoChecklist === 'VIATURA' ? 'Viatura' : 'Colaborador'} ·{' '}
                {codigoEquipe || colaboradorIndividual || 'Sem identificação'} ·{' '}
                {new Date().toLocaleString()}
              </p>
            </div>
            <span className="tag sucesso">Concluido</span>
          </div>
          <p className="summary-hint">
            Processo concluido. Revise abaixo as divergencias apontadas e gere o PDF
            para registro e assinatura.
          </p>

          {faltando.length === 0 ? (
            <p className="summary-hint">Nao ha materiais faltando.</p>
          ) : (
            <div className="summary-table-wrapper">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Descricao</th>
                    <th>Qtde encontrada</th>
                    <th>Falta</th>
                  </tr>
                </thead>
                <tbody>
                  {faltando.map((linha) => {
                    const encontrada = linha.qtdeEncontrada ?? 0;
                    const falta = linha.qtdePadrao - encontrada;
                    return (
                      <tr key={linha.id}>
                        <td>{linha.tipo}</td>
                        <td>{linha.descricao}</td>
                        <td style={{ textAlign: 'center' }}>{encontrada}</td>
                        <td className="summary-falta">{falta}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="filters-actions" style={{ marginTop: '0.75rem' }}>
            <button type="button" onClick={iniciarNovoChecklist}>
              Realizar novo checklist
            </button>
            <button type="button" className="primary" onClick={exportarPDF}>
              Exportar para PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
