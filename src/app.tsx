import { useRoute } from './router';
import { Hoje } from './ui/screens/Hoje';
import { Semana } from './ui/screens/Semana';
import { Treinos } from './ui/screens/Treinos';
import { Dieta } from './ui/screens/Dieta';
import { Evolucao } from './ui/screens/Evolucao';
import { Ajustes } from './ui/screens/Ajustes';
import { Treino } from './ui/screens/Treino';

const TABS = [
  { hash: '#/hoje', label: 'Hoje', icon: '☀️' },
  { hash: '#/semana', label: 'Semana', icon: '📅' },
  { hash: '#/treinos', label: 'Treinos', icon: '🏋️' },
  { hash: '#/dieta', label: 'Dieta', icon: '🥗' },
  { hash: '#/evolucao', label: 'Evolução', icon: '📈' },
];

function Screen() {
  const { path, params } = useRoute();
  switch (path) {
    case '/treino/:date': return <Treino date={params.date} />;
    case '/semana': return <Semana />;
    case '/treinos': return <Treinos />;
    case '/dieta': return <Dieta />;
    case '/evolucao': return <Evolucao />;
    case '/ajustes': return <Ajustes />;
    default: return <Hoje />;
  }
}

export function App() {
  const { path } = useRoute();
  const first = path.split('/')[1];
  const active = '#/' + (first === 'treino' ? 'hoje' : first === 'treinos' ? 'treinos' : first || 'hoje');
  return (
    <div class="app">
      <header class="topbar">
        <span class="brand">🏐 Treino & Dieta</span>
        <a class="icon-btn" href="#/ajustes" aria-label="Ajustes">⚙️</a>
      </header>
      <main class="content"><Screen /></main>
      <nav class="tabbar" aria-label="Navegação principal">
        {TABS.map((t) => (
          <a key={t.hash} href={t.hash} class={active === t.hash ? 'tab active' : 'tab'} aria-current={active === t.hash ? 'page' : undefined}>
            <span aria-hidden="true" class="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
