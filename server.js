// Dependências e módulos
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const fs = require('fs');

// Configuração do app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;

// Configuração do MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'adopetz'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Conectado ao banco de dados MySQL.');
});

// Configuração de sessão
const sessionMiddleware = session({
  secret: 'segredoAdopetz',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Alterar para true em produção com HTTPS
});

// Middleware para sessão
app.use(sessionMiddleware);

// Configuração para servir arquivos estáticos e body-parser
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware para verificar se o usuário está logado
function checkLogin(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Rotas para manipulação do login e logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          console.error('Erro ao destruir sessão', err);
          return res.status(500).send('Erro ao fazer logout');
      }
      res.clearCookie('connect.sid');
      res.redirect('/login.html');
  });
});

// Rota para verificar se o usuário está logado
app.get('/api/usuario-logado', (req, res) => {
  if (req.session.userId) {
    res.json({ userId: req.session.userId });
  } else {
    res.status(401).json({ message: 'Usuário não autenticado' });
  }
});

// Quando um usuario se conecta
io.on('connection', (socket) => {
  console.log('Usuário conectado: ', socket.id);

  // Quando uma mensagem é enviada
  socket.on('nova_mensagem', (data) => {
    const { chatId, userId, mensagem } = data;

    // Insira a mensagem no banco de dados
    const sql = `INSERT INTO mensagens (chat_id, remetente_id, mensagem) VALUES (?, ?, ?)`;
    db.query(sql, [chatId, userId, mensagem], (err, result) => {
      if (err) {
        console.error('Erro ao salvar a mensagem:', err);
        socket.emit('erro_mensagem', 'Erro ao salvar a mensagem');
      } else {
        // Emitir a mensagem para todos os usuarios conectados ao chat específico
        io.emit('mensagem_enviada', { chatId, userId, mensagem });
      }
    });
  });

  // Quando o usuario desconectar
  socket.on('disconnect', () => {
    console.log('Usuário desconectado: ', socket.id);
  });
});

// ================================================
// Rotas para páginas de frontend (HTML)
// ================================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/home', checkLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/redefinir-senha', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'redefinir-senha.html'));
});

// ================================================
// Processamento de autenticação (login e cadastro)
// ================================================

// Processar login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  db.query('SELECT * FROM usuario WHERE email = ?', [email], async (err, results) => {
      if (err) {
          console.error('Erro ao tentar fazer login:', err);
          return res.status(500).send('Erro interno ao tentar fazer login.');
      }

      if (results.length == 0) {
          return res.status(401).send('Credenciais incorretas.');
      }

      const user = results[0];
      const match = await bcrypt.compare(senha, user.senha);

      if (match) {
          req.session.userId = user.id; // Atribui o ID do usuário à sessão
          req.session.userEmail = user.email;
          req.session.userName = user.nome;
          console.log('Login bem-sucedido! ID da sessão:', req.session.userId); // Verificação do ID da sessão
          res.redirect('/home');
      } else {
          res.status(401).send('Credenciais incorretas.');
      }
  });
});

// Processar cadastro de Usuário
app.post('/register', async (req, res) => {
  const { nome, email, cpf, cep, telefone, senha, estado, datanasc } = req.body;

  // Verificar se todos os campos obrigatórios foram preenchidos
  if (!nome || !email || !cpf || !cep || !telefone || !senha || !estado || !datanasc) {
    return res.status(400).send('Todos os campos obrigatórios devem ser preenchidos.');
  }

  // Validar o formato do CPF (opcional, dependendo da sua lógica)
  const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  if (!cpfRegex.test(cpf)) {
    return res.status(400).send('CPF inválido. Use o formato XXX.XXX.XXX-XX');
  }

  try {
    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Consultar se já existe um usuário com o mesmo CPF ou email
    db.query('SELECT * FROM usuario WHERE cpf = ? OR email = ?', [cpf, email], (err, results) => {
      if (err) {
        console.error('Erro ao verificar usuário existente:', err);
        return res.status(500).send('Erro ao verificar dados do usuário.');
      }

      if (results.length > 0) {
        return res.status(400).send('Erro: CPF ou Email já está cadastrado.');
      }

      // Inserir o novo usuário no banco de dados
      const sqlUsuario = 'INSERT INTO usuario (nome, email, cpf, cep, telefone, senha, estado, datanasc) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      db.query(sqlUsuario, [nome, email, cpf, cep, telefone, hashedPassword, estado, datanasc], (err, result) => {
        if (err) {
          console.error('Erro ao registrar usuário:', err);
          return res.status(500).send('Erro ao registrar Usuário.');
        }

        // Redirecionar o usuário para a página de login após o cadastro
        res.redirect('/login');
      });
    });
  } catch (error) {
    console.error('Erro inesperado:', error);
    res.status(500).send('Erro inesperado ao tentar registrar Usuário.');
  }
});



