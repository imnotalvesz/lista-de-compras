// ============================================
// CONFIGURAÇÃO E CONSTANTES
// ============================================

const STORAGE_KEYS = {
    USERS: 'lista2026_users',
    SESSION: 'lista2026_session',
    GUEST_LIST: 'lista2026_guest_list'
};

const SESSION_DURATION = {
    REMEMBER: 30 * 24 * 60 * 60 * 1000, // 30 dias
    TEMP: 24 * 60 * 60 * 1000 // 1 dia
};

// Inicializar dados mock se não existirem
function initMockData() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        const mockUsers = [
            {
                id: '1',
                nome: 'Usuário Demo',
                email: 'demo@lista2026.com',
                senha: '123456'
            }
        ];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers));
    }
}

// ============================================
// UTILITÁRIOS
// ============================================

function exibirToast(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Remover classes anteriores
    toast.classList.remove('success', 'error', 'hidden');
    
    // Adicionar classe do tipo
    toast.classList.add(tipo);
    
    // Definir ícone
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };
    toastIcon.textContent = icons[tipo] || icons.info;
    
    // Definir mensagem
    toastMessage.textContent = mensagem;
    
    // Mostrar toast
    toast.classList.remove('hidden');
    
    // Esconder após 3 segundos
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function mostrarSpinner(botaoId, mostrar) {
    const botao = document.getElementById(botaoId);
    if (!botao) return;
    
    const texto = botao.querySelector('.btn-text');
    const spinner = botao.querySelector('.spinner');
    
    if (mostrar) {
        botao.disabled = true;
        if (texto) texto.style.opacity = '0.7';
        if (spinner) spinner.classList.remove('hidden');
    } else {
        botao.disabled = false;
        if (texto) texto.style.opacity = '1';
        if (spinner) spinner.classList.add('hidden');
    }
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function criarSessao(usuario, lembrar = false) {
    const sessao = {
        userId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        timestamp: Date.now(),
        lembrar: lembrar
    };
    
    const duracao = lembrar ? SESSION_DURATION.REMEMBER : SESSION_DURATION.TEMP;
    sessao.expiraEm = Date.now() + duracao;
    
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessao));
    
    // Se não for lembrar, usar sessionStorage como fallback
    if (!lembrar) {
        sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessao));
        localStorage.removeItem(STORAGE_KEYS.SESSION);
    } else {
        sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    }
}

function verificarSessao() {
    // Tentar recuperar sessão do localStorage (lembrar) ou sessionStorage (temporária)
    let sessao = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!sessao) {
        sessao = sessionStorage.getItem(STORAGE_KEYS.SESSION);
    }
    
    if (!sessao) return null;
    
    try {
        const dados = JSON.parse(sessao);
        
        // Verificar se expirou
        if (Date.now() > dados.expiraEm) {
            localStorage.removeItem(STORAGE_KEYS.SESSION);
            sessionStorage.removeItem(STORAGE_KEYS.SESSION);
            return null;
        }
        
        return dados;
    } catch (e) {
        return null;
    }
}

function redirecionarParaLista() {
    window.location.href = 'index.html';
}

// ============================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const lembrar = document.getElementById('lembrar-me').checked;
    
    // Validações
    if (!email || !senha) {
        exibirToast('Preencha todos os campos', 'error');
        return;
    }
    
    if (!validarEmail(email)) {
        exibirToast('Digite um email válido', 'error');
        return;
    }
    
    // Mostrar spinner
    mostrarSpinner('btn-login', true);
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
        // Buscar usuário no mock
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const usuario = users.find(u => u.email === email && u.senha === senha);
        
        if (!usuario) {
            exibirToast('Email ou senha inválidos', 'error');
            mostrarSpinner('btn-login', false);
            return;
        }
        
        // Criar sessão
        criarSessao(usuario, lembrar);
        
        exibirToast(`Bem-vindo(a) de volta, ${usuario.nome}! 🎉`, 'success');
        
        // Redirecionar após pequeno delay
        setTimeout(() => {
            redirecionarParaLista();
        }, 500);
        
    } catch (error) {
        console.error('Erro no login:', error);
        exibirToast('Erro ao fazer login. Tente novamente.', 'error');
        mostrarSpinner('btn-login', false);
    }
}

