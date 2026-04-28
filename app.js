// ============================================
// IMPORTAÇÕES E CONFIGURAÇÃO
// ============================================

import { getSessaoAtiva, logout } from './auth.js';

const STORAGE_KEY = 'lista2026_items';

let currentUser = null;
let items = [];
let currentFilter = 'todos';
let darkMode = localStorage.getItem('darkMode') === 'true';

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
        if (mostrar) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

function salvarItems() {
    if (!currentUser) return;
    
    const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    allData[currentUser.id] = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    
    console.log('Itens salvos:', items.length);
}

function carregarItems() {
    if (!currentUser) return [];
    
    const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    items = allData[currentUser.id] || [];
    console.log('Itens carregados:', items.length);
    return items;
}

// ============================================
// FUNÇÕES DA LISTA
// ============================================

function adicionarItem() {
    const nomeInput = document.getElementById('item-nome');
    const categoriaSelect = document.getElementById('item-categoria');
    
    if (!nomeInput || !categoriaSelect) {
        console.error('Elementos não encontrados');
        return;
    }
    
    const nome = nomeInput.value.trim();
    const categoria = categoriaSelect.value;
    
    if (!nome) {
        exibirToast('Digite o nome do item', 'error');
        return;
    }
    
    const novoItem = {
        id: Date.now(),
        nome: nome,
        categoria: categoria,
        concluido: false,
        ordem: items.length,
        criadoEm: new Date().toISOString()
    };
    
    items.push(novoItem);
    salvarItems();
    
    nomeInput.value = '';
    nomeInput.focus();
    
    exibirToast(`"${nome}" adicionado à lista!`, 'success');
    renderizarLista();
}

function toggleItem(id) {
    const item = items.find(i => i.id === parseInt(id));
    if (item) {
        item.concluido = !item.concluido;
        salvarItems();
        
        const mensagem = item.concluido ? 'Item concluído! 🎉' : 'Item reaberto';
        exibirToast(mensagem, 'info');
        renderizarLista();
    }
}

function deletarItem(id) {
    const item = items.find(i => i.id === parseInt(id));
    if (!item) return;
    
    if (confirm(`Remover "${item.nome}" da lista?`)) {
        items = items.filter(i => i.id !== parseInt(id));
        // Reordenar os itens restantes
        items.forEach((item, idx) => { item.ordem = idx; });
        salvarItems();
        exibirToast('Item removido', 'success');
        renderizarLista();
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
        // Reordenar os itens restantes
        items.forEach((item, idx) => { item.ordem = idx; });
        salvarItems();
        exibirToast(`${concluidos.length} item(ns) removido(s)`, 'success');
        renderizarLista();
    }
}

function atualizarEstatisticas() {
    const total = items.length;
    const pendentes = items.filter(i => !i.concluido).length;
    const concluidos = items.filter(i => i.concluido).length;
    
    const totalEl = document.getElementById('total-itens');
    const pendentesEl = document.getElementById('itens-pendentes');
    const concluidosEl = document.getElementById('itens-concluidos');
    
    if (totalEl) totalEl.textContent = total;
    if (pendentesEl) pendentesEl.textContent = pendentes;
    if (concluidosEl) concluidosEl.textContent = concluidos;
}

