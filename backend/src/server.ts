import express from "express";
import cors from "cors";
import produtosRoutes from "./routes/produtos.routes";
import vendaRoutes from './routes/venda.routes';
import authRoutes from './routes/auth.routes';
import { autenticar } from './middleware/auth.middleware';
import loteRoutes from './routes/lote.routes';

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://padaria-crud.vercel.app',
    'https://padaria-crud-sramos8-1211-sramos8gmailcoms-projects.vercel.app',
  ],
}));

app.use(express.json());

// Rota pública
app.use('/api/auth', authRoutes);


// Rotas protegidas — exige token
app.use('/api/produtos', autenticar, produtosRoutes);
app.use('/api/vendas', autenticar, vendaRoutes);
app.use('/api/lotes', autenticar, loteRoutes);

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.listen(PORT, () => {
  console.log(`🍞 Servidor rodando na porta ${PORT}`);
});