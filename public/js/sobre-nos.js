document.addEventListener('DOMContentLoaded', () => {
    configurarLogout();  // Configura o botão de logout
    carregarDadosUsuario();  // Carrega os dados do usuário
});

function configurarLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);  // Adiciona o evento de click no botão de logout
    }
}

function logout() {
    fetch('/api/logout', {
        method: 'POST', // Método de requisição POST
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'  // Envia o cookie da sessão
    }).then(response => {
        if (response.ok) {
            window.location.href = '/login.html';  // Redireciona para a página de login após logout
        } else {
            console.error('Erro ao fazer logout');
        }
    }).catch(error => {
        console.error('Erro ao fazer logout', error);
    });
}

function toggleMiniNavbar() {
    const miniNavbar = document.getElementById('mini-navbar');
    miniNavbar.style.display = miniNavbar.style.display === 'block' ? 'none' : 'block';
}

function carregarDadosUsuario() {
    fetch('/api/usuario-dados')
        .then(response => {
            if (response.status === 401) {
                // Redireciona para a página de login se não estiver autenticado
                window.location.href = '/login.html';
                return;
            }
            return response.json();
        })
        .then(data => {
            if (data) {
                // Define a imagem de perfil e o nome do usuário
                document.querySelector('.foto-usuario').src = data.foto || 'Images/cliente.png';
                document.querySelector('.nome-usuario').textContent = data.nome || 'Usuário';
            }
        })
        .catch(error => console.error('Erro ao carregar dados do usuário:', error));
}

