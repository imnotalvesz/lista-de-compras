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
        lembrar: lembrar,
        isGuest: false
    };
    
    const duracao = lembrar ? SESSION_DURATION.REMEMBER : SESSION_DURATION.TEMP;
    sessao.expiraEm = Date.now() + duracao;
    
    if (lembrar) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessao));
        sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    } else {
        sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessao));
        localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
}

function verificarSessao() {
    let sessao = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!sessao) {
        sessao = sessionStorage.getItem(STORAGE_KEYS.SESSION);
    }
    
    if (!sessao) return null;
    
    try {
        const dados = JSON.parse(sessao);
        
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
    if (event) event.preventDefault();
    
    const email = document.getElementById('email')?.value.trim();
    const senha = document.getElementById('senha')?.value;
    const lembrar = document.getElementById('lembrar-me')?.checked || false;
    
    if (!email || !senha) {
        exibirToast('Preencha todos os campos', 'error');
        return;
    }
    
    if (!validarEmail(email)) {
        exibirToast('Digite um email válido', 'error');
        return;
    }
    
    mostrarSpinner('btn-login', true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const usuario = users.find(u => u.email === email && u.senha === senha);
        
        if (!usuario) {
            exibirToast('Email ou senha inválidos', 'error');
            mostrarSpinner('btn-login', false);
            return;
        }
        
        criarSessao(usuario, lembrar);
        exibirToast(`Bem-vindo(a) de volta, ${usuario.nome}! 🎉`, 'success');
        
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
    if (event) event.preventDefault();
    
    const nome = document.getElementById('cadastro-nome')?.value.trim();
    const email = document.getElementById('cadastro-email')?.value.trim();
    const senha = document.getElementById('cadastro-senha')?.value;
    const confirmar = document.getElementById('cadastro-confirmar')?.value;
    
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
    
    mostrarSpinner('btn-cadastrar', true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        
        if (users.find(u => u.email === email)) {
            exibirToast('Este email já está cadastrado', 'error');
            mostrarSpinner('btn-cadastrar', false);
            return;
        }
        
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
        
        fecharModalCadastro();
        if (document.getElementById('cadastro-form')) {
            document.getElementById('cadastro-form').reset();
        }
        
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = email;
        const senhaInput = document.getElementById('senha');
        if (senhaInput) senhaInput.focus();
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        exibirToast('Erro ao criar conta. Tente novamente.', 'error');
    } finally {
        mostrarSpinner('btn-cadastrar', false);
    }
}

function modoConvidado() {
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
    
    setTimeout(() => {
        redirecionarParaLista();
    }, 500);
}

// ============================================
// FUNÇÕES DO MODAL
// ============================================

function abrirModalCadastro() {
    const modal = document.getElementById('modal-cadastro');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        const form = document.getElementById('cadastro-form');
        if (form) form.reset();
    }
}

function fecharModalCadastro() {
    const modal = document.getElementById('modal-cadastro');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ============================================
// FUNÇÃO PARA RECUPERAR SESSÃO (usada no index.html)
// ============================================

function getSessaoAtiva() {
    const sessao = verificarSessao();
    
    if (!sessao) {
        return null;
    }
    
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
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    exibirToast('Logout realizado com sucesso!', 'success');
    
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 500);
}

// ============================================
// EXPORTAÇÕES (para uso em outros módulos)
// ============================================

// Exportações para módulos ES6
export { 
    getSessaoAtiva, 
    logout, 
    handleLogin, 
    handleCadastro, 
    abrirModalCadastro, 
    fecharModalCadastro, 
    modoConvidado 
};

// Expor funções globalmente (para onclick nos botões HTML)
if (typeof window !== 'undefined') {
    window.handleLogin = handleLogin;
    window.handleCadastro = handleCadastro;
    window.abrirModalCadastro = abrirModalCadastro;
    window.fecharModalCadastro = fecharModalCadastro;
    window.modoConvidado = modoConvidado;
    window.logout = logout;
    window.getSessaoAtiva = getSessaoAtiva;
}

// ============================================
// INICIALIZAÇÃO
// ============================================

initMockData();

// Verificar sessão ativa na página de login
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const sessao = verificarSessao();
        if (sessao && window.location.pathname.includes('login.html')) {
            redirecionarParaLista();
        }
        
        const cadastroForm = document.getElementById('cadastro-form');
        if (cadastroForm) {
            cadastroForm.addEventListener('submit', handleCadastro);
        }
        
        const esqueciLink = document.getElementById('esqueci-senha');
        if (esqueciLink) {
            esqueciLink.addEventListener('click', (e) => {
                e.preventDefault();
                exibirToast('Funcionalidade em desenvolvimento. Contate o suporte.', 'info');
            });
        }
        
        // Fechar modal ao clicar fora
        const modal = document.getElementById('modal-cadastro');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    fecharModalCadastro();
                }
            });
        }
        
        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('modal-cadastro');
                if (modal && modal.classList.contains('show')) {
                    fecharModalCadastro();
                }
            }
        });
    });
}