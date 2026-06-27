// Redirige al módulo unificado de edificios tab=reportar
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ReportarDano() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/edificios?tab=reportar', { replace: true });
  }, [navigate]);
  return null;
}