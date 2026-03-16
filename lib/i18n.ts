/**
 * i18n — FUT Champs Tracker
 *
 * Supported languages:
 *   pt  Brazilian Portuguese (default)
 *   en  English
 *   es  Spanish
 *   fr  French
 *
 * All strings use official FC 26 in-game terminology per language.
 * xG stays "xG" in every language (it's a universal stat abbreviation).
 */

export type Language = 'pt' | 'en' | 'es' | 'fr';

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'pt', label: 'PT', flag: '🇧🇷' },
  { code: 'en', label: 'EN', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
];

const translations = {
  // ── Navigation ────────────────────────────────────────────────────────
  nav_dashboard:  { pt: 'Dashboard',  en: 'Dashboard',  es: 'Panel',      fr: 'Tableau' },
  nav_register:   { pt: 'Registrar',  en: 'Log Match',  es: 'Registrar',  fr: 'Saisir'  },
  nav_history:    { pt: 'Histórico',  en: 'History',    es: 'Historial',  fr: 'Historique' },
  nav_opponents:  { pt: 'Oponentes',  en: 'Opponents',  es: 'Rivales',    fr: 'Adversaires' },
  nav_analytics:  { pt: 'Análises',   en: 'Analytics',  es: 'Análisis',   fr: 'Stats'   },
  nav_squad:      { pt: 'Elenco',     en: 'Squad',      es: 'Plantilla',  fr: 'Équipe'  },
  nav_packs:      { pt: 'Packs',      en: 'Packs',      es: 'Sobres',     fr: 'Packs'   },
  nav_players:    { pt: 'Players',    en: 'Players',    es: 'Jugadores',  fr: 'Joueurs' },

  // ── General / Shared ──────────────────────────────────────────────────
  match:          { pt: 'Partida',    en: 'Match',      es: 'Partido',    fr: 'Match'   },
  matches:        { pt: 'Partidas',   en: 'Matches',    es: 'Partidos',   fr: 'Matchs'  },
  week:           { pt: 'Semana',     en: 'Week',       es: 'Semana',     fr: 'Semaine' },
  week_id:        { pt: 'Week ID',    en: 'WL Week',    es: 'Semana WL',  fr: 'Sem. WL' },
  save_btn:       { pt: 'Salvar',     en: 'Save',       es: 'Guardar',    fr: 'Enregistrer' },
  cancel:         { pt: 'Cancelar',   en: 'Cancel',     es: 'Cancelar',   fr: 'Annuler' },
  loading:        { pt: 'A carregar…',en: 'Loading…',   es: 'Cargando…',  fr: 'Chargement…' },
  no_data:        { pt: 'Sem dados',  en: 'No data',    es: 'Sin datos',  fr: 'Aucune donnée' },
  search:         { pt: 'Buscar…',    en: 'Search…',    es: 'Buscar…',    fr: 'Rechercher…' },
  notes:          { pt: 'Observações',en: 'Notes',      es: 'Notas',      fr: 'Notes'   },
  export_csv:     { pt: 'CSV',        en: 'CSV',        es: 'CSV',        fr: 'CSV'     },

  // ── Results ───────────────────────────────────────────────────────────
  win:            { pt: 'Vitória',    en: 'Win',        es: 'Victoria',   fr: 'Victoire' },
  wins:           { pt: 'Vitórias',   en: 'Wins',       es: 'Victorias',  fr: 'Victoires' },
  loss:           { pt: 'Derrota',    en: 'Loss',       es: 'Derrota',    fr: 'Défaite'  },
  losses:         { pt: 'Derrotas',   en: 'Losses',     es: 'Derrotas',   fr: 'Défaites' },
  draw:           { pt: 'Empate',     en: 'Draw',       es: 'Empate',     fr: 'Nul'      },
  draws:          { pt: 'Empates',    en: 'Draws',      es: 'Empates',    fr: 'Nuls'     },
  win_rate:       { pt: 'Win Rate',   en: 'Win Rate',   es: 'Win Rate',   fr: 'Win Rate' },

  // ── Score / Stats ─────────────────────────────────────────────────────
  score:          { pt: 'Placar',     en: 'Score',      es: 'Marcador',   fr: 'Score'   },
  my_goals:       { pt: 'Meus Gols',  en: 'My Goals',   es: 'Mis Goles',  fr: 'Mes Buts' },
  opp_goals:      { pt: 'Gols Oponente', en: 'Opp Goals', es: 'Goles Rival', fr: 'Buts Adverse' },
  goals_scored:   { pt: 'Gols Marcados', en: 'Goals Scored', es: 'Goles A Favor', fr: 'Buts Pour' },
  goals_conceded: { pt: 'Gols Sofridos', en: 'Goals Conceded', es: 'Goles En Contra', fr: 'Buts Contre' },
  goal_diff:      { pt: 'Saldo',      en: 'Goal Diff',  es: 'Diferencia', fr: 'Diff. Buts' },
  penalties:      { pt: 'Penaltis',   en: 'Penalties',  es: 'Penaltis',   fr: 'Penaltys' },
  my_pens:        { pt: 'Penaltis (Meus)', en: 'My Pens', es: 'Penaltis (Míos)', fr: 'Mes Penaltys' },
  opp_pens:       { pt: 'Penaltis (Opp)', en: 'Opp Pens', es: 'Penaltis (Rival)', fr: 'Penaltys Adv.' },
  possession:     { pt: 'Posse de Bola', en: 'Possession', es: 'Posesión', fr: 'Possession' },
  shots:          { pt: 'Finalizações', en: 'Shots',    es: 'Tiros',      fr: 'Tirs'    },
  formation:      { pt: 'Formação',   en: 'Formation',  es: 'Formación',  fr: 'Formation' },
  my_formation:   { pt: 'Formação (Minha)', en: 'My Formation', es: 'Formación (Mía)', fr: 'Ma Formation' },
  opp_formation:  { pt: 'Formação (Opp)', en: 'Opp Formation', es: 'Formación (Rival)', fr: 'Formation Adv.' },

  // ── Match context ─────────────────────────────────────────────────────
  home:           { pt: 'Casa',       en: 'Home',       es: 'Local',      fr: 'Domicile' },
  away:           { pt: 'Fora',       en: 'Away',       es: 'Visitante',  fr: 'Extérieur' },
  platform:       { pt: 'Plataforma', en: 'Platform',   es: 'Plataforma', fr: 'Plateforme' },
  opponent_tag:   { pt: 'Gamertag Oponente', en: 'Opponent Gamertag', es: 'Gamertag Rival', fr: 'Gamertag Adv.' },
  match_num:      { pt: 'Jogo #',     en: 'Match #',    es: 'Partido #',  fr: 'Match n°' },

  // ── How it ended ──────────────────────────────────────────────────────
  how_ended:      { pt: 'Como terminou?', en: 'How did it end?', es: '¿Cómo terminó?', fr: 'Comment ça s\'est terminé ?' },
  end_normal:     { pt: 'Normal',         en: 'Full Time',       es: 'Tiempo Reglamentario', fr: 'Temps Réglementaire' },
  end_extra_time: { pt: 'Prorrogação',    en: 'Extra Time',      es: 'Prórroga',             fr: 'Prolongation' },
  end_penalties:  { pt: 'Penaltis',       en: 'Penalties',       es: 'Penaltis',             fr: 'Tirs au But' },
  end_abandoned:  { pt: 'Abandonada',     en: 'Abandoned',       es: 'Abandonado',           fr: 'Abandonnée' },

  // ── Ping ─────────────────────────────────────────────────────────────
  connection:     { pt: 'Ping / Conexão', en: 'Connection',    es: 'Conexión',   fr: 'Connexion' },
  ping_good:      { pt: 'Bom',           en: 'Good',          es: 'Buena',      fr: 'Bonne'     },
  ping_avg:       { pt: 'Médio',         en: 'Average',       es: 'Regular',    fr: 'Moyenne'   },
  ping_lag:       { pt: 'Lag',           en: 'Lag',           es: 'Lag',        fr: 'Lag'       },

  // ── Rage quit ─────────────────────────────────────────────────────────
  rage_quit:      { pt: 'Rage Quit?',  en: 'Rage Quit?',   es: '¿Rage Quit?', fr: 'Rage Quit ?' },
  rq_no:          { pt: '✅ Não',       en: '✅ No',         es: '✅ No',        fr: '✅ Non'      },
  rq_opp:         { pt: '😤 Oponente', en: '😤 Opponent',  es: '😤 Rival',    fr: '😤 Adverse'  },
  rq_me:          { pt: '😅 Eu',       en: '😅 Me',        es: '😅 Yo',       fr: '😅 Moi'      },

  // ── Difficulty ───────────────────────────────────────────────────────
  difficulty:     { pt: 'Dificuldade',  en: 'Difficulty',    es: 'Dificultad',  fr: 'Difficulté' },
  auto_diff:      { pt: 'Dificuldade Auto-Calculada', en: 'Auto-Difficulty', es: 'Dificultad Automática', fr: 'Difficulté Auto' },
  diff_easy:      { pt: 'Fácil',        en: 'Easy',          es: 'Fácil',       fr: 'Facile'     },
  diff_medium:    { pt: 'Médio',        en: 'Medium',        es: 'Medio',       fr: 'Moyen'      },
  diff_hard:      { pt: 'Difícil',      en: 'Hard',          es: 'Difícil',     fr: 'Difficile'  },
  diff_sweaty:    { pt: 'Pesado',       en: 'Sweaty',        es: 'Complicado',  fr: 'Intense'    },
  diff_impossible:{ pt: 'Impossível',   en: 'Impossible',    es: 'Imposible',   fr: 'Impossible' },

  // ── ELO ──────────────────────────────────────────────────────────────
  elo_impact:     { pt: 'Impacto no ELO', en: 'ELO Impact', es: 'Impacto ELO', fr: 'Impact ELO' },
  elo_tier_1:     { pt: 'Iniciante',    en: 'Beginner',      es: 'Principiante',fr: 'Débutant'   },
  elo_tier_2:     { pt: 'Bronze',       en: 'Bronze',        es: 'Bronce',      fr: 'Bronze'     },
  elo_tier_3:     { pt: 'Prata',        en: 'Silver',        es: 'Plata',       fr: 'Argent'     },
  elo_tier_4:     { pt: 'Ouro',         en: 'Gold',          es: 'Oro',         fr: 'Or'         },
  elo_tier_5:     { pt: 'Elite',        en: 'Elite',         es: 'Elite',       fr: 'Élite'      },
  elo_tier_6:     { pt: 'Lendário',     en: 'Legendary',     es: 'Legendario',  fr: 'Légendaire' },

  // ── Advanced metrics ─────────────────────────────────────────────────
  advanced_metrics: { pt: 'Métricas Avançadas (xG, Posse, Formações)', en: 'Advanced Stats (xG, Possession, Formations)', es: 'Estadísticas Avanzadas (xG, Posesión, Formaciones)', fr: 'Stats Avancées (xG, Possession, Formations)' },
  xg_mine:        { pt: 'xG (Meu)',     en: 'xG (Mine)',     es: 'xG (Mío)',    fr: 'xG (Moi)'   },
  xg_opp:         { pt: 'xG (Opp)',     en: 'xG (Opp)',      es: 'xG (Rival)',  fr: 'xG (Adv.)'  },
  my_possession:  { pt: 'Posse de Bola (%)', en: 'Possession (%)', es: 'Posesión (%)', fr: 'Possession (%)' },
  my_shots:       { pt: 'Finalizações (Minhas)', en: 'Shots (Mine)', es: 'Tiros (Míos)', fr: 'Tirs (Moi)' },
  diff_tooltip:   { pt: 'Calculado automaticamente. Preencha xG e posse para máxima precisão.', en: 'Auto-calculated. Fill xG and possession for best accuracy.', es: 'Calculado automáticamente. Rellena xG y posesión para mayor precisión.', fr: 'Calculé automatiquement. Renseigne xG et possession pour plus de précision.' },

  // ── Player stats ──────────────────────────────────────────────────────
  player_stats:   { pt: 'Estatísticas dos Jogadores', en: 'Player Stats',   es: 'Estadísticas de Jugadores', fr: 'Stats des Joueurs' },
  goals:          { pt: 'Gols',         en: 'Goals',         es: 'Goles',       fr: 'Buts'       },
  assists:        { pt: 'Assistências', en: 'Assists',        es: 'Asistencias', fr: 'Passes Déc.' },
  saves:          { pt: 'Defesas',      en: 'Saves',         es: 'Paradas',     fr: 'Arrêts'     },
  motm:           { pt: 'MOTM',         en: 'MOTM',          es: 'MVP',         fr: 'MHM'        },
  clean_sheet:    { pt: 'CS',           en: 'CS',            es: 'Portería 0',  fr: 'Clean Sheet'},

  // ── Dashboard ─────────────────────────────────────────────────────────
  last_5:         { pt: 'Últimas 5 Partidas', en: 'Last 5 Matches', es: 'Últimos 5 Partidos', fr: '5 Derniers Matchs' },
  rank_calc:      { pt: 'Calculadora de Rank', en: 'Rank Calculator', es: 'Calculadora de Rango', fr: 'Calculateur de Rang' },
  win_streak:     { pt: 'Win Streak',    en: 'Win Streak',   es: 'Racha de Victorias', fr: 'Série de Victoires' },
  no_streak:      { pt: 'Sem Streak',    en: 'No Streak',    es: 'Sin racha',   fr: 'Pas de série' },
  wl_archive:     { pt: 'Arquivo WL',    en: 'WL Archive',   es: 'Archivo WL',  fr: 'Archives WL' },
  squad_highlights:{ pt: 'Destaques do Elenco', en: 'Squad Highlights', es: 'Destacados de Plantilla', fr: 'Meilleurs Joueurs' },
  recent_matches: { pt: 'Partidas Recentes', en: 'Recent Matches', es: 'Partidos Recientes', fr: 'Matchs Récents' },
  share_week:     { pt: 'Compartilhar Resumo da Semana', en: 'Share Weekly Summary', es: 'Compartir Resumen Semanal', fr: 'Partager le Résumé' },
  avg_diff:       { pt: 'Dificuldade Média', en: 'Avg Difficulty', es: 'Dificultad Media', fr: 'Difficulté Moy.' },
  current_label:  { pt: 'Atual',         en: 'Current',      es: 'Actual',      fr: 'Actuel'     },
  register_first: { pt: 'Registrar Primeira Partida', en: 'Log First Match', es: 'Registrar Primer Partido', fr: 'Saisir le 1er Match' },

  // ── History ───────────────────────────────────────────────────────────
  history_title:  { pt: 'Histórico de Partidas', en: 'Match History', es: 'Historial de Partidos', fr: 'Historique des Matchs' },
  filter:         { pt: 'Filtrar:',      en: 'Filter:',      es: 'Filtrar:',    fr: 'Filtrer :'  },
  all:            { pt: 'Todos',         en: 'All',          es: 'Todos',       fr: 'Tous'       },
  all_weeks:      { pt: 'Todas as semanas', en: 'All weeks', es: 'Todas las semanas', fr: 'Toutes les semaines' },
  delete_confirm: { pt: 'Deletar esta partida e todas as suas stats? Essa ação não pode ser desfeita.', en: 'Delete this match and all its stats? This cannot be undone.', es: '¿Eliminar este partido y todas sus estadísticas? No se puede deshacer.', fr: 'Supprimer ce match et toutes ses stats ? Cette action est irréversible.' },

  // ── Opponents ─────────────────────────────────────────────────────────
  opponents_title:{ pt: 'Oponentes',     en: 'Opponents',    es: 'Rivales',     fr: 'Adversaires' },
  opponents_sub:  { pt: 'Seu histórico contra cada gamertag', en: 'Your record vs each gamertag', es: 'Tu historial contra cada gamertag', fr: 'Votre bilan contre chaque gamertag' },
  match_history_vs: { pt: 'Histórico de partidas', en: 'Match history', es: 'Historial de partidos', fr: 'Historique des matchs' },
  most_played:    { pt: 'Mais jogados',  en: 'Most played',  es: 'Más jugados', fr: 'Plus joués'  },
  most_wins:      { pt: 'Mais vitórias', en: 'Most wins',    es: 'Más victorias',fr: 'Plus de victoires' },
  most_losses:    { pt: 'Mais derrotas', en: 'Most losses',  es: 'Más derrotas', fr: 'Plus de défaites'  },
  avg_scored:     { pt: 'Média gols marcados', en: 'Avg goals scored', es: 'Media goles a favor', fr: 'Moy. buts pour' },
  avg_conceded:   { pt: 'Média gols sofridos', en: 'Avg goals conceded', es: 'Media goles en contra', fr: 'Moy. buts contre' },

  // ── Analytics ─────────────────────────────────────────────────────────
  analytics_title: { pt: 'Análises',     en: 'Analytics',    es: 'Análisis',    fr: 'Statistiques' },
  insights:       { pt: 'Insights baseados em', en: 'Insights from', es: 'Análisis de', fr: 'Analyses de' },
  clutch_title:   { pt: 'Clutch (Partidas Disputadas)', en: 'Clutch (Close Matches)', es: 'Clutch (Partidos Ajustados)', fr: 'Clutch (Matchs Serrés)' },
  close_matches:  { pt: 'partidas com margem ≤ 1 gol ou nos penaltis', en: 'matches decided by ≤1 goal or penalties', es: 'partidos con margen ≤1 gol o penaltis', fr: 'matchs décidés par ≤1 but ou penaltys' },
  clutch_wr:      { pt: 'Clutch WR',     en: 'Clutch WR',    es: 'WR Clutch',   fr: 'WR Clutch'   },
  elo_progress:   { pt: 'Evolução do ELO', en: 'ELO Progression', es: 'Evolución ELO', fr: 'Progression ELO' },
  wr_by_day:      { pt: 'Win Rate por Dia da Semana', en: 'Win Rate by Day of Week', es: 'Win Rate por Día de la Semana', fr: 'Win Rate par Jour de la Semaine' },
  best_day:       { pt: 'Melhor:',       en: 'Best:',        es: 'Mejor:',      fr: 'Meilleur :'  },
  worst_day:      { pt: 'Pior:',         en: 'Worst:',       es: 'Peor:',       fr: 'Pire :'      },
  kryptonite:     { pt: 'Formação Kryptonite', en: 'Kryptonite Formation', es: 'Formación Kriptonita', fr: 'Formation Kryptonite' },
  wr_by_diff:     { pt: 'Win Rate por Dificuldade', en: 'Win Rate by Difficulty', es: 'Win Rate por Dificultad', fr: 'Win Rate par Difficulté' },
  xg_vs_goals:    { pt: 'xG vs Gols Reais', en: 'xG vs Real Goals', es: 'xG vs Goles Reales', fr: 'xG vs Buts Réels' },
  goals_trend:    { pt: 'Tendência (Média Móvel 5 jogos)', en: 'Trend (5-match Rolling Avg)', es: 'Tendencia (Media Móvil 5 partidos)', fr: 'Tendance (Moy. Mobile 5 matchs)' },
  avg_scored_chart: { pt: 'Média Marcados', en: 'Avg Scored', es: 'Media Anotados', fr: 'Moy. Pour' },
  avg_conceded_chart: { pt: 'Média Sofridos', en: 'Avg Conceded', es: 'Media Encajados', fr: 'Moy. Contre' },
  days: {
    pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  },

  // ── Packs ─────────────────────────────────────────────────────────────
  packs_title:    { pt: 'Packs & Recompensas', en: 'Packs & Rewards', es: 'Sobres y Recompensas', fr: 'Packs & Récompenses' },
  packs_sub:      { pt: 'Histórico de packs abertos', en: 'Pack opening history', es: 'Historial de sobres abiertos', fr: 'Historique d\'ouverture de packs' },
  new_pack:       { pt: 'Novo Pack',     en: 'New Pack',     es: 'Nuevo Sobre',  fr: 'Nouveau Pack' },
  pack_type:      { pt: 'Tipo de Pack',  en: 'Pack Type',    es: 'Tipo de Sobre',fr: 'Type de Pack' },
  coins_value:    { pt: 'Valor em Moedas', en: 'Coin Value', es: 'Valor en Monedas', fr: 'Valeur en Pièces' },
  notable_pulls:  { pt: 'Pulls Notáveis (opcional)', en: 'Notable Pulls (optional)', es: 'Jugadores Notables (opcional)', fr: 'Tirages Notables (optionnel)' },
  packs_opened:   { pt: 'Packs Abertos', en: 'Packs Opened', es: 'Sobres Abiertos', fr: 'Packs Ouverts' },
  total_coins:    { pt: 'Total em Moedas', en: 'Total Coins', es: 'Total en Monedas', fr: 'Total en Pièces' },
  no_week:        { pt: 'Sem semana',    en: 'No week',      es: 'Sin semana',   fr: 'Sans semaine' },
  save_pack:      { pt: '💰 Salvar Pack', en: '💰 Save Pack', es: '💰 Guardar Sobre', fr: '💰 Enregistrer Pack' },
  register_pack:  { pt: 'Registrar Pack',en: 'Log Pack',     es: 'Registrar Sobre', fr: 'Saisir un Pack' },
  date_time:      { pt: 'Data/Hora',     en: 'Date/Time',    es: 'Fecha/Hora',  fr: 'Date/Heure'  },
  delete_pack:    { pt: 'Deletar este pack?', en: 'Delete this pack?', es: '¿Eliminar este sobre?', fr: 'Supprimer ce pack ?' },

  // ── Register match page ───────────────────────────────────────────────
  register_title: { pt: 'Registrar Partida', en: 'Log Match', es: 'Registrar Partido', fr: 'Saisir un Match' },
  week_id_hint:   { pt: 'ex: mar15',     en: 'e.g. mar15',   es: 'ej: mar15',    fr: 'ex : mar15'  },
  saving:         { pt: 'Salvando…',     en: 'Saving…',      es: 'Guardando…',   fr: 'Enregistrement…' },
  register_match: { pt: '⚽ Registrar Partida', en: '⚽ Log Match', es: '⚽ Registrar Partido', fr: '⚽ Saisir le Match' },
  add_to_squad:   { pt: 'elenco', en: 'squad', es: 'plantilla', fr: 'équipe' },
  remove:         { pt: 'remover',       en: 'remove',       es: 'quitar',       fr: 'retirer'    },
  add:            { pt: 'adicionar',     en: 'add',          es: 'añadir',       fr: 'ajouter'    },
  session_expired:{ pt: 'Sessão expirada. Faça login novamente.', en: 'Session expired. Please log in again.', es: 'Sesión expirada. Inicia sesión de nuevo.', fr: 'Session expirée. Reconnectez-vous.' },
  fill_week_id:   { pt: 'Preencha o Week ID (ex: mar15).', en: 'Fill in the WL Week (e.g. mar15).', es: 'Completa el campo Semana WL (ej: mar15).', fr: 'Renseigne la Semaine WL (ex : mar15).' },
  squad_empty_hint: { pt: 'Adicione jogadores ao seu', en: 'Add players to your', es: 'Añade jugadores a tu', fr: 'Ajoute des joueurs à ton' },
  squad_empty_hint2: { pt: 'para registrar as stats.', en: 'to log player stats.', es: 'para registrar las estadísticas.', fr: 'pour saisir les stats.' },

  // ── My Overall ────────────────────────────────────────────────────────
  my_overall:       { pt: 'Meu Overall',  en: 'My Overall',  es: 'Mi Overall',   fr: 'Mon Overall'  },
  overall_set:      { pt: 'Definir',      en: 'Set',         es: 'Definir',      fr: 'Définir'      },
  overall_edit:     { pt: 'Editar overall', en: 'Edit overall', es: 'Editar overall', fr: "Modifier l'overall" },

  // ── Weekend League ────────────────────────────────────────────────────
  wl_title:         { pt: 'Weekend League',             en: 'Weekend League',          es: 'Weekend League',          fr: 'Weekend League'             },
  nav_wl:           { pt: 'WL',                         en: 'WL',                      es: 'WL',                      fr: 'WL'                         },
  wl_start:         { pt: 'Iniciar Weekend League',     en: 'Start Weekend League',    es: 'Iniciar Weekend League',  fr: 'Lancer la Weekend League'   },
  wl_end:           { pt: 'Encerrar WL',                en: 'End WL',                  es: 'Cerrar WL',               fr: 'Terminer WL'                },
  wl_active:        { pt: 'Ativa',                      en: 'Active',                  es: 'Activa',                  fr: 'Active'                     },
  wl_no_active:     { pt: 'Nenhuma WL em andamento',   en: 'No active WL',            es: 'Ninguna WL activa',       fr: 'Aucune WL en cours'         },
  wl_end_confirm:   { pt: 'Encerrar a WL atual?',       en: 'End the current WL?',     es: '¿Cerrar la WL actual?',   fr: 'Terminer la WL en cours ?'  },
  wl_history:       { pt: 'Histórico de WLs',           en: 'WL History',              es: 'Historial WL',            fr: 'Historique WL'              },
  wl_active_wl:     { pt: 'WL Ativa',                   en: 'Active WL',               es: 'WL Activa',               fr: 'WL Active'                  },
  wl_no_wl_warning: { pt: 'Inicie uma WL para registrar partidas automaticamente.', en: 'Start a WL to track matches automatically.', es: 'Inicia una WL para registrar partidos automáticamente.', fr: 'Lance une WL pour enregistrer les matchs automatiquement.' },
} as const;

type TranslationKey = keyof typeof translations;
type DaysKey = 'days';

/** Look up a translation string */
export function t(key: TranslationKey, lang: Language): string {
  const entry = translations[key];
  if (!entry) return key;
  return (entry as Record<Language, string>)[lang] ?? (entry as Record<Language, string>).pt;
}

/** Look up the days-of-week array */
export function tDays(lang: Language): readonly string[] {
  return translations.days[lang] ?? translations.days.pt;
}

export const STORAGE_KEY = 'futchamps_lang';
export const OVERALL_KEY  = 'futchamps_overall';
export const ACTIVE_WL_KEY = 'futchamps_active_wl';