async function handleCadastro(event) {
    event.preventDefault();
    
    const nome = document.getElementById('cadastro-nome').value.trim();
    const email = document.getElementById('cadastro-email').value.trim();
    const senha = document.getElementById('cadastro-senha').value;
    const confirmar = document.getElementById('cadastro-confirmar').value;
    
    // Validações
    if (!nome || !email || !senha || !confirmar) {
        exibirToast('Preencha todos os campos', 'error');
        return;
    }
    
    if (!validarEmail(email)) {
        exibirToast('Digite um email válido', 'error');
        return;
    }
    
    if (senha.length < 6) {
        exibirToast('A senha deve ter no mínimo 6 caracteres', 'error');
        return;
    }
    
    if (senha !== confirmar) {
        exibirToast('As senhas não coincidem', 'error');
        return;
    }
    
    // Mostrar spinner
    mostrarSpinner('btn-cadastrar', true);
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        
        // Verificar se email já existe
        if (users.find(u => u.email === email)) {
            exibirToast('Este email já está cadastrado', 'error');
            mostrarSpinner('btn-cadastrar', false);
            return;
        }
        
        // Criar novo usuário
        const novoUsuario = {
            id: Date.now().toString(),
            nome: nome,
            email: email,
            senha: senha,
            criadoEm: new Date().toISOString()
        };
        
        users.push(novoUsuario);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        
        exibirToast('Conta criada com sucesso! 🎉 Faça login para continuar.', 'success');
        
        // Fechar modal e limpar formulário
        fecharModalCadastro();
        document.getElementById('cadastro-form').reset();
        
        // Preencher email no formulário de login
        document.getElementById('email').value = email;
        document.getElementById('senha').focus();
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        exibirToast('Erro ao criar conta. Tente novamente.', 'error');
    } finally {
        mostrarSpinner('btn-cadastrar', false);
    }
}

function modoConvidado() {
    // Criar sessão de convidado
    const sessaoConvidado = {
        userId: 'guest_' + Date.now(),
        nome: 'Convidado',
        email: 'guest@temp.com',
        isGuest: true,
        timestamp: Date.now(),
        expiraEm: Date.now() + SESSION_DURATION.TEMP
    };
    
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessaoConvidado));
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    
    exibirToast('Modo demonstração ativado! Dados salvos apenas neste navegador.', 'info');
    
    // Redirecionar após pequeno delay
    setTimeout(() => {
        redirecionarParaLista();
    }, 500);
}

// ============================================
// FUNÇÕES DO MODAL
// ============================================

function abrirModalCadastro() {
    const modal = document.getElementById('modal-cadastro');
    modal.classList.add('show');
    
    // Prevenir scroll do body
    document.body.style.overflow = 'hidden';
    
    // Limpar formulário
    document.getElementById('cadastro-form').reset();
}

function fecharModalCadastro() {
    const modal = document.getElementById('modal-cadastro');
    modal.classList.remove('show');
    
    // Restaurar scroll
    document.body.style.overflow = '';
}

// Fechar modal ao clicar fora
document.addEventListener('click', (event) => {
    const modal = document.getElementById('modal-cadastro');
    if (event.target === modal) {
        fecharModalCadastro();
    }
});

// Fechar modal com ESC
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const modal = document.getElementById('modal-cadastro');
        if (modal.classList.contains('show')) {
            fecharModalCadastro();
        }
    }
});

// ============================================
// FUNÇÃO PARA RECUPERAR SESSÃO (usada no index.html)
// ============================================

function getSessaoAtiva() {
    const sessao = verificarSessao();
    
    if (!sessao) {
        return null;
    }
    
    // Se for convidado, retornar dados específicos
    if (sessao.isGuest) {
        return {
            id: sessao.userId,
            nome: sessao.nome,
            email: sessao.email,
            isGuest: true
        };
    }
    
    return {
        id: sessao.userId,
        nome: sessao.nome,
        email: sessao.email,
        isGuest: false
    };
}

function logout() {
    // Limpar sessões
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    
    exibirToast('Logout realizado com sucesso!', 'success');
    
    // Redirecionar para login
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 500);
}

// ============================================
// INICIALIZAÇÃO
// ============================================

// Inicializar dados mock
initMockData();

// Verificar se já está logado (se tentar acessar login com sessão ativa)
document.addEventListener('DOMContentLoaded', () => {
    const sessao = verificarSessao();
    if (sessao && window.location.pathname.includes('login.html')) {
        // Se já está logado, redirecionar para a lista
        redirecionarParaLista();
    }
    
    // Adicionar evento de submit ao formulário de cadastro
    const cadastroForm = document.getElementById('cadastro-form');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', handleCadastro);
    }
    
    // Adicionar evento para "Esqueci minha senha"
    const esqueciLink = document.getElementById('esqueci-senha');
    if (esqueciLink) {
        esqueciLink.addEventListener('click', (e) => {
            e.preventDefault();
            exibirToast('Funcionalidade em desenvolvimento. Contate o suporte.', 'info');
        });
    }
});

// Expor funções globalmente (para onclick nos botões)
window.handleLogin = handleLogin;
window.handleCadastro = handleCadastro;
window.abrirModalCadastro = abrirModalCadastro;
window.fecharModalCadastro = fecharModalCadastro;
window.modoConvidado = modoConvidado;
window.logout = logout;
window.getSessaoAtiva = getSessaoAtiva;