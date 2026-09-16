// ==========================================
// MANUAL PRÁTICO MOODLE - ESAP / PGE-RJ
// Interatividade, Checklist, Rubrica & Exportação PDF
// ==========================================

let dadosTreinamento = {
    nome: '',
    data: '',
    ambiente: 'https://esap.pge.rj.gov.br/'
};

// Canvas da rúbrica
let canvas = null;
let ctx = null;
let desenhando = false;
let temRubrica = false;

// Inicialização ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
    // Definir data padrão de hoje no input de data
    const inputData = document.getElementById('dataAtividade');
    if (inputData && !inputData.value) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        inputData.value = `${ano}-${mes}-${dia}`;
    }

    // Permitir iniciar com Enter no input de nome
    const inputNome = document.getElementById('nomeParticipante');
    if (inputNome) {
        inputNome.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') iniciarTreinamento();
        });
    }

    // Inicializar listeners nos checkboxes da rubrica
    document.querySelectorAll('.rubrica-cb').forEach((cb) => {
        cb.addEventListener('change', () => {
            atualizarRubrica();
        });
    });

    // Inicializar listeners nos botões de resultado
    document.querySelectorAll('input[name="resultado"]').forEach((rb) => {
        rb.addEventListener('change', () => {
            atualizarResultado();
        });
    });
});

// ==========================================
// TRANSIÇÃO DE TELA E INICIALIZAÇÃO
// ==========================================
function iniciarTreinamento() {
    const inputNome = document.getElementById('nomeParticipante');
    const inputData = document.getElementById('dataAtividade');
    const inputAmbiente = document.getElementById('ambienteMoodle');

    const nome = inputNome.value.trim();
    if (!nome) {
        alert('Por favor, informe o Nome do Participante para continuar.');
        inputNome.focus();
        return;
    }

    dadosTreinamento.nome = nome;
    dadosTreinamento.data = formatarDataBr(inputData.value);
    dadosTreinamento.ambiente = inputAmbiente.value.trim() || 'https://esap.pge.rj.gov.br/';

    // Atualizar labels no documento
    const displayNome = document.getElementById('displayNome');
    if (displayNome) displayNome.textContent = dadosTreinamento.nome;

    const displayData = document.getElementById('displayData');
    if (displayData) displayData.textContent = dadosTreinamento.data;

    const displayAmbiente = document.getElementById('displayAmbiente');
    if (displayAmbiente) {
        displayAmbiente.textContent = dadosTreinamento.ambiente;
        displayAmbiente.href = dadosTreinamento.ambiente;
    }

    // Atualizar campos no rodapé
    const nomeFinalAluno = document.getElementById('nomeFinalAluno');
    if (nomeFinalAluno) nomeFinalAluno.value = dadosTreinamento.nome;

    const assParticipante = document.getElementById('assParticipante');
    if (assParticipante) assParticipante.textContent = dadosTreinamento.nome;

    // Trocar telas
    document.getElementById('telaEntrada').classList.add('hidden');
    document.getElementById('conteudoPrincipal').classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Inicializar o canvas de rúbrica
    setTimeout(inicializarCanvasRubrica, 150);
}

function formatarDataBr(dataIso) {
    if (!dataIso) {
        const hoje = new Date();
        return hoje.toLocaleDateString('pt-BR');
    }
    const partes = dataIso.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataIso;
}

// ==========================================
// SINCRONIZAÇÃO DO NOME DO PARTICIPANTE
// ==========================================
function sincronizarNome(novoNome) {
    const nomeFormatado = novoNome.trim() || '—';
    dadosTreinamento.nome = novoNome;

    const displayNome = document.getElementById('displayNome');
    if (displayNome) displayNome.textContent = nomeFormatado;

    const assParticipante = document.getElementById('assParticipante');
    if (assParticipante) assParticipante.textContent = nomeFormatado;

    const inputInicio = document.getElementById('nomeParticipante');
    if (inputInicio && inputInicio.value !== novoNome) {
        inputInicio.value = novoNome;
    }

    const inputFinal = document.getElementById('nomeFinalAluno');
    if (inputFinal && inputFinal.value !== novoNome) {
        inputFinal.value = novoNome;
    }
}