// ====================================================
// Rota para atualizar os dados do usuario nao logado
// ====================================================


// Rota para processar a redefinição de senha
app.post('/redefinir-senha', async (req, res) => {
  const { email, novaSenha } = req.body;

  if (!email || !novaSenha) {
    return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    // Função de atualização da senha diretamente na tabela usuario
    const updatePassword = (usuarioId) => {
      db.query('UPDATE usuario SET senha = ? WHERE id = ?', [hashedPassword, usuarioId], (err) => {
        if (err) {
          console.error('Erro ao atualizar senha na tabela usuario:', err);
          return res.status(500).json({ message: 'Erro interno ao redefinir a senha.' });
        }
        res.status(200).json({ message: 'Senha redefinida com sucesso!' });
      });
    };

    // Verifica se o email pertence a um usuário na tabela usuario
    db.query('SELECT id FROM usuario WHERE email = ?', [email], (err, usuarioResults) => {
      if (err) {
        console.error('Erro ao buscar email na tabela usuario:', err);
        return res.status(500).json({ message: 'Erro interno ao redefinir a senha.' });
      }

      if (usuarioResults.length > 0) {
        return updatePassword(usuarioResults[0].id);
      } else {
        return res.status(404).json({ message: 'Email não encontrado.' });
      }
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ message: 'Erro inesperado ao redefinir senha.' });
  }
});


// ================================================
// Rota para atualizar os dados do usuário logado
// ================================================

