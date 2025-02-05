document.addEventListener('DOMContentLoaded', async () => {
    const userId = await getUserId();
    const chatList = document.getElementById('chatList');
    const messagesContainer = document.getElementById('messagesContainer');
    const chatTitle = document.getElementById('chatTitle');
    const animalImage = document.getElementById('animalImage');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const finalizarVendaButton = document.getElementById('finalizarVenda');
    let activeChatId = null;
  
    // Função para obter o ID do usuário logado
    async function getUserId() {
      try {
        const response = await fetch('/api/usuario-logado');
        const data = await response.json();
        if (!data.userId) {
          console.error('Erro: Não foi possível obter o ID do usuário.');
          return null; // Retorna null caso não consiga obter o userId
        }
        return data.userId;
      } catch (error) {
        console.error('Erro ao obter o ID do usuário:', error);
        return null;
      }
    }
  
    // Carregar os chats do usuário
    async function loadChats() {
      try {
        const response = await fetch('/api/meus_chats');
        if (!response.ok) {
          console.error('Erro ao carregar os chats:', response.statusText);
          return;
        }
  
        const chats = await response.json();
        
        if (!chats || chats.length === 0) {
          chatList.innerHTML = '<p>Nenhum chat encontrado.</p>';
          return;
        }
  
        chatList.innerHTML = '';  // Limpar a lista antes de carregar os novos chats
  
        chats.forEach(chat => {
          const chatItem = document.createElement('li');
          const imageUrl = chat.animal_imagem_url || '/images/placeholder.jpg';
          const otherUserName = chat.outro_usuario_nome;
  
          chatItem.innerHTML = `
            <img src="${imageUrl}" alt="${chat.anuncio_nome}" class="animal-img"/>
            <div>${chat.anuncio_nome} - ${otherUserName}</div>
          `;
          chatItem.addEventListener('click', () => openChat(chat.chat_id, chat.anuncio_nome, otherUserName, imageUrl));
          chatList.appendChild(chatItem);
        });
      } catch (error) {
        console.error('Erro ao carregar chats:', error);
        chatList.innerHTML = '<p>Erro ao carregar chats. Tente novamente mais tarde.</p>';
      }
    }
  
    // Função para abrir o chat selecionado
    async function openChat(chatId, animalName, otherUserName, animalImgUrl) {
      activeChatId = chatId;
      chatTitle.textContent = `${animalName} - ${otherUserName}`;
      animalImage.src = animalImgUrl.startsWith('/uploads') ? animalImgUrl : '/images/placeholder.jpg';
      messagesContainer.innerHTML = '';  // Limpar mensagens anteriores
  
      try {
        const response = await fetch(`/api/mensagens/${chatId}`);
        if (!response.ok) {
          console.error('Erro ao carregar mensagens:', response.statusText);
          return;
        }
  
        const messages = await response.json();
        messages.forEach(msg => {
          displayMessage(msg, msg.remetente_id === userId ? 'sent' : 'received');
        });
  
        // Verifica o papel do usuário (anunciante ou adotante)
        const roleResponse = await fetch(`/api/role_chat/${chatId}?userId=${userId}`);
        const roleData = await roleResponse.json();
  
        if (roleData.role === 'anunciante') {
          finalizarVendaButton.disabled = false;
          finalizarVendaButton.title = "";  // Remove qualquer tooltip
        } else if (roleData.role === 'adotante') {
          finalizarVendaButton.disabled = true;
          finalizarVendaButton.title = "Apenas o anunciante pode finalizar a adoção.";
        } else {
          console.error("Erro: Papel do usuário não identificado.");
        }
      } catch (error) {
        console.error('Erro ao abrir o chat:', error);
        alert('Erro ao carregar o chat. Tente novamente mais tarde.');
      }
    }
  
    // Função para exibir mensagem
    function displayMessage(messageData, type) {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message', type);
  
      if (type === 'received') {
        const senderName = document.createElement('div');
        senderName.classList.add('sender-name');
        senderName.textContent = messageData.remetente_nome;
        messageDiv.appendChild(senderName);
      }
  
      const messageText = document.createElement('div');
      messageText.textContent = messageData.mensagem;
      messageDiv.appendChild(messageText);
  
      const messageDate = new Date(messageData.data_envio);
      const time = document.createElement('div');
      time.classList.add('time');
      time.textContent = isNaN(messageDate.getTime()) ? 'Agora' : messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      messageDiv.appendChild(time);
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  
    // Função para enviar uma nova mensagem
    async function sendMessage() {
      if (!activeChatId || !messageInput.value.trim()) {
        alert("Selecione um chat e escreva uma mensagem antes de enviar.");
        return;
      }
  
      const message = messageInput.value.trim();
      try {
        const response = await fetch('/api/mensagens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: activeChatId, remetenteId: userId, mensagem: message })
        });
  
        if (response.ok) {
          const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          displayMessage({ remetente_id: userId, mensagem: message, data_envio: currentTime }, 'sent');
          messageInput.value = '';
        } else {
          alert("Erro ao enviar mensagem. Tente novamente.");
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        alert("Erro ao enviar mensagem. Tente novamente.");
      }
    }
  
    // Função para finalizar a venda
    finalizarVendaButton.addEventListener('click', async () => {
      if (!activeChatId) {
        alert("Selecione um chat antes de finalizar a venda.");
        return;
      }
  
      const confirmacao = confirm("Você tem certeza que deseja finalizar a venda do animal?");
      
      if (!confirmacao) return;
  
      try {
        const response = await fetch('/api/finalizar_venda', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: activeChatId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          if (data.message === "A venda já foi finalizada.") {
            console.log("Venda já finalizada anteriormente.");
            alert("A venda deste animal já foi finalizada.");
          } else {
            alert("Venda finalizada com sucesso!");
            setTimeout(() => window.location.href = '/home.html', 2000); // Redireciona após 2 segundos
          }
        } else {
          alert("Erro ao finalizar a venda. Tente novamente.");
        }
      } catch (error) {
        console.error("Erro ao finalizar a venda:", error);
        alert("Erro ao finalizar a venda. Tente novamente.");
      }
    });
  
    // Iniciar carregamento de chats
    if (userId) {
      loadChats();
    } else {
      alert('Erro: Usuário não encontrado.');
    }
  
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
      }
    });
  });
