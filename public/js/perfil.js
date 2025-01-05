document.addEventListener("DOMContentLoaded", () => {
    // Carregar dados do usuário logado
    fetch('/api/usuario-dados')
        .then(response => response.json())
        .then(data => {
            console.log('Dados do usuário recebidos:', data); // Log para verificar os dados recebidos
            if (data) {
                document.getElementById('nome').value = data.nome || '';
                document.getElementById('telefone').value = formatarTelefone(data.telefone) || '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('cpf').value = data.cpf || '';
                document.getElementById('cep').value = data.cep || '';
                document.getElementById('datanasc').value = formatarData(data.datanasc) || '';
                document.querySelector('.nome-usuario').textContent = data.nome || 'Usuário';
            }
        })
        .catch(error => console.error('Erro ao carregar os dados do usuário:', error));

    configurarMiniNavbar();
    configurarLogout();
    configurarRedefinirSenha();

    // Associar a função de atualizar dados ao botão de confirmar alterações
    const confirmarAlteracoesBtn = document.getElementById('confirmar-alteracoes-btn');
    if (confirmarAlteracoesBtn) {
        confirmarAlteracoesBtn.addEventListener('click', atualizarDados);
    } else {
        console.error('Elemento #confirmar-alteracoes-btn não encontrado no DOM.');
    }
});

// Habilitar edição do campo
function habilitarEdicao(campoId) {
    const campo = document.getElementById(campoId);
    campo.disabled = false;
    campo.classList.add('editavel');
    campo.focus();
}

// Atualizar dados do usuário
async function atualizarDados() {
    const nome = document.getElementById('nome').value;
    const telefone = removerFormatacaoTelefone(document.getElementById('telefone').value);
    const email = document.getElementById('email').value;

    try {
        const response = await fetch('/api/atualizar-dados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, telefone, email })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar os dados. Código da resposta: ' + response.status);
        }

        const data = await response.json();

        // Verificar a resposta do servidor
        if (data.message) {
            alert(data.message || 'Dados atualizados com sucesso.');

            // Atualizar dados nas tabelas específicas (Pessoa Física ou Pessoa Jurídica)
            if (data.tipo === 'fisica') {
                await atualizarPessoaFisica(data.pessoa_id, { nome, telefone, email });
            } else if (data.tipo === 'juridica') {
                await atualizarPessoaJuridica(data.pessoa_id, { nome, telefone, email });
            }

            // Desabilitar campos novamente após a atualização bem-sucedida
            desabilitarEdicaoCampos(['nome', 'telefone', 'email']);
        } else {
            throw new Error('Erro desconhecido ao atualizar os dados.');
        }
    } catch (error) {
        console.error('Erro ao atualizar os dados do usuário:', error);
        alert('Erro ao atualizar os dados do usuário. Por favor, tente novamente mais tarde.');
    }
}

// Desabilitar edição dos campos após a atualização
function desabilitarEdicaoCampos(campos) {
    campos.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo) {
            campo.disabled = true;
            campo.classList.remove('editavel');
        }
    });
}

// Atualizar dados na tabela Pessoa Física
async function atualizarPessoaFisica(pessoaId, dados) {
    try {
        const response = await fetch(`/api/atualizar-pessoafisica/${pessoaId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar dados na tabela Pessoa Física.');
        }
    } catch (error) {
        console.error('Erro ao atualizar Pessoa Física:', error);
    }
}

// Atualizar dados na tabela Pessoa Jurídica
async function atualizarPessoaJuridica(pessoaId, dados) {
    try {
        const response = await fetch(`/api/atualizar-pessoajuridica/${pessoaId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar dados na tabela Pessoa Jurídica.');
        }
    } catch (error) {
        console.error('Erro ao atualizar Pessoa Jurídica:', error);
    }
}

// Formatar data para exibição (yyyy-mm-dd para dd/mm/yyyy)
function formatarData(dataString) {
    const data = new Date(dataString);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Formatar telefone para (XX) XXXXX-XXXX
function formatarTelefone(telefone) {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

// Remover formatação do telefone
function removerFormatacaoTelefone(telefoneFormatado) {
    return telefoneFormatado.replace(/\D/g, '');
}

// Configurar a mini-navbar
function configurarMiniNavbar() {
    const perfilUsuario = document.querySelector('.perfil-usuario');
    if (perfilUsuario) {
        perfilUsuario.addEventListener('click', (event) => {
            event.stopPropagation(); // Impede o clique de se propagar para outros elementos
            toggleMiniNavbar();
        });

        document.addEventListener('click', (event) => {
            const miniNavbar = document.getElementById('mini-navbar');
            if (miniNavbar && miniNavbar.style.display === 'block' && !miniNavbar.contains(event.target) && event.target !== perfilUsuario) {
                miniNavbar.style.display = 'none';
            }
        });
    } else {
        console.error('Elemento .perfil-usuario não encontrado no DOM.');
    }
}

// Alternar visibilidade da mini-navbar
function toggleMiniNavbar() {
    const miniNavbar = document.getElementById('mini-navbar');
    if (miniNavbar) {
        miniNavbar.style.display = miniNavbar.style.display === 'block' ? 'none' : 'block';
    } else {
        console.error('Elemento #mini-navbar não encontrado no DOM.');
    }
}

// Configurar logout
function configurarLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            logout();
        });
    } else {
        console.error('Elemento #logout-btn não encontrado no DOM.');
    }
}

// Realizar logout
function logout() {
    fetch('/api/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/login';
        } else {
            console.error('Erro ao fazer logout.');
        }
    })
    .catch(error => console.error('Erro ao fazer logout:', error));
}

// Configurar redefinição de senha
function configurarRedefinirSenha() {
    const redefinirSenhaBtn = document.getElementById('redefinir-senha-btn');
    if (redefinirSenhaBtn) {
        redefinirSenhaBtn.addEventListener('click', () => {
            const telefoneCampo = document.getElementById('telefone');
            let telefone = telefoneCampo.value;
            telefone = removerFormatacaoTelefone(telefone);
            telefoneCampo.value = formatarTelefone(telefone);
        });
    } else {
        console.error('Elemento #redefinir-senha-btn não encontrado no DOM.');
    }
}
