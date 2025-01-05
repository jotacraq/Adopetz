function previewAndSendImage() {
    const file = document.getElementById('foto').files[0];
    const preview = document.getElementById('preview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result; // Define a fonte da imagem de pré-visualização
        };
        reader.readAsDataURL(file); // Lê o arquivo como URL de dados
    } else {
        preview.src = ''; // Limpa a pré-visualização se nenhum arquivo for selecionado
    }
}