// ==========================================
// CONTROLE DE PROGRESSO & RUBRICA
// ==========================================
function atualizarRubrica() {
    const checksRubrica = document.querySelectorAll('.rubrica-cb');
    const totalRubrica = checksRubrica.length;
    let marcados = 0;

    checksRubrica.forEach(cb => {
        const label = cb.closest('.rubrica-check') || cb.parentElement;
        if (cb.checked) {
            marcados++;
            cb.setAttribute('checked', 'checked');
            if (label) label.classList.add('marcado');
        } else {
            cb.removeAttribute('checked');
            if (label) label.classList.remove('marcado');
        }
    });

    const contador = document.getElementById('rubricaContador');
    if (contador) contador.textContent = marcados;

    // Atualizar barra de progresso fixa
    const progressoTexto = document.getElementById('progressoTexto');
    const progressoPct = document.getElementById('progressoPct');
    const progressoFill = document.getElementById('progressoFill');

    const pct = totalRubrica > 0 ? Math.round((marcados / totalRubrica) * 100) : 0;
    if (progressoTexto) progressoTexto.textContent = `${marcados} de ${totalRubrica} evidências conferidas`;
    if (progressoPct) progressoPct.textContent = `${pct}%`;
    if (progressoFill) progressoFill.style.width = `${pct}%`;

    // Sugestão automática de APTO se todas forem conferidas
    if (marcados === totalRubrica && totalRubrica > 0) {
        const radioApto = document.querySelector('input[name="resultado"][value="apto"]');
        if (radioApto && !radioApto.checked) {
            radioApto.checked = true;
            atualizarResultado();
        }
    }
}

// ==========================================
// RESULTADO FINAL (APTO / NÃO APTO)
// ==========================================
function atualizarResultado() {
    const radioApto = document.querySelector('input[name="resultado"][value="apto"]');
    const radioNaoApto = document.querySelector('input[name="resultado"][value="nao-apto"]');
    const labelApto = document.getElementById('labelApto');
    const labelNaoApto = document.getElementById('labelNaoApto');

    if (radioApto && radioApto.checked) {
        radioApto.setAttribute('checked', 'checked');
        if (radioNaoApto) radioNaoApto.removeAttribute('checked');
        if (labelApto) labelApto.classList.add('selecionado');
        if (labelNaoApto) labelNaoApto.classList.remove('selecionado');
    } else if (radioNaoApto && radioNaoApto.checked) {
        radioNaoApto.setAttribute('checked', 'checked');
        if (radioApto) radioApto.removeAttribute('checked');
        if (labelNaoApto) labelNaoApto.classList.add('selecionado');
        if (labelApto) labelApto.classList.remove('selecionado');
    } else {
        if (radioApto) radioApto.removeAttribute('checked');
        if (radioNaoApto) radioNaoApto.removeAttribute('checked');
        if (labelApto) labelApto.classList.remove('selecionado');
        if (labelNaoApto) labelNaoApto.classList.remove('selecionado');
    }
}

// ==========================================
// CANVAS DE RÚBRICA DIGITAL INTERATIVA
// ==========================================
function inicializarCanvasRubrica() {
    canvas = document.getElementById('rubricaCanvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    ajustarDpiCanvas();

    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const container = canvas.parentElement;

    // Mouse Events
    canvas.addEventListener('mousedown', (e) => {
        desenhando = true;
        container.classList.add('desenhando');
        ocultarPlaceholderRubrica();
        const pos = obterPosicao(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!desenhando) return;
        const pos = obterPosicao(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        temRubrica = true;
    });

    window.addEventListener('mouseup', () => {
        if (desenhando) {
            desenhando = false;
            if (container) container.classList.remove('desenhando');
        }
    });

    // Touch Events (mobile/tablet/touchscreen)
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        desenhando = true;
        container.classList.add('desenhando');
        ocultarPlaceholderRubrica();
        const touch = e.touches[0];
        const pos = obterPosicao(touch);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!desenhando) return;
        const touch = e.touches[0];
        const pos = obterPosicao(touch);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        temRubrica = true;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        desenhando = false;
        if (container) container.classList.remove('desenhando');
    }, { passive: false });
}

function ajustarDpiCanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Configurar tamanho real do buffer
    canvas.width = (rect.width || 400) * dpr;
    canvas.height = (rect.height || 130) * dpr;
    
    // Escalar contexto para coordenadas lógicas
    ctx.scale(dpr, dpr);
}

