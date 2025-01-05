document.addEventListener('DOMContentLoaded', () => {
  const catalogo = document.getElementById('catalogo');

  // Fazer uma requisição para obter o catálogo de animais
  fetch('/api/animais')
    .then(response => response.json())
    .then(animais => {
      console.log(animais); // Verificar os dados recebidos da API

      animais.forEach(animal => {
        // Criar elemento card para cada animal
        const card = document.createElement('div');
        card.classList.add('card');
        card.onclick = () => window.location.href = `detalhes.html?id=${animal.id}`;

        // Verificar se há uma URL válida para a imagem do animal
        let imageUrl = animal.imagem_url || 'placeholder.jpg'; // Imagem de placeholder caso não haja imagem disponível
        console.log(`Imagem URL: ${imageUrl}`); // Verificar o URL da imagem

        card.innerHTML = `
          <img src="${imageUrl}" alt="${animal.anuncio_nome}" class="animal-img"/>
          <h2>${animal.anuncio_nome}</h2>
          <p>Raça: ${animal.raca}</p>
          <p>Coloração: ${animal.coloracao}</p>
          <p>Vacinado: ${animal.vacinado === 'Sim' ? 'Sim' : 'Não'}</p>
          <p>Data de Nascimento: ${new Date(animal.data_nascimento).toLocaleDateString()}</p>
          <p>${animal.descricao}</p>
        `;

        catalogo.appendChild(card);
      });
    })
    .catch(err => console.error('Erro ao obter o catálogo de animais:', err));
});
