document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('edit-form');
    const animalId = new URLSearchParams(window.location.search).get('id');
    const currentImage = document.getElementById('current-image');
    const newImagePreview = document.getElementById('new-image-preview');
    const imagemInput = document.getElementById('imagem');
    const undoButton = document.getElementById('undo-button');
    let originalImageSrc = '';
    let newImageFile = null;

    if (!animalId) {
        alert('ID do animal não fornecido.');
        window.location.href = '/meus_anuncios.html';
        return;
    }

    // Buscar os dados atuais do animal e preencher o formulário
    fetch(`/api/meus_anuncios/${animalId}`)
        .then(response => {
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }
            if (!response.ok) {
                return response.text().then(html => { 
                    throw new Error('Erro ao buscar os dados do anúncio.');
                });
            }
            return response.json();
        })
        .then(anuncio => {
            if (anuncio.anuncio_nome) form.anuncio_nome.value = anuncio.anuncio_nome;
            if (anuncio.descricao) form.descricao.value = anuncio.descricao;
            if (anuncio.raca) form.raca.value = anuncio.raca;

            if (anuncio.data_nascimento) {
                const formattedDate = new Date(anuncio.data_nascimento).toISOString().split('T')[0];
                form.data_nascimento.value = formattedDate;
                form.data_nascimento.setAttribute('readonly', true); 
            }

            if (anuncio.coloracao) form.coloracao.value = anuncio.coloracao;
            if (anuncio.vacinado) form.vacinado.value = anuncio.vacinado;
            if (anuncio.idade !== undefined) form.idade.value = anuncio.idade;

            // Carregar a imagem atual
            currentImage.src = anuncio.imagem_url ? anuncio.imagem_url : 'Images/placeholder.jpg';
            originalImageSrc = anuncio.imagem_url;
        })
        .catch(error => {
            console.error('Erro:', error);
            alert(error.message);
            window.location.href = '/meus_anuncios.html';
        });

    imagemInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            newImageFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                newImagePreview.src = e.target.result;
                newImagePreview.style.display = 'block';
                undoButton.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            newImagePreview.src = '';
            newImagePreview.style.display = 'none';
            undoButton.style.display = 'none';
            newImageFile = null;
        }
    });

    undoButton.addEventListener('click', () => {
        imagemInput.value = '';
        newImagePreview.src = '';
        newImagePreview.style.display = 'none';
        undoButton.style.display = 'none';
        newImageFile = null;
    });

    // Envio do formulário para atualizar o anúncio
    form.addEventListener('submit', (event) => {
        event.preventDefault();
    
        const anuncio_nome = form.anuncio_nome.value.trim();
        const descricao = form.descricao.value.trim();
        const raca = form.raca.value.trim();
        const data_nascimento = form.data_nascimento.value;
        const coloracao = form.coloracao.value.trim();
        const vacinado = form.vacinado.value;
        const idade = parseInt(form.idade.value, 10);
    
        if (!anuncio_nome || !descricao || !raca || !data_nascimento || !coloracao || !vacinado || isNaN(idade)) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
    
        // Preparar os dados para envio com base nas alterações
        const formData = new FormData();
    
        if (anuncio_nome !== form.anuncio_nome.defaultValue) {
            formData.append('anuncio_nome', anuncio_nome);
        }
        if (descricao !== form.descricao.defaultValue) {
            formData.append('descricao', descricao);
        }
        if (raca !== form.raca.defaultValue) {
            formData.append('raca', raca);
        }
        if (data_nascimento !== form.data_nascimento.defaultValue) {
            formData.append('data_nascimento', data_nascimento);
        }
        if (coloracao !== form.coloracao.defaultValue) {
            formData.append('coloracao', coloracao);
        }
        if (vacinado !== form.vacinado.defaultValue) {
            formData.append('vacinado', vacinado);
        }
        if (idade !== parseInt(form.idade.defaultValue, 10)) {
            formData.append('idade', idade);
        }
    
        // Enviar a nova imagem apenas se foi selecionada
        if (newImageFile) {
            formData.append('imagem', newImageFile);
        } else {
            // Caso não tenha nova imagem, envie o campo vazio para o backend
            formData.append('imagem', '');  // Isso indica que a foto não será alterada
        }
    
        console.log('Dados do formulário:', formData);
    
        fetch(`/api/meus_anuncios/${animalId}`, {
            method: 'PUT',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                alert('Anúncio atualizado com sucesso.');
                window.location.href = '/meus_anuncios.html';
            } else {
                return response.text().then(text => { 
                    throw new Error('Erro ao atualizar o anúncio: ' + text);
                });
            }
        })
        .catch(error => {
            console.error('Erro ao atualizar o anúncio:', error);
            alert(error.message);
        });
    });
});    


