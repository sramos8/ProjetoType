import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(__dirname, '../../padaria.db');

const db = new Database(DB_PATH, { verbose: console.log });

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS produtos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('pao', 'bolo', 'salgado', 'doce', 'bebida', 'outro')),
    preco REAL NOT NULL CHECK (preco >= 0),
    estoque INTEGER NOT NULL DEFAULT 0,
    descricao TEXT DEFAULT '',
    disponivel INTEGER NOT NULL DEFAULT 1,
    criadoEm TEXT NOT NULL,
    atualizadoEm TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vendas (
    id            TEXT PRIMARY KEY,
    status        TEXT NOT NULL DEFAULT 'aberta'
                  CHECK(status IN ('aberta','concluida','cancelada')),
    formaPagamento TEXT CHECK(formaPagamento IN
                  ('dinheiro','cartao_credito','cartao_debito','pix')),
    valorTotal    REAL NOT NULL DEFAULT 0,
    valorPago     REAL,
    troco         REAL,
    observacao    TEXT DEFAULT '',
    criadoEm     TEXT NOT NULL,
    concluidoEm  TEXT
  );

  CREATE TABLE IF NOT EXISTS itens_venda (
    id             TEXT PRIMARY KEY,
    vendaId        TEXT NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    produtoId      TEXT NOT NULL REFERENCES produtos(id),
    nomeProduto    TEXT NOT NULL,
    quantidade     INTEGER NOT NULL CHECK(quantidade > 0),
    precoUnitario  REAL NOT NULL,
    subtotal       REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id        TEXT PRIMARY KEY,
    nome      TEXT NOT NULL,
    email     TEXT NOT NULL UNIQUE,
    cpf       TEXT NOT NULL UNIQUE,
    senha     TEXT NOT NULL,
    idade     INTEGER,
    sexo      TEXT CHECK(sexo IN ('M','F','outro')),
    role      TEXT NOT NULL DEFAULT 'operador' CHECK(role IN ('admin','operador')),
    ativo     INTEGER NOT NULL DEFAULT 1,
    criadoEm TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_itens_venda ON itens_venda(vendaId);
  CREATE INDEX IF NOT EXISTS idx_vendas_status ON vendas(status);
  CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(criadoEm);
`);

// Criar admin padrão se não existir
const adminExiste = db.prepare("SELECT id FROM usuarios WHERE email = 'admin@padaria.com'").get();
if (!adminExiste) {
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO usuarios (id, nome, email, senha, role, ativo, criadoEm)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('1', 'Administrador', 'admin@padaria.com', hash, 'admin', 1, new Date().toISOString());
  console.log('👤 Admin criado: admin@padaria.com / admin123');
}

const count  = (db.prepare('SELECT COUNT(*) AS c FROM produtos').get() as { c: number }).c;

if (count === 0) {
    const insert = db.prepare(`
    INSERT INTO produtos (id, nome, categoria, preco, estoque, descricao, disponivel, criadoEm, atualizadoEm)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const seeds = [
    ['1', 'Pão Francês', 'pao', 0.75, 200, 'Crocante por fora, macio por dentro', 1, now, now],
    ['2', 'Coxinha de Frango', 'salgado', 6.50, 50, 'Massa crocante com recheio cremoso', 1, now, now],
    ['3', 'Bolo de Cenoura', 'bolo', 38.00, 5, 'Com cobertura de chocolate', 1, now, now],
    ['4', 'Café com Leite', 'bebida', 8.00, 100, 'Blend especial da casa', 1, now, now],
    ['5', 'Croissant de Manteiga', 'pao', 9.90, 30, 'Importado da França, assado diariamente', 1, now, now],
  ];
  seeds.forEach(s => insert.run(...s));
}

export default db;