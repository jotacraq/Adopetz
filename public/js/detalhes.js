document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const animalId = params.get('id');
  const animalDetails = document.getElementById('animal-details');

  // Função para obter o ID do usuário logado de forma síncrona
  const getUserId = async () => {
    try {
      const response = await fetch('/api/usuario-logado');
      const data = await response.json();
      if (data.userId) {
        return data.userId;
      } else {
        console.error('Usuário não autenticado');
        return null;
      }
    } catch (err) {
      console.error('Erro ao obter o ID do usuário:', err);
      return null;
    }
  };

  // Obter o ID do usuário logado
  const userId = await getUserId();

  // Fazer uma requisição para obter os detalhes do animal
  try {
    const response = await fetch(`/api/animais/${animalId}`);
    const animal = await response.json();

    // Definir a URL da imagem corretamente
    const imageUrl = animal.imagem_url || 'images/placeholder.jpg';

    animalDetails.innerHTML = `
      <img src="${imageUrl}" alt="${animal.anuncio_nome}" class="animal-img"/>
      <div class="details">
        <h1>${animal.anuncio_nome}</h1>
        <p><strong>Raça:</strong> ${animal.raca}</p>
        <p><strong>Coloração:</strong> ${animal.coloracao}</p>
        <p><strong>Vacinado:</strong> ${animal.vacinado === 'true' ? 'Sim' : 'Não'}</p>
        <p><strong>Data de Nascimento:</strong> ${new Date(animal.data_nascimento).toLocaleDateString()}</p>
        <p><strong>Descrição:</strong> ${animal.descricao}</p>
      </div>
    `;

    // Criar e adicionar o botão de iniciar chat
    const startChatButton = document.createElement('button');
    startChatButton.id = 'startChatBtn';
    startChatButton.textContent = 'Iniciar Conversa com o Dono';

    // Verifica se o usuário logado é o dono do anúncio
    if (userId === animal.usuario_id) {
      startChatButton.disabled = true;  // Desabilita o botão se for o próprio dono
      startChatButton.textContent = 'Você não pode iniciar uma conversa com seu próprio anúncio.';
    } else {
      // Adiciona o evento de clique para iniciar o chat se não for o dono
      startChatButton.addEventListener('click', async () => {
        try {
          const checkChatResponse = await fetch('/api/verificar_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ animal_id: animalId, adotante_id: userId, anunciante_id: animal.usuario_id })
          });
          const checkChatData = await checkChatResponse.json();

          if (checkChatData.chatId) {
            // Chat já existe, redireciona para ele
            window.location.href = `/chats.html?chatId=${checkChatData.chatId}`;
          } else {
            // Cria um novo chat se ainda não existir
            const chatResponse = await fetch('/api/iniciar_chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ animal_id: animalId, adotante_id: userId, anunciante_id: animal.usuario_id })
            });

            if (chatResponse.ok) {
              const { chatId } = await chatResponse.json();
              window.location.href = `/chats.html?chatId=${chatId}`;
            } else {
              alert('Erro ao iniciar o chat.');
            }
          }
        } catch (err) {
          console.error('Erro ao tentar iniciar ou redirecionar para o chat:', err);
        }
      });
    }

    animalDetails.appendChild(startChatButton);

  } catch (err) {
    animalDetails.innerHTML = `<p>Erro ao carregar os detalhes do animal.</p>`;
    console.error('Erro ao obter os detalhes do animal:', err);
  }
});