app.get('/api/usuario-dados', (req, res) => {
  if (!req.session.userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  const userId = req.session.userId;

  // Buscar dados diretamente na tabela usuario
  db.query('SELECT nome, telefone, email, cpf, cep, estado FROM usuario WHERE id = ?', [userId], (err, results) => {
      if (err) {
          console.error('Erro ao buscar dados do usuário:', err);
          return res.status(500).json({ message: 'Erro ao buscar dados do usuário.' });
      }

      if (results.length === 0) {
          return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      res.json(results[0]);
  });
});


// Rota para atualizar os dados do usuário logado
app.post('/api/atualizar-dados', checkLogin, (req, res) => {
  const userId = req.session.userId;
  const { nome, telefone, email } = req.body;

  console.log('Dados recebidos para atualização:', { userId, nome, telefone, email });

  // Verificar se todos os campos necessários estão presentes
  if (!nome || !telefone || !email) {
    return res.status(400).json({ message: 'Todos os campos devem ser preenchidos.' });
  }

  // Atualizar diretamente na tabela usuario
  const sqlUsuario = 'UPDATE usuario SET nome = ?, telefone = ?, email = ? WHERE id = ?';
  db.query(sqlUsuario, [nome, telefone, email, userId], (err, results) => {
    if (err) {
      console.error('Erro ao atualizar dados do usuário:', err);
      return res.status(500).json({ message: 'Erro ao atualizar os dados do usuário.' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.json({ message: 'Dados atualizados com sucesso.', userId });
  });
});


// ================================================
// Upload de arquivos e catálogo de animais
// ================================================

// Função para salvar arquivos de upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Apenas imagens!');
    }
  }
});

// Rota para upload de imagens e inserção de dados do animal
app.post('/upload', upload.single('foto'), (req, res) => {
  // Verifica se o ID do usuário existe na sessão
  if (!req.session.userId) {
      console.log('Usuário não autenticado');
      return res.status(401).send('Usuário não autenticado.');
  }

  // Mostra o ID do usuário da sessão
  console.log('ID da sessão do usuário logado:', req.session.userId);

  const { anuncioNome, descricao, raca, dataNascimento, vacinado, coloracao } = req.body;
  const fotoCaminho = req.file.filename;
  const usuarioId = req.session.userId; // Captura o ID do usuário logado da sessão

  // Cálculo da idade
  const birthDate = new Date(dataNascimento);
  const currentDate = new Date();
  let age = currentDate.getFullYear() - birthDate.getFullYear();
  
  // Ajusta a idade caso o mês e dia atual sejam menores que o mês e dia de nascimento
  const monthDiff = currentDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
      age--;
  }

  const sql = `INSERT INTO animais (imagem_data, anuncio_nome, descricao, raca, data_nascimento, coloracao, vacinado, idade, usuario_id) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [fotoCaminho, anuncioNome, descricao, raca, dataNascimento, coloracao, vacinado, age, usuarioId], (err) => {
      if (err) {
          console.error('Erro ao salvar os dados no banco de dados:', err);
          return res.status(500).send('Erro ao salvar os dados no banco de dados.');
      }
      res.redirect('/catalogo.html');
  });
});

// Rota para obter o catálogo de animais
app.get('/api/animais', (req, res) => {
  const sql = 'SELECT * FROM animais';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send('Erro ao buscar os dados dos animais.');

    const animais = results.map(animal => ({
      ...animal,
      imagem_url: animal.imagem_data ? `/uploads/${animal.imagem_data}` : 'images/placeholder.jpg'
    }));

    res.json(animais);
  });
});

// Rota para obter o catálogo de animais
app.get('/api/animais', (req, res) => {
  const sql = 'SELECT * FROM animais';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erro ao buscar os dados dos animais:', err); // Log de erro detalhado
      return res.status(500).send('Erro ao buscar os dados dos animais.');
    }

    if (results.length === 0) {
      return res.status(404).send('Nenhum animal encontrado.');
    }

    const animais = results.map(animal => ({
      ...animal,
      imagem_url: animal.imagem_data ? `/uploads/${animal.imagem_data}` : 'images/placeholder.jpg'
    }));

    res.json(animais);
  });
});

// Rota para obter os detalhes de um animal específico
app.get('/api/animais/:id', (req, res) => {
  const animalId = req.params.id;

  const sql = 'SELECT * FROM animais WHERE id = ?';
  db.query(sql, [animalId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar os detalhes do animal:', err); // Log de erro detalhado
      return res.status(500).send('Erro ao buscar os detalhes do animal.');
    }

    if (results.length === 0) {
      return res.status(404).send('Animal não encontrado.');
    }

    const animal = results[0];
    animal.imagem_url = animal.imagem_data ? `/uploads/${animal.imagem_data}` : 'images/placeholder.jpg';

    res.json(animal);
  });
});

// Rota para obter uma vitrine de até quatro animais
app.get('/api/animais-vitrine', (req, res) => {
  const sql = 'SELECT id, imagem_data, anuncio_nome, idade FROM animais LIMIT 4';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erro ao buscar os dados dos animais para a vitrine:', err); // Log detalhado de erro
      return res.status(500).send('Erro ao buscar os dados dos animais.');
    }

    if (results.length === 0) {
      return res.status(404).send('Nenhum animal encontrado para a vitrine.');
    }

    const animais = results.map(animal => ({
      ...animal,
      imagem_url: animal.imagem_data ? `/uploads/${animal.imagem_data}` : 'images/placeholder.jpg' // Caminho da imagem
    }));

    res.json(animais);
  });
});

// Rota para buscar os animais da sessão específica
app.get('/api/meus_anuncios', (req, res) => {
  if (!req.session.userId) {
      console.log("Usuário não autenticado");
      return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  const userId = req.session.userId;
  console.log("ID do usuário da sessão:", userId); // Verificação

  const sql = 'SELECT id, anuncio_nome, data_registro, imagem_data FROM animais WHERE usuario_id = ?';
  db.query(sql, [userId], (err, results) => {
      if (err) {
          console.error("Erro ao buscar os anúncios do usuário:", err); // Log detalhado de erro
          return res.status(500).send('Erro ao buscar os anúncios do usuário.');
      }

      if (results.length === 0) {
          return res.status(404).json({ message: 'Nenhum anúncio encontrado para este usuário.' });
      }

      console.log("Anúncios encontrados:", results); // Verificação do resultado da consulta

      const anuncios = results.map(anuncio => ({
          id: anuncio.id,
          anuncio_nome: anuncio.anuncio_nome,
          data_registro: anuncio.data_registro,
          imagem_url: anuncio.imagem_data ? `/uploads/${anuncio.imagem_data}` : 'images/placeholder.jpg' // Caminho da imagem
      }));

      res.json(anuncios);
  });
});

// Rota para obter os dados de um anúncio específico do usuário
app.get('/api/meus_anuncios/:id', (req, res) => {
  if (!req.session.userId) {
    console.log("Usuário não autenticado");
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  const userId = req.session.userId;
  const animalId = req.params.id; // ID do animal

  // Consulta para verificar se o anúncio pertence ao usuário
  const sql = 'SELECT * FROM animais WHERE id = ? AND usuario_id = ?';
  db.query(sql, [animalId, userId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar o anúncio:", err);
      return res.status(500).send('Erro ao buscar os dados do anúncio.');
    }

    if (results.length === 0) {
      console.log(`Anúncio com ID ${animalId} não encontrado para o usuário ${userId}`);
      return res.status(404).json({ message: 'Anúncio não encontrado ou não pertence ao usuário.' });
    }

    const anuncio = results[0];
    anuncio.imagem_url = anuncio.imagem_data ? `/uploads/${anuncio.imagem_data}` : 'images/placeholder.jpg';
    res.json(anuncio);
  });
});

// Rota para atualizar os dados de um anúncio
app.put('/api/meus_anuncios/:id', upload.single('imagem'), (req, res) => {
  if (!req.session.userId) {
    console.log("Usuário não autenticado");
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  const userId = req.session.userId;
  const animalId = req.params.id;
  const { anuncio_nome, descricao, raca, data_nascimento, coloracao, vacinado, idade } = req.body;
  const fotoCaminho = req.file ? req.file.filename : null; // A imagem, se fornecida

  // Verifique se o anúncio pertence ao usuário
  const verifySql = 'SELECT * FROM animais WHERE id = ? AND usuario_id = ?';
  db.query(verifySql, [animalId, userId], (verifyErr, verifyResults) => {
    if (verifyErr) {
      console.error("Erro ao verificar o anúncio:", verifyErr);
      return res.status(500).json({ message: 'Erro ao verificar o anúncio.' });
    }

    if (verifyResults.length === 0) {
      return res.status(404).json({ message: 'Anúncio não encontrado ou não pertence ao usuário.' });
    }

    // Prepare os dados para atualização
    const updateData = {
      anuncio_nome,
      descricao,
      raca,
      data_nascimento,
      coloracao,
      vacinado,
      idade
    };

    // Se uma nova imagem foi enviada, atualize o campo da imagem
    if (fotoCaminho) {
      updateData.imagem_data = fotoCaminho;
    }

    // Caso contrário, a imagem permanece a mesma
    const updateSql = `UPDATE animais SET anuncio_nome = ?, descricao = ?, raca = ?, data_nascimento = ?, coloracao = ?, vacinado = ?, idade = ?, imagem_data = ? WHERE id = ? AND usuario_id = ?`;

    db.query(updateSql, [
      updateData.anuncio_nome, 
      updateData.descricao, 
      updateData.raca, 
      updateData.data_nascimento, 
      updateData.coloracao, 
      updateData.vacinado, 
      updateData.idade, 
      updateData.imagem_data || verifyResults[0].imagem_data, // Manter a imagem antiga caso não tenha sido modificada
      animalId, 
      userId
    ], (updateErr) => {
      if (updateErr) {
        console.error("Erro ao atualizar o anúncio:", updateErr);
        return res.status(500).json({ message: 'Erro ao atualizar o anúncio.' });
      }

      res.json({ message: 'Anúncio atualizado com sucesso.' });
    });
  });
});



// Rota para excluir um animal específico, ignorando as restrições de chave estrangeira
app.delete('/api/meus_anuncios/:id', (req, res) => {
  if (!req.session.userId) {
      console.log("Usuário não autenticado");
      return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  const userId = req.session.userId;
  const animalId = req.params.id;

  // Primeiro, verifique se o animal pertence ao usuário
  const verifySql = 'SELECT * FROM animais WHERE id = ? AND usuario_id = ?';
  db.query(verifySql, [animalId, userId], (verifyErr, verifyResults) => {
      if (verifyErr) {
          console.error("Erro ao verificar o anúncio:", verifyErr);
          return res.status(500).json({ message: 'Erro ao verificar o anúncio.' });
      }

      if (verifyResults.length === 0) {
          return res.status(404).json({ message: 'Anúncio não encontrado ou você não tem permissão para excluí-lo.' });
      }

      // Desabilitar verificação de chaves estrangeiras temporariamente
      db.query('SET FOREIGN_KEY_CHECKS = 0', (disableErr) => {
          if (disableErr) {
              console.error("Erro ao desativar verificações de chaves estrangeiras:", disableErr);
              return res.status(500).json({ message: 'Erro ao desativar restrições de chaves estrangeiras.' });
          }

          // Se o animal pertence ao usuário, proceder com a exclusão
          const deleteSql = 'DELETE FROM animais WHERE id = ?';
          db.query(deleteSql, [animalId], (deleteErr) => {
              if (deleteErr) {
                  console.error("Erro ao excluir o anúncio:", deleteErr);
                  return res.status(500).json({ message: 'Erro ao excluir o anúncio.' });
              }

              // Restaurar a verificação de chaves estrangeiras
              db.query('SET FOREIGN_KEY_CHECKS = 1', (restoreErr) => {
                  if (restoreErr) {
                      console.error("Erro ao restaurar verificações de chaves estrangeiras:", restoreErr);
                      return res.status(500).json({ message: 'Erro ao restaurar restrições de chaves estrangeiras.' });
                  }

                  res.json({ message: 'Anúncio excluído com sucesso.' });
              });
          });
      });
  });
});
 

// ================================================
// Chat em tempo real com Sessões
// ================================================

// Rota para verificar se existe um chat já aberto para o animal entre o adotante e anunciante
app.post('/api/verificar_chat', async (req, res) => {
  const { animal_id, adotante_id, anunciante_id } = req.body;
  const sql = `SELECT id FROM chats WHERE animal_id = ? AND adotante_id = ? AND anunciante_id = ? LIMIT 1`;

  db.query(sql, [animal_id, adotante_id, anunciante_id], (err, results) => {
      if (err) {
          console.error('Erro ao verificar chat existente:', err);
          return res.status(500).json({ message: 'Erro ao verificar chat.' });
      }
      if (results.length > 0) {
          res.json({ chatId: results[0].id }); // Chat já existe
      } else {
          res.json({ chatId: null }); // Chat não existe
      }
  });
});

// Rota para verificar o papel do usuário no chat (anunciante ou adotante)
app.get('/api/role_chat/:chatId', (req, res) => {
  const { chatId } = req.params;
  const userId = req.query.userId;

  const sql = `
    SELECT 
      CASE 
        WHEN anunciante_id = ? THEN 'anunciante'
        WHEN adotante_id = ? THEN 'adotante'
        ELSE NULL
      END AS role
    FROM chats
    WHERE id = ?;
  `;

  db.query(sql, [userId, userId, chatId], (err, results) => {
    if (err) {
      console.error("Erro ao verificar o papel do usuário:", err);
      return res.status(500).json({ message: 'Erro ao verificar papel do usuário.' });
    }

    if (results.length > 0) {
      res.json({ role: results[0].role });
    } else {
      res.status(404).json({ message: 'Chat não encontrado.' });
    }
  });
});

// Rota para criar um novo chat
app.post('/api/iniciar_chat', async (req, res) => {
  const { animal_id, adotante_id, anunciante_id } = req.body;

  console.log('Requisição para criar chat:', req.body); // Verifique os valores que estão sendo recebidos

  if (!anunciante_id) {
    return res.status(400).json({ message: 'O campo anunciante_id é obrigatório.' });
  }

  const sql = `INSERT INTO chats (animal_id, adotante_id, anunciante_id) VALUES (?, ?, ?)`;

  db.query(sql, [animal_id, adotante_id, anunciante_id], (err, result) => {
      if (err) {
          console.error('Erro ao criar o chat:', err);
          return res.status(500).json({ message: 'Erro ao criar o chat.' });
      }
      res.json({ chatId: result.insertId });
  });
});


/// Rota para obter todos os chats do usuário ativo
app.get('/api/meus_chats', checkLogin, (req, res) => {
  const userId = req.session.userId;

  // Consulta SQL corrigida
  const sql = `
      SELECT 
          c.id AS chat_id, 
          a.anuncio_nome, 
          CASE 
              WHEN c.adotante_id = ? THEN anunciante.nome 
              ELSE adotante.nome 
          END AS outro_usuario_nome, 
          a.raca, 
          a.imagem_data AS animal_imagem_url
      FROM chats c
      JOIN animais a ON c.animal_id = a.id
      JOIN usuario anunciante ON anunciante.id = c.anunciante_id
      JOIN usuario adotante ON adotante.id = c.adotante_id
      WHERE c.adotante_id = ? OR c.anunciante_id = ?;
  `;

  db.query(sql, [userId, userId, userId], (err, results) => {
      if (err) {
          console.error('Erro ao buscar chats:', err);
          return res.status(500).json({ message: 'Erro ao buscar os chats.' });
      }

      // Atualizando a URL da imagem para apontar para a pasta 'uploads'
      results.forEach(chat => {
          chat.animal_imagem_url = chat.animal_imagem_url ? `/uploads/${chat.animal_imagem_url}` : '/images/placeholder.jpg';
      });

      res.json(results);
  });
});


// Rota para obter as mensagens de um chat específico
app.get('/api/mensagens/:chatId', checkLogin, (req, res) => {
  const chatId = req.params.chatId;

  const sql = `SELECT remetente_id, mensagem, data_envio FROM mensagens WHERE chat_id = ? ORDER BY data_envio ASC`;
  db.query(sql, [chatId], (err, results) => {
      if (err) {
          console.error('Erro ao buscar mensagens do chat:', err);
          return res.status(500).json({ message: 'Erro ao buscar mensagens do chat.' });
      }
      res.json(results);
  });
});

app.post('/api/finalizar_venda', (req, res) => {
  const { chatId } = req.body;

  console.log("Recebido pedido para finalizar venda. Chat ID:", chatId);

  // Verificar se o chatId foi enviado
  if (!chatId) {
    console.error("Erro: chatId não fornecido na requisição.");
    return res.status(400).json({ message: 'Chat ID não fornecido.' });
  }

  // Obter dados do chat para identificar o animal e os usuários envolvidos
  const sqlChat = `
    SELECT 
      a.anuncio_nome AS animal_nome, 
      a.raca AS animal_raca, 
      a.id AS animal_id, 
      c.adotante_id, 
      c.anunciante_id
    FROM 
      animais a
    JOIN 
      chats c ON c.animal_id = a.id
    WHERE 
      c.id = ?`;

  db.query(sqlChat, [chatId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar dados do chat:", err);
      return res.status(500).json({ message: 'Erro ao buscar dados do chat.' });
    }

    if (results.length === 0) {
      console.error("Nenhum chat encontrado com o ID fornecido.");
      return res.status(404).json({ message: "Chat não encontrado." });
    }

    const { animal_nome, animal_raca, animal_id, adotante_id, anunciante_id } = results[0];
    console.log("Dados do chat e do animal encontrados:", { animal_nome, animal_raca, adotante_id, anunciante_id });

    // Verificar se o animal nome e raça foram encontrados corretamente
    if (!animal_nome || !animal_raca) {
      console.error("Erro: dados do animal não encontrados corretamente.");
      return res.status(500).json({ message: 'Erro ao obter dados do animal.' });
    }

    // Inserir dados na tabela de adoção
    const sqlAdocao = `
      INSERT INTO adocao (id_animal, animal_nome, animal_raca, adotante_id, Status, anunciante_id, adotante_nome, adotante_cpf, anunciante_nome, anunciante_cpf)
      SELECT ?, ?, ?, ?, 'Pendente', ?, a.nome, a.cpf, n.nome, n.cpf
      FROM usuario a, usuario n
      WHERE a.id = ? AND n.id = ?`;

    db.query(sqlAdocao, [animal_id, animal_nome, animal_raca, adotante_id, anunciante_id, adotante_id, anunciante_id], (adocaoErr, adocaoResult) => {
      if (adocaoErr) {
        console.error("Erro ao registrar adoção:", adocaoErr);
        return res.status(500).json({ message: 'Erro ao registrar adoção.' });
      }

      console.log("Adoção registrada com sucesso, ID da adoção:", adocaoResult.insertId);

      // Desabilitar verificações de chaves estrangeiras temporariamente
      db.query('SET FOREIGN_KEY_CHECKS = 0', (disableErr) => {
        if (disableErr) {
          console.error("Erro ao desativar verificações de chaves estrangeiras:", disableErr);
          return res.status(500).json({ message: 'Erro ao desativar restrições de chaves estrangeiras.' });
        }

        // Excluir apenas as mensagens associadas ao chat específico
        const deleteMessagesSql = 'DELETE FROM mensagens WHERE chat_id = ?';
        db.query(deleteMessagesSql, [chatId], (deleteMessagesErr) => {
          if (deleteMessagesErr) {
            console.error("Erro ao excluir mensagens do chat:", deleteMessagesErr);
            return res.status(500).json({ message: 'Erro ao excluir mensagens do chat.' });
          }

          // Excluir o chat específico
          const deleteChatSql = 'DELETE FROM chats WHERE id = ?';
          db.query(deleteChatSql, [chatId], (deleteChatErr) => {
            if (deleteChatErr) {
              console.error("Erro ao excluir chat associado:", deleteChatErr);
              return res.status(500).json({ message: 'Erro ao excluir chat associado.' });
            }

            // Reativar verificações de chaves estrangeiras
            db.query('SET FOREIGN_KEY_CHECKS = 1', (enableErr) => {
              if (enableErr) {
                console.error("Erro ao reativar verificações de chaves estrangeiras:", enableErr);
                return res.status(500).json({ message: 'Erro ao reativar restrições de chaves estrangeiras.' });
              }

              res.status(200).json({ message: 'Venda finalizada com sucesso. Chat e mensagens específicos excluídos.' });
            });
          });
        });
      });
    });
  });
});


// ================================================
// Encerramento da sessão
// ================================================

// Processar logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Erro ao fazer logout.');
    }
    res.redirect('/login');
  });
});

// Iniciar o servidor
server.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});