function getIconCategoria(categoria) {
    const icons = {
        alimentos: '🍎',
        limpeza: '🧹',
        higiene: '🧴',
        bebidas: '🥤',
        outros: '📦'
    };
    return icons[categoria] || '📦';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderizarLista() {
    const listaUl = document.getElementById('lista');
    const emptyState = document.getElementById('empty-state');
    
    if (!listaUl || !emptyState) return;
    
    let itemsFiltrados = [...items];
    if (currentFilter !== 'todos') {
        itemsFiltrados = items.filter(i => i.categoria === currentFilter);
    }
    
    // Ordenar: pendentes primeiro, depois por ordem
    itemsFiltrados.sort((a, b) => {
        if (a.concluido !== b.concluido) return a.concluido ? 1 : -1;
        return (a.ordem || 0) - (b.ordem || 0);
    });
    
    if (itemsFiltrados.length === 0) {
        listaUl.innerHTML = '';
        emptyState.classList.remove('hidden');
        atualizarEstatisticas();
        return;
    }
    
    emptyState.classList.add('hidden');
    
    listaUl.innerHTML = itemsFiltrados.map(item => `
        <li class="list-item" data-id="${item.id}" draggable="true">
            <span class="drag-handle">⋮⋮</span>
            <input type="checkbox" class="item-checkbox" ${item.concluido ? 'checked' : ''} onchange="window.toggleItem(${item.id})">
            <div class="item-content">
                <span class="item-nome ${item.concluido ? 'concluido' : ''}">
                    ${getIconCategoria(item.categoria)} ${escapeHtml(item.nome)}
                </span>
                <span class="item-categoria categoria-${item.categoria}">
                    ${item.categoria}
                </span>
            </div>
            <div class="item-actions">
                <button onclick="window.deletarItem(${item.id})" title="Remover">🗑️</button>
            </div>
        </li>
    `).join('');
    
    atualizarEstatisticas();
    adicionarDragAndDrop();
}

// ============================================
// DRAG AND DROP
// ============================================

let draggedItemId = null;

function adicionarDragAndDrop() {
    const listItems = document.querySelectorAll('.list-item');
    
    listItems.forEach(item => {
        item.removeEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragover', handleDragOver);
        item.removeEventListener('drop', handleDrop);
        item.removeEventListener('dragend', handleDragEnd);
        
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    const target = e.target.closest('.list-item');
    if (!target) return;
    
    draggedItemId = parseInt(target.dataset.id);
    target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    const targetItem = e.target.closest('.list-item');
    if (!targetItem) return;
    
    const targetId = parseInt(targetItem.dataset.id);
    if (draggedItemId === targetId) return;
    
    const draggedIndex = items.findIndex(i => i.id === draggedItemId);
    const targetIndex = items.findIndex(i => i.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const [draggedItem] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, draggedItem);
    
    items.forEach((item, idx) => { item.ordem = idx; });
    
    salvarItems();
    renderizarLista();
    exibirToast('Ordem atualizada', 'success');
}

function handleDragEnd(e) {
    const target = e.target.closest('.list-item');
    if (target) target.classList.remove('dragging');
    draggedItemId = null;
}

// ============================================
// FILTROS E CATEGORIAS
// ============================================

function configurarFiltros() {
    const filtros = document.querySelectorAll('.filter-chip');
    filtros.forEach(filtro => {
        filtro.addEventListener('click', () => {
            filtros.forEach(f => f.classList.remove('active'));
            filtro.classList.add('active');
            currentFilter = filtro.dataset.categoria;
            renderizarLista();
        });
    });
}

// ============================================
// MODO ESCURO
// ============================================

function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    
    if (darkMode) {
        document.body.setAttribute('data-theme', 'dark');
        const btn = document.getElementById('btn-dark-mode');
        if (btn) btn.textContent = '☀️';
    } else {
        document.body.removeAttribute('data-theme');
        const btn = document.getElementById('btn-dark-mode');
        if (btn) btn.textContent = '🌙';
    }
}

function initDarkMode() {
    if (darkMode) {
        document.body.setAttribute('data-theme', 'dark');
        const btn = document.getElementById('btn-dark-mode');
        if (btn) btn.textContent = '☀️';
    }
}

// ============================================
// LOGOUT
// ============================================

function handleLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        logout();
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

function init() {
    console.log('Inicializando app...');
    
    // Verificar sessão
    currentUser = getSessaoAtiva();
    
    if (!currentUser) {
        console.log('Usuário não autenticado, redirecionando...');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('Usuário logado:', currentUser);
    
    // Exibir nome do usuário
    const userNomeEl = document.getElementById('user-nome');
    if (userNomeEl) {
        userNomeEl.textContent = currentUser.isGuest ? 'Modo Demo 🎮' : `Olá, ${currentUser.nome}`;
    }
    
    // Carregar dados
    carregarItems();
    
    // Configurar eventos
    const btnAdicionar = document.getElementById('btn-adicionar');
    if (btnAdicionar) {
        btnAdicionar.addEventListener('click', adicionarItem);
    }
    
    const btnLimpar = document.getElementById('btn-limpar-concluidos');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparConcluidos);
    }
    
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', handleLogout);
    }
    
    const btnDarkMode = document.getElementById('btn-dark-mode');
    if (btnDarkMode) {
        btnDarkMode.addEventListener('click', toggleDarkMode);
    }
    
    const itemNomeInput = document.getElementById('item-nome');
    if (itemNomeInput) {
        itemNomeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') adicionarItem();
        });
    }
    
    // Configurar filtros
    configurarFiltros();
    
    // Inicializar modo escuro
    initDarkMode();
    
    // Renderizar lista
    renderizarLista();
    
    console.log('App inicializado com sucesso!');
    
    // Exportar funções globalmente
    window.toggleItem = toggleItem;
    window.deletarItem = deletarItem;
    window.limparConcluidos = limparConcluidos;
    window.adicionarItem = adicionarItem;
}

// Iniciar aplicação quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}