function obterPosicao(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function ocultarPlaceholderRubrica() {
    const placeholder = document.getElementById('rubricaPlaceholder');
    if (placeholder) placeholder.classList.add('oculto');
}

function limparRubrica() {
    if (!ctx || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    temRubrica = false;

    const placeholder = document.getElementById('rubricaPlaceholder');
    if (placeholder) placeholder.classList.remove('oculto');
}

// ==========================================
// EXPORTAÇÃO EM PDF (html2pdf.js)
// ==========================================
function exportarPDF() {
    const elemento = document.getElementById('areaPrint');
    if (!elemento) return;

    // 1. Sincronizar todos os estados no DOM real
    atualizarRubrica();
    atualizarResultado();

    // 2. Sincronizar o valor do textarea de observações
    const obs = document.getElementById('observacoes');
    if (obs) {
        obs.textContent = obs.value;
    }

    // 3. Capturar rúbrica em imagem se desenhada
    let rubricaDataUrl = null;
    if (canvas && temRubrica) {
        try {
            rubricaDataUrl = canvas.toDataURL('image/png');
        } catch (e) {
            console.warn('Não foi possível exportar imagem do canvas:', e);
        }
    }

    // Criar overlay de carregamento
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-card">
            <div class="loading-spinner"></div>
            <p>Gerando PDF oficial do treinamento...</p>
            <small style="color: #6b7280; display: block; margin-top: 8px;">Por favor, aguarde alguns segundos.</small>
        </div>
    `;
    document.body.appendChild(overlay);

    // Nome amigável do arquivo
    const nomeLimpo = (dadosTreinamento.nome || 'Participante')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
    const nomeArquivo = `Manual_Treinamento_Moodle_${nomeLimpo}.pdf`;

    // Opções de renderização com html2pdf
    const opcoes = {
        margin: [8, 8, 8, 8],
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
            scrollY: 0,
            onclone: function(clonedDoc) {
                // Sincronizar checkboxes no clone
                const clonedChecks = clonedDoc.querySelectorAll('.rubrica-cb');
                const origChecks = document.querySelectorAll('.rubrica-cb');
                clonedChecks.forEach((cb, i) => {
                    if (origChecks[i] && origChecks[i].checked) {
                        cb.checked = true;
                        cb.setAttribute('checked', 'checked');
                        const lbl = cb.closest('.rubrica-check') || cb.parentElement;
                        if (lbl) lbl.classList.add('marcado');
                    } else {
                        cb.checked = false;
                        cb.removeAttribute('checked');
                        const lbl = cb.closest('.rubrica-check') || cb.parentElement;
                        if (lbl) lbl.classList.remove('marcado');
                    }
                });

                // Sincronizar radios de resultado no clone
                const origApto = document.querySelector('input[name="resultado"][value="apto"]');
                const origNaoApto = document.querySelector('input[name="resultado"][value="nao-apto"]');
                const clonedLabelApto = clonedDoc.getElementById('labelApto');
                const clonedLabelNaoApto = clonedDoc.getElementById('labelNaoApto');

                if (origApto && origApto.checked) {
                    const cApto = clonedDoc.querySelector('input[name="resultado"][value="apto"]');
                    if (cApto) { cApto.checked = true; cApto.setAttribute('checked', 'checked'); }
                    if (clonedLabelApto) clonedLabelApto.classList.add('selecionado');
                    if (clonedLabelNaoApto) clonedLabelNaoApto.classList.remove('selecionado');
                } else if (origNaoApto && origNaoApto.checked) {
                    const cNaoApto = clonedDoc.querySelector('input[name="resultado"][value="nao-apto"]');
                    if (cNaoApto) { cNaoApto.checked = true; cNaoApto.setAttribute('checked', 'checked'); }
                    if (clonedLabelNaoApto) clonedLabelNaoApto.classList.add('selecionado');
                    if (clonedLabelApto) clonedLabelApto.classList.remove('selecionado');
                }

                // Sincronizar imagem da rúbrica no clone
                if (rubricaDataUrl) {
                    const clonedCanvas = clonedDoc.getElementById('rubricaCanvas');
                    if (clonedCanvas) {
                        const img = clonedDoc.createElement('img');
                        img.src = rubricaDataUrl;
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = 'contain';
                        img.style.display = 'block';
                        clonedCanvas.parentNode.replaceChild(img, clonedCanvas);
                    }
                }

                // Sincronizar observações no clone
                const origObs = document.getElementById('observacoes');
                const clonedObs = clonedDoc.getElementById('observacoes');
                if (origObs && clonedObs) {
                    clonedObs.textContent = origObs.value;
                    clonedObs.value = origObs.value;
                }

                // Sincronizar nome impresso no clone
                const clonedAss = clonedDoc.getElementById('assParticipante');
                if (clonedAss) {
                    clonedAss.textContent = dadosTreinamento.nome || '—';
                }

                // Ajustar capa no clone para ocupar exatamente a Página 1 e quebrar para a Página 2
                const clonedCapa = clonedDoc.querySelector('.capa-oficial');
                if (clonedCapa) {
                    clonedCapa.style.pageBreakBefore = 'avoid';
                    clonedCapa.style.breakBefore = 'avoid';
                    clonedCapa.style.pageBreakAfter = 'always';
                    clonedCapa.style.breakAfter = 'page';
                    clonedCapa.style.pageBreakInside = 'avoid';
                    clonedCapa.style.breakInside = 'avoid';
                    clonedCapa.style.marginBottom = '0';
                    clonedCapa.style.boxShadow = 'none';
                    clonedCapa.style.border = 'none';
                }

                // Blindar todos os elementos contra quebra no meio
                clonedDoc.querySelectorAll('.fluxo-box, .figura-doc, .passo, .alerta, .tabela-config, .secao-header, .regras-lista, .sub-titulo, .modelo-csv, .cards-turma, .painel-conclusao-grid, .rubrica-topo-compacto, .tabela-rubrica-compacta').forEach(el => {
                    el.style.pageBreakInside = 'avoid';
                    el.style.breakInside = 'avoid';
                });
            }
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        },
        pagebreak: {
            mode: ['css', 'legacy'],
            after: ['.capa-oficial'],
            before: ['.pagina-final-a4'],
            avoid: [
                '.capa-oficial',
                '.fluxo-box',
                '.figura-doc',
                '.passo',
                '.alerta',
                '.tabela-config',
                '.modelo-csv',
                '.cards-turma',
                '.regras-lista',
                '.secao-header',
                '.sub-titulo',
                '.painel-conclusao-grid',
                '.rubrica-topo-compacto',
                '.tabela-rubrica-compacta'
            ]
        }
    };

    // Gerar e salvar PDF
    html2pdf()
        .set(opcoes)
        .from(elemento)
        .save()
        .then(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        })
        .catch((err) => {
            console.error('Erro ao exportar PDF:', err);
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            alert('Não foi possível exportar diretamente. Abrindo a opção de impressão do navegador...');
            window.print();
        });
}

// ==========================================
// RESETAR FORMULÁRIO
// ==========================================
function resetarFormulario() {
    if (!confirm('Tem certeza que deseja reiniciar o checklist? Todos os dados marcados serão limpos.')) {
        return;
    }

    // Desmarcar checkboxes da rubrica
    document.querySelectorAll('.rubrica-cb').forEach(cb => {
        cb.checked = false;
        cb.removeAttribute('checked');
        const lbl = cb.closest('.rubrica-check') || cb.parentElement;
        if (lbl) lbl.classList.remove('marcado');
    });

    // Desmarcar radios de resultado
    document.querySelectorAll('input[name="resultado"]').forEach(rb => {
        rb.checked = false;
        rb.removeAttribute('checked');
    });
    const labelApto = document.getElementById('labelApto');
    const labelNaoApto = document.getElementById('labelNaoApto');
    if (labelApto) labelApto.classList.remove('selecionado');
    if (labelNaoApto) labelNaoApto.classList.remove('selecionado');

    // Limpar observações
    const obs = document.getElementById('observacoes');
    if (obs) {
        obs.value = '';
        obs.textContent = '';
    }

    // Limpar rúbrica
    limparRubrica();

    // Resetar contadores
    atualizarRubrica();

    // Voltar para tela de entrada
    document.getElementById('conteudoPrincipal').classList.add('hidden');
    document.getElementById('telaEntrada').classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// CERTIFICADO OFICIAL & PROTEÇÃO POR SENHA
// ==========================================
const SENHA_MESTRA_CERTIFICADO = '!Senha123';

function abrirModalSenhaCertificado() {
    // 1. Validar se o nome do participante foi preenchido
    const nomeAtual = (dadosTreinamento.nome || '').trim() || 
                      (document.getElementById('nomeFinalAluno') ? document.getElementById('nomeFinalAluno').value.trim() : '');
    
    if (!nomeAtual) {
        alert('Por favor, informe o Nome Completo do Participante antes de gerar o certificado.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // 2. Validar se o resultado está marcado como APTO
    const radioApto = document.querySelector('input[name="resultado"][value="apto"]');
    if (!radioApto || !radioApto.checked) {
        const confirmar = confirm('Atenção: O participante ainda não está avaliado como "APTO".\n\nDeseja continuar com a autorização da Coordenação mesmo assim?');
        if (!confirmar) return;
    }

    // 3. Preparar o modal de senha
    const modalSenha = document.getElementById('modalSenhaCertificado');
    const inputSenha = document.getElementById('senhaCertificado');
    const msgErro = document.getElementById('senhaMsgErro');

    if (inputSenha) {
        inputSenha.value = '';
        inputSenha.type = 'password';
    }
    if (msgErro) {
        msgErro.textContent = '';
        msgErro.classList.remove('visivel');
    }

    modalSenha.classList.remove('hidden');

    setTimeout(() => {
        if (inputSenha) inputSenha.focus();
    }, 100);

    // Permitir submeter com Enter no input
    if (inputSenha && !inputSenha.dataset.hasEnter) {
        inputSenha.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') validarSenhaCertificado();
        });
        inputSenha.dataset.hasEnter = 'true';
    }
}

function fecharModalSenhaCertificado() {
    const modalSenha = document.getElementById('modalSenhaCertificado');
    if (modalSenha) modalSenha.classList.add('hidden');
}

function alternarVisibilidadeSenha() {
    const input = document.getElementById('senhaCertificado');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
}

function validarSenhaCertificado() {
    const input = document.getElementById('senhaCertificado');
    const msgErro = document.getElementById('senhaMsgErro');
    const digitada = (input ? input.value : '').trim();

    if (digitada !== SENHA_MESTRA_CERTIFICADO) {
        if (msgErro) {
            msgErro.textContent = '❌ Senha incorreta! Digite a senha institucional autorizada.';
            msgErro.classList.add('visivel');
        }
        if (input) {
            input.style.borderColor = 'var(--vermelho)';
            input.focus();
            input.select();
        }
        return;
    }

    // Senha Correta: Fechar modal de senha e abrir o Certificado Oficial
    fecharModalSenhaCertificado();
    gerarCertificadoOficial();
}

function gerarCertificadoOficial() {
    // Obter dados atualizados do participante
    const nomeAluno = (dadosTreinamento.nome || '').trim() || 
                      (document.getElementById('nomeFinalAluno') ? document.getElementById('nomeFinalAluno').value.trim() : 'Participante');
    
    const dataConclusao = dadosTreinamento.data || new Date().toLocaleDateString('pt-BR');

    // Código de autenticidade único
    const codigoAuth = `ESAP-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;

    // Preencher campos no documento do certificado
    const certNome = document.getElementById('certNomeAluno');
    if (certNome) certNome.textContent = nomeAluno;

    const toolbarNome = document.getElementById('toolbarNomeAluno');
    if (toolbarNome) toolbarNome.textContent = `Aluno(a): ${nomeAluno}`;

    const certData = document.getElementById('certDataConclusao');
    if (certData) certData.textContent = dataConclusao;

    const certCodigo = document.getElementById('certCodigoAutenticidade');
    if (certCodigo) certCodigo.textContent = `AUT: ${codigoAuth}`;

    // Sincronizar autoridades responsáveis e modalidade de assinatura
    atualizarResponsaveisCertificado();
    const radioTipoAss = document.querySelector('input[name="tipoAssinaturaCert"]:checked');
    const tipoAss = radioTipoAss ? radioTipoAss.value : 'eletronica';
    alternarTipoAssinaturaCertificado(tipoAss);

    // Exibir modal do certificado
    const modalCert = document.getElementById('modalCertificado');
    if (modalCert) {
        modalCert.classList.remove('hidden');
    }
}

// Atualiza em tempo real os nomes das autoridades no Certificado
function atualizarResponsaveisCertificado() {
    const inputCoord = document.getElementById('inputNomeCoordenadora');
    const inputGestor = document.getElementById('inputNomeGestor');

    const nomeCoord = inputCoord ? inputCoord.value.trim() : '';
    const nomeGestor = inputGestor ? inputGestor.value.trim() : '';

    // Atualizar Coordenadora
    const certNomeCoord = document.getElementById('certNomeCoordenadora');
    const rubricaTextoCoord = document.getElementById('rubricaTextoCoordenadora');
    if (certNomeCoord) {
        certNomeCoord.textContent = nomeCoord;
        certNomeCoord.style.display = nomeCoord ? 'block' : 'none';
    }
    if (rubricaTextoCoord) {
        rubricaTextoCoord.textContent = nomeCoord ? nomeCoord.replace(/^(Dra\.|Dr\.|Prof\.|Profa\.)\s*/i, '') : '';
        rubricaTextoCoord.style.display = nomeCoord ? 'inline-block' : 'none';
    }

    // Atualizar Gestor Técnico
    const certNomeGestor = document.getElementById('certNomeGestor');
    const rubricaTextoGestor = document.getElementById('rubricaTextoGestor');
    if (certNomeGestor) {
        certNomeGestor.textContent = nomeGestor;
        certNomeGestor.style.display = nomeGestor ? 'block' : 'none';
    }
    if (rubricaTextoGestor) {
        rubricaTextoGestor.textContent = nomeGestor;
        rubricaTextoGestor.style.display = nomeGestor ? 'inline-block' : 'none';
    }
}

// Alterna entre Assinatura Eletrônica e Assinatura à Mão (Manual)
function alternarTipoAssinaturaCertificado(tipo) {
    const rubricaCoord = document.getElementById('rubricaCoordenadoraWrap');
    const rubricaGestor = document.getElementById('rubricaGestorWrap');
    const manualCoord = document.getElementById('manualCoordenadoraWrap');
    const manualGestor = document.getElementById('manualGestorWrap');

    if (tipo === 'manual') {
        if (rubricaCoord) rubricaCoord.classList.add('hidden');
        if (rubricaGestor) rubricaGestor.classList.add('hidden');
        if (manualCoord) manualCoord.classList.remove('hidden');
        if (manualGestor) manualGestor.classList.remove('hidden');
    } else {
        // eletronica
        if (rubricaCoord) rubricaCoord.classList.remove('hidden');
        if (rubricaGestor) rubricaGestor.classList.remove('hidden');
        if (manualCoord) manualCoord.classList.add('hidden');
        if (manualGestor) manualGestor.classList.add('hidden');
    }
}

function fecharModalCertificado() {
    const modalCert = document.getElementById('modalCertificado');
    if (modalCert) modalCert.classList.add('hidden');
}

// Impressão nativa isolada do certificado em A4 Paisagem (Landscape)
function imprimirCertificado() {
    let style = document.getElementById('estiloImpressaoCertificado');
    if (!style) {
        style = document.createElement('style');
        style.id = 'estiloImpressaoCertificado';
        document.head.appendChild(style);
    }
    style.innerHTML = '@page { size: A4 landscape !important; margin: 5mm !important; }';

    document.body.classList.add('imprimindo-certificado');
    
    window.print();

    const limparImpressao = () => {
        document.body.classList.remove('imprimindo-certificado');
        if (style) style.innerHTML = '';
    };

    window.addEventListener('afterprint', limparImpressao, { once: true });

    // Fallback de segurança caso afterprint não dispare
    setTimeout(limparImpressao, 2500);
}

// Download direto do Certificado em PDF (html2pdf.js em A4 Landscape)
function baixarCertificadoPDF() {
    const elemento = document.getElementById('areaCertificado');
    if (!elemento) return;

    const nomeLimpo = (dadosTreinamento.nome || 'Participante')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
    const nomeArquivo = `Certificado_Moodle_ESAP_${nomeLimpo}.pdf`;

    // Overlay de carregamento
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-card">
            <div class="loading-spinner"></div>
            <p>Gerando Certificado Oficial em alta resolução...</p>
            <small style="color: #6b7280; display: block; margin-top: 8px;">Aguarde a exportação em formato paisagem A4.</small>
        </div>
    `;
    document.body.appendChild(overlay);

    // Ocultar hint de manual temporariamente para deixar a folha limpa para assinatura física
    const hints = elemento.querySelectorAll('.manual-hint');
    hints.forEach(h => h.style.visibility = 'hidden');

    const opcoes = {
        margin: [5, 5, 5, 5],
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
            scale: 2.5,
            useCORS: true,
            logging: false,
            letterRendering: true,
            scrollY: 0
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'landscape'
        }
    };

    html2pdf()
        .set(opcoes)
        .from(elemento)
        .save()
        .then(() => {
            hints.forEach(h => h.style.visibility = 'visible');
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        })
        .catch((err) => {
            hints.forEach(h => h.style.visibility = 'visible');
            console.error('Erro ao gerar PDF do certificado:', err);
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            alert('Tentando opção nativa de impressão do navegador...');
            imprimirCertificado();
        });
}
