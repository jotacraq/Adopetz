-- Criar banco de dados e usá-lo diretamente
DROP DATABASE IF EXISTS adopetz;
CREATE DATABASE adopetz;
USE adopetz;

-- Tabela de Super Administrador
CREATE TABLE super_administrador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cep CHAR(9) NOT NULL,
    cpf CHAR(11) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

-- Tabela de Administrador
CREATE TABLE administrador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cep CHAR(9) NOT NULL,
    cpf CHAR(11) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

-- Tabela de Usuário (Clientes)
CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf CHAR(11) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    cep CHAR(9) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    estado CHAR(2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datanasc DATE NOT NULL
);

-- Tabela de Animais
CREATE TABLE animais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    imagem_data VARCHAR(255) NOT NULL,
    anuncio_nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    raca VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    coloracao VARCHAR(100) NOT NULL,
    vacinado ENUM('Sim', 'Não') NOT NULL,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ano_registro INT GENERATED ALWAYS AS (YEAR(data_registro)) STORED,
    idade INT NOT NULL,
    usuario_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL
);

-- Tabela de Chats
CREATE TABLE chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    adotante_id INT NOT NULL,
    anunciante_id INT NOT NULL,
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (adotante_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (anunciante_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (animal_id) REFERENCES animais(id) ON DELETE CASCADE
);

-- Tabela de Mensagens
CREATE TABLE mensagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT NOT NULL,
    remetente_id INT NOT NULL,
    mensagem TEXT NOT NULL,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (remetente_id) REFERENCES usuario(id) ON DELETE CASCADE
);

-- Tabela de Adoção
CREATE TABLE adocao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_animal INT NOT NULL,
    animal_nome VARCHAR(255) NOT NULL,
    animal_raca VARCHAR(100) NOT NULL,
    adotante_id INT NOT NULL,
    status ENUM('Pendente', 'Aprovada', 'Rejeitada') NOT NULL,
    anunciante_id INT NOT NULL,
    adotante_nome VARCHAR(255),
    adotante_cpf CHAR(11),
    anunciante_nome VARCHAR(255),
    anunciante_cpf CHAR(11),
    data_adocao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (adotante_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (anunciante_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (id_animal) REFERENCES animais(id) ON DELETE CASCADE
);

-- Tabela de Avaliações
CREATE TABLE avaliacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comentario TEXT,
    usuario_id INT,
    adocao_id INT,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (adocao_id) REFERENCES adocao(id) ON DELETE CASCADE
);

-- Inserções de dados de exemplo

-- Super Administrador
INSERT INTO super_administrador (nome, cep, cpf, telefone, email, senha) 
VALUES ('João Souza', '12345-678', '12134522122', '11223452222', 'admin123@admin.com', 'senha123');

-- Administrador
INSERT INTO administrador (nome, cep, cpf, telefone, email, senha) 
VALUES ('João Souza', '12345-678', '11134522122', '11223452222', 'admin@admin.com', 'senha123');

-- Cliente
INSERT INTO usuario (nome, cpf, telefone, cep, senha, email, estado, datanasc) 
VALUES ('Carlos Silva', '12345678900', '11987654321', '12345-678', 'senha_cliente', 'carlos@cliente.com', 'SP', '1985-02-15');

-- Inserção de animal (precisa de um usuário existente)
INSERT INTO animais (imagem_data, anuncio_nome, descricao, raca, data_nascimento, coloracao, vacinado, idade, usuario_id) 
VALUES ('imagens/animal1.jpg', 'Rex', 'Cachorro ativo e saudável', 'Pastor Alemão', '2019-05-01', 'Preto e Marrom', 'Sim', 5, 1);

-- Seleções para teste
SELECT * FROM usuario;
SELECT * FROM animais;
SELECT * FROM adocao;

