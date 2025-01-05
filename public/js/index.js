document.addEventListener('DOMContentLoaded', () => {
    carregarAnimaisVitrine();
    carregarDadosUsuario();
    configurarLogout();  // Configura o botão de logout
});

function configurarLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);  // Adiciona o evento de click no botão de logout
    }
}

function toggleMiniNavbar() {
    const miniNavbar = document.getElementById('mini-navbar');
    // Alterna entre mostrar e esconder a mini navbar
    miniNavbar.style.display = miniNavbar.style.display === 'block' ? 'none' : 'block';
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

function carregarAnimaisVitrine() {
    fetch('/api/animais-vitrine')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar animais');
            }
            return response.json();
        })
        .then(animais => {
            const containerVitrine = document.getElementById('animais-vitrine');
            if (!containerVitrine) return;

            containerVitrine.innerHTML = '';

            animais.forEach(animal => {
                const card = document.createElement('a');
                card.href = `detalhes.html?id=${animal.id}`;
                card.classList.add('card-animais');

                const img = document.createElement('img');
                img.src = animal.imagem_url || 'Images/placeholder.jpg';
                img.alt = `Imagem de ${animal.anuncio_nome}`;
                img.classList.add('img-animal');

                const titulo = document.createElement('h3');
                titulo.classList.add('titulo-card');
                titulo.textContent = animal.anuncio_nome;

                const idade = document.createElement('p');
                idade.classList.add('idade-card');
                idade.textContent = animal.idade ? `${animal.idade} anos` : 'Idade desconhecida';

                const btnDetalhes = document.createElement('span');
                btnDetalhes.classList.add('btn-ver-detalhes');
                btnDetalhes.textContent = 'Ver Detalhes';

                card.appendChild(img);
                card.appendChild(titulo);
                card.appendChild(idade);
                card.appendChild(btnDetalhes);
                containerVitrine.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar a vitrine de animais:', error);
            const containerVitrine = document.getElementById('animais-vitrine');
            containerVitrine.innerHTML = '<p>Erro ao carregar os animais.</p>';
        });
}
