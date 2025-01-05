document.addEventListener('DOMContentLoaded', () => {
    const catalogo = document.getElementById('catalogo');

    // Requisição para obter os anúncios do usuário
    fetch('/api/meus_anuncios')
        .then(response => {
            if (response.status === 401) {
                // Redirecionar para a página de login se o usuário não estiver autenticado
                window.location.href = '/login.html';
                return;
            }
            return response.json();
        })
        .then(anuncios => {
            console.log('Anúncios recebidos:', anuncios);

            if (!anuncios || anuncios.length === 0) {
                catalogo.innerHTML = '<p>Nenhum anúncio encontrado.</p>';
                return;
            }

            anuncios.forEach(anuncio => {
                const card = document.createElement('div');
                card.classList.add('card');

                const registroFormatado = new Date(anuncio.data_registro).toLocaleDateString('pt-BR');

                card.innerHTML = `
                    <img src="${anuncio.imagem_url}" alt="${anuncio.anuncio_nome}" class="animal-img"/>
                    <div>
                        <h2>${anuncio.anuncio_nome}</h2>
                        <p class="data-registro">Data de Registro: ${registroFormatado}</p>
                    </div>
                    <div class="actions">
                        <button class="edit-button" data-id="${anuncio.id}" title="Editar">
                            <img src="Images/editaranimal.png" alt="Editar">
                        </button>
                        <button class="delete-button" data-id="${anuncio.id}" title="Excluir">
                            <img src="Images/excluiranimal.png" alt="Excluir">
                        </button>
                    </div>
                `;

                catalogo.appendChild(card);
            });

            // Adicionar event listeners para os botões de excluir e editar
            document.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', handleDelete);
            });

            document.querySelectorAll('.edit-button').forEach(button => {
                button.addEventListener('click', handleEdit);
            });
        })
        .catch(err => console.error('Erro ao obter os anúncios do usuário:', err));

    // Função para lidar com a exclusão de um anúncio
    function handleDelete(event) {
        const animalId = event.currentTarget.getAttribute('data-id');

        if (confirm('Tem certeza que deseja excluir este animal? Esta ação não pode ser desfeita.')) {
            fetch(`/api/meus_anuncios/${animalId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    // Remover o card do DOM
                    const card = event.currentTarget.closest('.card');
                    if (card) {
                        card.remove();
                    }
                    alert('Anúncio excluído com sucesso.');
                } else if (response.status === 401) {
                    alert('Você não está autenticado. Por favor, faça login novamente.');
                    window.location.href = '/login.html';
                } else {
                    return response.json().then(data => { throw new Error(data.message || 'Erro ao excluir o anúncio.'); });
                }
            })
            .catch(error => {
                console.error('Erro ao excluir o anúncio:', error);
                alert(error.message);
            });
        }
    }

    // Função para redirecionar à página de edição com o ID do animal como parâmetro
    function handleEdit(event) {
        const animalId = event.currentTarget.getAttribute('data-id');
        window.location.href = `/editar_animal.html?id=${animalId}`;
    }
});
