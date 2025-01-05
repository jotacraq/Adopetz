-- Criação do banco de dados e seleção
CREATE DATABASE IF NOT EXISTS adopetz;
USE adopetz;

-- Tabela de Super Administrador
DROP TABLE IF EXISTS super_administrador;
CREATE TABLE IF NOT EXISTS super_administrador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cep CHAR(9) NOT NULL,
    cpf CHAR(11) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

-- Tabela de Administrador
DROP TABLE IF EXISTS administrador;
CREATE TABLE IF NOT EXISTS administrador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cep CHAR(9) NOT NULL,
    cpf CHAR(11) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

-- Tabela de Clientes
DROP TABLE IF EXISTS usuario;
CREATE TABLE IF NOT EXISTS usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf CHAR(11) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    cep CHAR(9) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datanasc DATE NOT NULL
);

-- Tabela de Animais
DROP TABLE IF EXISTS animais;
CREATE TABLE IF NOT EXISTS animais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    imagem_data VARCHAR(255) NOT NULL,
    anuncio_nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    raca VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    coloracao VARCHAR(100) NOT NULL,
    vacinado VARCHAR(10) NOT NULL,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ano_registro INT GENERATED ALWAYS AS (YEAR(data_registro)) STORED,
    idade INT NOT NULL,
    usuario_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
)
PARTITION BY RANGE (ano_registro) (
    PARTITION p2021 VALUES LESS THAN (2022),
    PARTITION p2022 VALUES LESS THAN (2023),
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Tabela de Chats
DROP TABLE IF EXISTS chats;
CREATE TABLE IF NOT EXISTS chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    adotante_id INT NOT NULL,
    anunciante_id INT NOT NULL,
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (adotante_id) REFERENCES usuario(id),
    FOREIGN KEY (anunciante_id) REFERENCES usuario(id),
    FOREIGN KEY (animal_id) REFERENCES animais(id)
);

-- Tabela de Mensagens
DROP TABLE IF EXISTS mensagens;
CREATE TABLE IF NOT EXISTS mensagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT NOT NULL,
    remetente_id INT NOT NULL,
    mensagem TEXT NOT NULL,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id),
    FOREIGN KEY (remetente_id) REFERENCES usuario(id)
);

-- Tabela de Adoção
DROP TABLE IF EXISTS adocao;
CREATE TABLE IF NOT EXISTS adocao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_animal INT NOT NULL,
    animal_nome VARCHAR(255) NOT NULL,
    animal_raca VARCHAR(100) NOT NULL,
    adotante_id INT NOT NULL,
    Status ENUM('Pendente', 'Aprovada', 'Rejeitada') NOT NULL,
    anunciante_id INT NOT NULL,
    adotante_nome VARCHAR(255),
    adotante_cpf VARCHAR(50),
    anunciante_nome VARCHAR(255),
    anunciante_cpf VARCHAR(50),
    data_adocao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (adotante_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (anunciante_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (id_animal) REFERENCES animais(id)
);

-- Tabela de Avaliações
DROP TABLE IF EXISTS avaliacao;
CREATE TABLE IF NOT EXISTS avaliacao (
    Idavaliação INT AUTO_INCREMENT PRIMARY KEY,
    Comentario TEXT,
    usuario_id INT,
    adocao_id INT,
    Data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (adocao_id) REFERENCES adocao(id) ON DELETE CASCADE
);

-- Inserções de dados de exemplo

-- Super Administrador
INSERT INTO super_administrador (nome, cep, cpf, telefone, email, senha) 
VALUES ('João Souza', '12345-678', '12134522122', '11223452222', 'admin123@admin', 'senha123');

-- Administrador
INSERT INTO administrador (nome, cep, cpf, telefone, email, senha) 
VALUES ('João Souza', '12345-678', '11134522122', '11223452222', 'admin@admin.com', 'senha123');

-- Cliente
INSERT INTO usuario (nome, cpf, telefone, cep, senha, email, estado, datanasc) 
VALUES ('Carlos Silva', '12345678900', '11987654321', '12345-678', 'senha_cliente', 'carlos@cliente.com', 'SP', '1985-02-15');

-- Inserção de animal
INSERT INTO animais (imagem_data, anuncio_nome, descricao, raca, data_nascimento, coloracao, vacinado, idade, usuario_id) 
VALUES ('imagens/animal1.jpg', 'Rex', 'Cachorro ativo e saudável', 'Pastor Alemão', '2019-05-01', 'Preto e Marrom', 'Sim', 5, 1);

SELECT * FROM usuario;
SELECT * FROM animais;
SELECT * FROM adocao;
