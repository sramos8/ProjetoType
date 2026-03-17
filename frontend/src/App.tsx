import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import AppContent from './AppContent';

export default function App() {
  const { logado, carregando } = useAuth();

  if (carregando) return (
    <div style={{
      minHeight: '100vh', background: '#2C1A0E',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: '3rem' }}>🥐</span>
    </div>
  );

  if (!logado) return <Login />;

  return <AppContent />;
}