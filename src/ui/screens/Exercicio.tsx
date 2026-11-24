import { EXERCISES, searchVideoUrl } from '../../data/exercises';

export function Exercicio({ id }: { id: string }) {
  const ex = EXERCISES[id];
  if (!ex) return <section class="screen"><h1>Exercício</h1><p>Exercício não encontrado.</p><a href="#/treinos">Voltar</a></section>;
  return (
    <section class="screen">
      <p><a href="#/treinos">◀ Treinos</a></p>
      <h1>{ex.name}</h1>
      <p class="small muted">{ex.muscles.join(' · ')} — {ex.equipment}</p>
      <a class="btn" href={ex.videoUrl ?? searchVideoUrl(ex)} target="_blank" rel="noopener">▶ Vídeo de execução</a>
      {!ex.videoUrl && <p class="small muted">Abre a busca no YouTube com o nome do exercício.</p>}
      {ex.imageUrl && <img src={ex.imageUrl} alt={`Posição do exercício ${ex.name}`} loading="lazy" style="width:100%;margin-top:12px;border-radius:12px;background:#fff" />}
      <div class="card">
        <h2 style="margin-top:0">Como fazer</h2>
        <ul>{ex.how.map((h) => <li key={h}>{h}</li>)}</ul>
        <h2>Erros comuns</h2>
        <ul>{ex.mistakes.map((m) => <li key={m}>{m}</li>)}</ul>
      </div>
    </section>
  );
}
