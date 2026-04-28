// ============================================
// IMPORTAÇÕES E CONFIGURAÇÃO
// ============================================

import { getSessaoAtiva, logout } from './auth.js';

const STORAGE_KEY = 'lista2026_items';
const LISTS_KEY = 'lista2026_multiplas_listas';
const HISTORY_KEY = 'lista2026_historico';
const SUGGESTIONS_KEY = 'lista2026_sugestoes';

let currentUser = null;
let currentListId = 'default';
let lists = {};
let items = [];
let currentFilter = 'todos';
let darkMode = localStorage.getItem('darkMode') === 'true';
let currentBudget = 0;

// ============================================
// UTILITÁRIOS
// ============================================

function exibirToast(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    
    toast.classList.remove('success', 'error', 'info', 'hidden');
    toast.classList.add(tipo);
    
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    if (toastIcon) toastIcon.textContent = icons[tipo] || icons.info;
    if (toastMessage) toastMessage.textContent = mensagem;
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function mostrarLoading(mostrar) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        if (mostrar) overlay.classList.remove('hidden');
        else overlay.classList.add('hidden');
    }
}

function salvarTudo() {
    if (!currentUser) return;
    
    const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    allData[currentUser.id] = { lists, currentListId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
}

function carregarTudo() {
    if (!currentUser) return;
    
    const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const userData = allData[currentUser.id] || { lists: {}, currentListId: 'default' };
    
    lists = userData.lists || {};
    currentListId = userData.currentListId || 'default';
    
    // Inicializar lista padrão se não existir
    if (!lists['default']) {
        lists['default'] = {
            id: 'default',
            nome: 'Minha lista principal',
            itens: [],
            budget: 0,
            criadaEm: new Date().toISOString()
        };
    }
    
    items = lists[currentListId]?.itens || [];
    currentBudget = lists[currentListId]?.budget || 0;
    
    // Carregar orçamento
    const budgetInput = document.getElementById('budget-input');
    if (budgetInput) budgetInput.value = currentBudget || '';
}

function salvarListaAtual() {
    if (!lists[currentListId]) return;
    lists[currentListId].itens = items;
    lists[currentListId].budget = currentBudget;
    salvarTudo();
}

// ============================================
// HISTÓRICO
// ============================================

function salvarNoHistorico() {
    if (items.length === 0) {
        exibirToast('Lista vazia, nada para salvar', 'error');
        return;
    }
    
    const historico = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    
    const listaHistorico = {
        id: Date.now(),
        nome: `Lista ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        itens: JSON.parse(JSON.stringify(items)),
        total: calcularTotalGasto(),
        criadaEm: new Date().toISOString()
    };
    
    historico.unshift(listaHistorico);
    
    // Manter apenas últimos 50 históricos
    if (historico.length > 50) historico.pop();
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historico));
    exibirToast('Lista salva no histórico!', 'success');
}

function carregarDoHistorico(historicoId) {
    const historico = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const listaSalva = historico.find(h => h.id === parseInt(historicoId));
    
    if (listaSalva) {
        items = JSON.parse(JSON.stringify(listaSalva.itens));
        salvarListaAtual();
        renderizarLista();
        exibirToast('Lista carregada do histórico!', 'success');
        fecharModalHistorico();
    }
}

function removerDoHistorico(historicoId) {
    let historico = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    historico = historico.filter(h => h.id !== parseInt(historicoId));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historico));
    exibirToast('Item removido do histórico', 'success');
    renderizarModalHistorico();
}

function renderizarModalHistorico() {
    const historico = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const container = document.getElementById('historico-listas');
    const emptyDiv = document.getElementById('historico-empty');
    
    if (!container) return;
    
    if (historico.length === 0) {
        if (emptyDiv) emptyDiv.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }
    
    if (emptyDiv) emptyDiv.classList.add('hidden');
    
    container.innerHTML = historico.map(item => `
        <div class="historico-item">
            <div class="historico-info">
                <h4>${escapeHtml(item.nome)}</h4>
                <p>${item.itens.length} itens | Total: R$ ${item.total.toFixed(2)}</p>
                <small>${new Date(item.criadaEm).toLocaleString()}</small>
            </div>
            <div class="historico-actions">
                <button class="btn-reutilizar" onclick="window.carregarDoHistorico(${item.id})">↺ Reutilizar</button>
                <button class="btn-remover" onclick="window.removerDoHistorico(${item.id})">🗑 Remover</button>
            </div>
        </div>
    `).join('');
}

function abrirModalHistorico() {
    const modal = document.getElementById('modal-historico');
    if (modal) {
        renderizarModalHistorico();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function fecharModalHistorico() {
    const modal = document.getElementById('modal-historico');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ============================================
// GERENCIAR LISTAS MÚLTIPLAS
// ============================================

function renderizarListasManager() {
    const container = document.getElementById('listas-container');
    if (!container) return;
    
    const listasArray = Object.entries(lists).map(([id, lista]) => ({
        id,
        ...lista
    }));
    
    container.innerHTML = listasArray.map(lista => `
        <div class="lista-item ${lista.id === currentListId ? 'active' : ''}">
            <div class="lista-info">
                <strong>${escapeHtml(lista.nome)}</strong>
                <small>${lista.itens?.length || 0} itens | ${lista.budget ? `R$ ${lista.budget}` : 'Sem orçamento'}</small>
            </div>
            <div class="lista-actions">
                <button onclick="window.switchLista('${lista.id}')" title="Selecionar">✓</button>
                ${lista.id !== 'default' ? `<button onclick="window.deletarLista('${lista.id}')" title="Excluir">🗑</button>` : ''}
            </div>
        </div>
    `).join('');
}

function abrirModalListas() {
    const modal = document.getElementById('modal-listas');
    if (modal) {
        renderizarListasManager();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function fecharModalListas() {
    const modal = document.getElementById('modal-listas');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function criarNovaLista() {
    const nome = prompt('Digite o nome da nova lista:');
    if (!nome) return;
    
    const newId = 'lista_' + Date.now();
    lists[newId] = {
        id: newId,
        nome: nome,
        itens: [],
        budget: 0,
        criadaEm: new Date().toISOString()
    };
    
    salvarTudo();
    atualizarSelectorListas();
    exibirToast(`Lista "${nome}" criada!`, 'success');
}

function switchLista(listaId) {
    if (!lists[listaId]) return;
    
    // Salvar lista atual
    lists[currentListId].itens = items;
    lists[currentListId].budget = currentBudget;
    
    // Mudar para nova lista
    currentListId = listaId;
    items = lists[currentListId].itens || [];
    currentBudget = lists[currentListId].budget || 0;
    
    salvarTudo();
    atualizarSelectorListas();
    
    // Atualizar UI
    const budgetInput = document.getElementById('budget-input');
    if (budgetInput) budgetInput.value = currentBudget || '';
    
    renderizarLista();
    atualizarOrcamentoUI();
    exibirToast(`Mudou para "${lists[currentListId].nome}"`, 'success');
    
    fecharModalListas();
}

function deletarLista(listaId) {
    if (listaId === 'default') {
        exibirToast('Não é possível deletar a lista principal', 'error');
        return;
    }
    
    if (confirm(`Tem certeza que deseja deletar "${lists[listaId]?.nome}"?`)) {
        delete lists[listaId];
        
        if (currentListId === listaId) {
            currentListId = 'default';
            items = lists['default'].itens || [];
            currentBudget = lists['default'].budget || 0;
        }
        
        salvarTudo();
        atualizarSelectorListas();
        renderizarLista();
        exibirToast('Lista deletada', 'success');
        fecharModalListas();
    }
}

function atualizarSelectorListas() {
    const selector = document.getElementById('lista-select');
    if (!selector) return;
    
    selector.innerHTML = Object.entries(lists).map(([id, lista]) => `
        <option value="${id}" ${id === currentListId ? 'selected' : ''}>
            ${escapeHtml(lista.nome)} (${lista.itens?.length || 0} itens)
        </option>
    `).join('');
}

// ============================================
// SUGESTÕES INTELIGENTES
// ============================================

function salvarSugestao(item) {
    const sugestoes = JSON.parse(localStorage.getItem(SUGGESTIONS_KEY) || '[]');
    
    const existing = sugestoes.find(s => s.nome.toLowerCase() === item.nome.toLowerCase());
    if (existing) {
        existing.vezes++;
        existing.ultimoUso = Date.now();
    } else {
        sugestoes.push({
            nome: item.nome,
            categoria: item.categoria,
            vezes: 1,
            ultimoUso: Date.now()
        });
    }
    
    // Ordenar por frequência de uso e manter top 20
    sugestoes.sort((a, b) => b.vezes - a.vezes);
    if (sugestoes.length > 20) sugestoes.pop();
    
    localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(sugestoes));
    atualizarSugestoes();
}

function atualizarSugestoes() {
    const sugestoes = JSON.parse(localStorage.getItem(SUGGESTIONS_KEY) || '[]');
    const datalist = document.getElementById('sugestoes');
    
    if (datalist) {
        datalist.innerHTML = sugestoes.map(s => `
            <option value="${escapeHtml(s.nome)}">
        `).join('');
    }
}

// ============================================
// ORÇAMENTO
// ============================================

function calcularTotalGasto() {
    return items.reduce((total, item) => {
        const preco = item.preco || 0;
        const quantidade = item.quantidade || 1;
        return total + (preco * quantidade);
    }, 0);
}

function definirOrcamento() {
    const input = document.getElementById('budget-input');
    let valor = parseFloat(input.value);
    
    if (isNaN(valor) || valor <= 0) {
        currentBudget = 0;
        exibirToast('Orçamento removido', 'info');
    } else {
        currentBudget = valor;
        exibirToast(`Orçamento definido: R$ ${currentBudget.toFixed(2)}`, 'success');
    }
    
    salvarListaAtual();
    atualizarOrcamentoUI();
}

function atualizarOrcamentoUI() {
    const total = calcularTotalGasto();
    const progressDiv = document.getElementById('budget-progress');
    const spentSpan = document.getElementById('budget-spent');
    const limitSpan = document.getElementById('budget-limit');
    const percentSpan = document.getElementById('budget-percent');
    const progressFill = document.getElementById('progress-fill');
    
    if (currentBudget > 0) {
        if (progressDiv) progressDiv.classList.remove('hidden');
        
        const percent = Math.min((total / currentBudget) * 100, 100);
        const percentDisplay = Math.round(percent);
        
        if (spentSpan) spentSpan.textContent = `R$ ${total.toFixed(2)}`;
        if (limitSpan) limitSpan.textContent = `R$ ${currentBudget.toFixed(2)}`;
        if (percentSpan) percentSpan.textContent = percentDisplay;
        
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
            if (total > currentBudget) {
                progressFill.classList.add('over-budget');
                if (percentSpan) percentSpan.style.color = '#E53E3E';
            } else {
                progressFill.classList.remove('over-budget');
                if (percentSpan) percentSpan.style.color = '';
            }
        }
        
        if (total > currentBudget) {
            exibirToast('⚠️ Atenção: você ultrapassou seu orçamento!', 'error');
        }
    } else {
        if (progressDiv) progressDiv.classList.add('hidden');
    }
}

// ============================================
// FUNÇÕES DA LISTA (ENHANCED)
// ============================================

function adicionarItem() {
    const nomeInput = document.getElementById('item-nome');
    const categoriaSelect = document.getElementById('item-categoria');
    const quantidadeInput = document.getElementById('item-quantidade');
    const unidadeSelect = document.getElementById('item-unidade');
    const precoInput = document.getElementById('item-preco');
    
    const nome = nomeInput.value.trim();
    const categoria = categoriaSelect.value;
    const quantidade = parseFloat(quantidadeInput.value) || 1;
    const unidade = unidadeSelect.value;
    const preco = parseFloat(precoInput.value) || 0;
    
    if (!nome) {
        exibirToast('Digite o nome do item', 'error');
        return;
    }
    
    const novoItem = {
        id: Date.now(),
        nome: nome,
        categoria: categoria,
        quantidade: quantidade,
        unidade: unidade,
        preco: preco,
        concluido: false,
        ordem: items.length,
        criadoEm: new Date().toISOString()
    };
    
    items.push(novoItem);
    salvarListaAtual();
    salvarSugestao(novoItem);
    
    nomeInput.value = '';
    quantidadeInput.value = '1';
    unidadeSelect.value = 'un';
    precoInput.value = '';
    nomeInput.focus();
    
    exibirToast(`"${nome}" adicionado à lista!`, 'success');
    renderizarLista();
    atualizarOrcamentoUI();
}

function toggleItem(id) {
    const item = items.find(i => i.id === parseInt(id));
    if (item) {
        item.concluido = !item.concluido;
        salvarListaAtual();
        
        const mensagem = item.concluido ? 'Item concluído! 🎉' : 'Item reaberto';
        exibirToast(mensagem, 'info');
        renderizarLista();
        atualizarOrcamentoUI();
    }
}

function deletarItem(id) {
    const item = items.find(i => i.id === parseInt(id));
    if (!item) return;
    
    if (confirm(`Remover "${item.nome}" da lista?`)) {
        items = items.filter(i => i.id !== parseInt(id));
        items.forEach((item, idx) => { item.ordem = idx; });
        salvarListaAtual();
        exibirToast('Item removido', 'success');
        renderizarLista();
        atualizarOrcamentoUI();
    }
}

function limparConcluidos() {
    const concluidos = items.filter(i => i.concluido);
    if (concluidos.length === 0) {
        exibirToast('Nenhum item concluído para remover', 'info');
        return;
    }
    
    if (confirm(`Remover ${concluidos.length} item(ns) concluído(s)?`)) {
        items = items.filter(i => !i.concluido);
        items.forEach