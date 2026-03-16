import  express  from "express";
import cors from "cors";
import produtosRoutes from "./routes/produtos.routes";
import vendaRoutes from './routes/venda.routes';

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'https://padaria-crud.vercel.app', 'https://padaria-crud-sramos8-1211-sramos8gmailcoms-projects.vercel.app'],
}));
app.use(express.json());

app.use('/api/produtos', produtosRoutes);

app.use('/api/vendas', vendaRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
    console.log(`🍞 Servidor rodando na porta ${PORT} e ${produtosRoutes}`);
});
