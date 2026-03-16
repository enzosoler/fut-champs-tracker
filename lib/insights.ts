import type { Match } from '@/types';
import { getMatchResult } from '@/types';

export type InsightSeverity = 'critical' | 'warning' | 'positive' | 'info';
export type InsightType =
  | 'formation'
  | 'first_goal'
  | 'clutch'
  | 'fatigue'
  | 'scoring'
  | 'defending'
  | 'consistency'
  | 'comeback'
  | 'xg'
  | 'general';

export interface Insight {
  id: string;
  title: string;
  description: string;
  recommendation: string;
  severity: InsightSeverity;
  type: InsightType;
  metric?: string;
  metricValue?: string;
  relatedFormation?: string;
  confidence: number; // 0-1, how reliable this insight is
}

// ─── Formation Performance ────────────────────────────────────────────────────
export function formationStats(matches: Match[]) {
  const map: Record<string, { wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number }> = {};
  for (const m of matches) {
    const f = m.formation_me || 'Unknown';
    if (!map[f]) map[f] = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
    const r = getMatchResult(m);
    if (r === 'W') map[f].wins++;
    else if (r === 'D') map[f].draws++;
    else map[f].losses++;
    map[f].goalsFor += m.goals_me;
    map[f].goalsAgainst += m.goals_opp;
  }
  return Object.entries(map)
    .map(([formation, s]) => {
      const total = s.wins + s.draws + s.losses;
      return {
        formation,
        total,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
        winRate: total > 0 ? (s.wins / total) * 100 : 0,
        avgGoalsFor: total > 0 ? s.goalsFor / total : 0,
        avgGoalsAgainst: total > 0 ? s.goalsAgainst / total : 0,
        goalDiff: s.goalsFor - s.goalsAgainst,
      };
    })
    .filter(f => f.total >= 3)
    .sort((a, b) => b.winRate - a.winRate);
}

// ─── First Goal Impact ────────────────────────────────────────────────────────
export function firstGoalImpact(matches: Match[]) {
  let scoredFirst = 0, scoredFirstWins = 0;
  let concededFirst = 0, concededFirstWins = 0;
  let openingGoalUnknown = 0;

  for (const m of matches) {
    const r = getMatchResult(m);
    const goalsMe = m.goals_me, goalsOpp = m.goals_opp;
    if (goalsMe === 0 && goalsOpp === 0) { openingGoalUnknown++; continue; }
    // Heuristic: if goals_me > goals_opp significantly assume we scored first, etc.
    // Use xG ratio as proxy if available
    let userScoredFirst: boolean | null = null;
    if (m.xg_me !== null && m.xg_opp !== null) {
      userScoredFirst = m.xg_me > m.xg_opp;
    } else if (goalsMe > 0 && goalsOpp === 0) {
      userScoredFirst = true;
    } else if (goalsOpp > 0 && goalsMe === 0) {
      userScoredFirst = false;
    } else {
      openingGoalUnknown++;
      continue;
    }

    if (userScoredFirst) {
      scoredFirst++;
      if (r === 'W') scoredFirstWins++;
    } else {
      concededFirst++;
      if (r === 'W') concededFirstWins++;
    }
  }

  return {
    scoredFirst,
    scoredFirstWinRate: scoredFirst > 0 ? (scoredFirstWins / scoredFirst) * 100 : 0,
    concededFirst,
    concededFirstWinRate: concededFirst > 0 ? (concededFirstWins / concededFirst) * 100 : 0,
    unknown: openingGoalUnknown,
  };
}

// ─── Clutch Performance ───────────────────────────────────────────────────────
export function clutchStats(matches: Match[]) {
  const closeMatches = matches.filter(m => Math.abs(m.goals_me - m.goals_opp) <= 1);
  const etOrPk = matches.filter(m => m.match_end_type === 'extra_time' || m.match_end_type === 'penalties');
  const comebacks = matches.filter(m => m.goals_me > m.goals_opp && m.xg_opp !== null && m.xg_me !== null && m.xg_opp > m.xg_me);

  const closeWins = closeMatches.filter(m => getMatchResult(m) === 'W').length;
  const etWins = etOrPk.filter(m => getMatchResult(m) === 'W').length;

  return {
    closeTotal: closeMatches.length,
    closeWinRate: closeMatches.length > 0 ? (closeWins / closeMatches.length) * 100 : 0,
    etOrPkTotal: etOrPk.length,
    etWinRate: etOrPk.length > 0 ? (etWins / etOrPk.length) * 100 : 0,
    comebackCount: comebacks.length,
    comebackRate: matches.length > 0 ? (comebacks.length / matches.length) * 100 : 0,
  };
}

// ─── Fatigue (performance by match number in a WL) ───────────────────────────
export function fatigueStats(matches: Match[]) {
  const early = matches.filter(m => m.match_num !== null && m.match_num <= 5);
  const mid   = matches.filter(m => m.match_num !== null && m.match_num >= 6 && m.match_num <= 10);
  const late  = matches.filter(m => m.match_num !== null && m.match_num >= 11);

  const wr = (arr: Match[]) => {
    if (arr.length === 0) return 0;
    return (arr.filter(m => getMatchResult(m) === 'W').length / arr.length) * 100;
  };
  const avgGoals = (arr: Match[]) => arr.length === 0 ? 0 : arr.reduce((s, m) => s + m.goals_me, 0) / arr.length;

  return {
    early:   { count: early.length,  winRate: wr(early),  avgGoals: avgGoals(early)  },
    mid:     { count: mid.length,    winRate: wr(mid),    avgGoals: avgGoals(mid)    },
    late:    { count: late.length,   winRate: wr(late),   avgGoals: avgGoals(late)   },
    dropOff: wr(early) - wr(late), // positive = performance drops late
  };
}

// ─── xG Performance ──────────────────────────────────────────────────────────
export function xgStats(matches: Match[]) {
  const withXg = matches.filter(m => m.xg_me !== null && m.xg_opp !== null);
  if (withXg.length === 0) return null;
  const avgXgMe  = withXg.reduce((s, m) => s + (m.xg_me ?? 0), 0) / withXg.length;
  const avgXgOpp = withXg.reduce((s, m) => s + (m.xg_opp ?? 0), 0) / withXg.length;
  const overperforming = withXg.filter(m => m.goals_me > (m.xg_me ?? 0)).length;
  const underperforming = withXg.filter(m => m.goals_me < (m.xg_me ?? 0)).length;
  return {
    count: withXg.length,
    avgXgMe: parseFloat(avgXgMe.toFixed(2)),
    avgXgOpp: parseFloat(avgXgOpp.toFixed(2)),
    overperformingRate: (overperforming / withXg.length) * 100,
    underperformingRate: (underperforming / withXg.length) * 100,
    xgDiff: parseFloat((avgXgMe - avgXgOpp).toFixed(2)),
  };
}

// ─── Consistency ─────────────────────────────────────────────────────────────
export function consistencyStats(matches: Match[]) {
  const results = matches.map(m => getMatchResult(m));
  let maxWinStreak = 0, maxLossStreak = 0;
  let curW = 0, curL = 0;
  for (const r of results) {
    if (r === 'W') { curW++; curL = 0; maxWinStreak = Math.max(maxWinStreak, curW); }
    else if (r === 'L') { curL++; curW = 0; maxLossStreak = Math.max(maxLossStreak, curL); }
    else { curW = 0; curL = 0; }
  }
  // Win rate over last 10
  const last10 = matches.slice(-10);
  const last10WR = last10.length > 0 ? (last10.filter(m => getMatchResult(m) === 'W').length / last10.length) * 100 : 0;
  const overallWR = matches.length > 0 ? (matches.filter(m => getMatchResult(m) === 'W').length / matches.length) * 100 : 0;
  return { maxWinStreak, maxLossStreak, last10WR, overallWR, trend: last10WR - overallWR };
}

// ─── Main Insight Generator ───────────────────────────────────────────────────
export function generateInsights(matches: Match[]): Insight[] {
  if (matches.length < 5) return [];
  const insights: Insight[] = [];
  const overallWR = (matches.filter(m => getMatchResult(m) === 'W').length / matches.length) * 100;

  // 1. Formation insights
  const fStats = formationStats(matches);
  if (fStats.length >= 2) {
    const best  = fStats[0];
    const worst = fStats[fStats.length - 1];
    if (best.winRate - worst.winRate > 20) {
      insights.push({
        id: 'formation_best',
        title: `${best.formation} is your best formation`,
        description: `Your win rate with ${best.formation} is ${best.winRate.toFixed(0)}% across ${best.total} matches, compared to ${worst.winRate.toFixed(0)}% with ${worst.formation}.`,
        recommendation: `Stick to ${best.formation} when you need results. Save experimentation for warm-up matches.`,
        severity: 'positive',
        type: 'formation',
        metric: 'Win Rate',
        metricValue: `${best.winRate.toFixed(0)}%`,
        relatedFormation: best.formation,
        confidence: Math.min(best.total / 10, 1),
      });
    }
    if (worst.total >= 5 && worst.winRate < 40) {
      insights.push({
        id: 'formation_worst',
        title: `${worst.formation} is dragging your stats down`,
        description: `You're only winning ${worst.winRate.toFixed(0)}% of games with ${worst.formation} (${worst.total} matches). That's below your overall average.`,
        recommendation: `Consider swapping ${worst.formation} for a formation with a stronger track record in your data.`,
        severity: 'warning',
        type: 'formation',
        metric: 'Win Rate',
        metricValue: `${worst.winRate.toFixed(0)}%`,
        relatedFormation: worst.formation,
        confidence: Math.min(worst.total / 10, 1),
      });
    }
  }

  // 2. First goal impact
  const fg = firstGoalImpact(matches);
  if (fg.scoredFirst + fg.concededFirst >= 10) {
    const diff = fg.scoredFirstWinRate - fg.concededFirstWinRate;
    if (diff > 30) {
      insights.push({
        id: 'first_goal_positive',
        title: 'Scoring first is a major advantage for you',
        description: `When you score first your win rate is ${fg.scoredFirstWinRate.toFixed(0)}%. When you concede first it drops to ${fg.concededFirstWinRate.toFixed(0)}% — a ${diff.toFixed(0)}pp gap.`,
        recommendation: `Focus on early pressure and aggressive tactics at the start of matches. A fast opener sets the tone.`,
        severity: diff > 50 ? 'critical' : 'positive',
        type: 'first_goal',
        metric: 'Win rate after scoring first',
        metricValue: `${fg.scoredFirstWinRate.toFixed(0)}%`,
        confidence: Math.min((fg.scoredFirst + fg.concededFirst) / 20, 1),
      });
    }
    if (fg.concededFirstWinRate < 25) {
      insights.push({
        id: 'first_goal_concede',
        title: 'You rarely recover when conceding first',
        description: `Your comeback win rate after conceding first is only ${fg.concededFirstWinRate.toFixed(0)}%. This is a major vulnerability — getting scored on early tends to snowball.`,
        recommendation: `Work on mental reset after conceding. Avoid tilting and maintain your game plan — the match isn't over.`,
        severity: 'critical',
        type: 'first_goal',
        metric: 'Win rate after conceding first',
        metricValue: `${fg.concededFirstWinRate.toFixed(0)}%`,
        confidence: Math.min(fg.concededFirst / 10, 1),
      });
    }
  }

  // 3. Clutch stats
  const cl = clutchStats(matches);
  if (cl.closeTotal >= 8) {
    if (cl.closeWinRate > 55) {
      insights.push({
        id: 'clutch_positive',
        title: 'You perform well in tight matches',
        description: `Your win rate in close games (1-goal margin or less) is ${cl.closeWinRate.toFixed(0)}% across ${cl.closeTotal} matches. That's a strong mental edge.`,
        recommendation: `Keep leaning into this strength. Stay calm and patient in tight situations — the data says you win them.`,
        severity: 'positive',
        type: 'clutch',
        metric: 'Close-game win rate',
        metricValue: `${cl.closeWinRate.toFixed(0)}%`,
        confidence: Math.min(cl.closeTotal / 15, 1),
      });
    } else if (cl.closeWinRate < 40) {
      insights.push({
        id: 'clutch_negative',
        title: 'Tight matches are a weak spot',
        description: `You only win ${cl.closeWinRate.toFixed(0)}% of close games. This suggests decision-making under pressure might be costing you.`,
        recommendation: `In close matches, prioritize ball retention and avoid risky plays. Protect the lead or protect the draw.`,
        severity: 'warning',
        type: 'clutch',
        metric: 'Close-game win rate',
        metricValue: `${cl.closeWinRate.toFixed(0)}%`,
        confidence: Math.min(cl.closeTotal / 15, 1),
      });
    }
  }

  // 4. Fatigue insight
  const fat = fatigueStats(matches);
  if (fat.early.count >= 5 && fat.late.count >= 5 && fat.dropOff > 20) {
    insights.push({
      id: 'fatigue',
      title: 'Your performance drops significantly in late matches',
      description: `Win rate in matches 1–5: ${fat.early.winRate.toFixed(0)}%. Matches 11+: ${fat.late.winRate.toFixed(0)}%. That's a ${fat.dropOff.toFixed(0)}pp drop — classic fatigue pattern.`,
      recommendation: `Take breaks every 5 matches. Don't grind through a full Weekend League without mental resets. Quality over quantity.`,
      severity: fat.dropOff > 35 ? 'critical' : 'warning',
      type: 'fatigue',
      metric: 'Win rate drop (early vs late)',
      metricValue: `−${fat.dropOff.toFixed(0)}pp`,
      confidence: Math.min((fat.early.count + fat.late.count) / 20, 1),
    });
  }

  // 5. xG insights
  const xg = xgStats(matches);
  if (xg && xg.count >= 10) {
    if (xg.underperformingRate > 55) {
      insights.push({
        id: 'xg_under',
        title: 'You create chances but don\'t convert',
        description: `In ${xg.underperformingRate.toFixed(0)}% of your games you score below your expected goals (xG: ${xg.avgXgMe}). You're creating the right amount — finishing is the issue.`,
        recommendation: `Focus on shot selection and positioning. Take higher-probability shots rather than difficult angles.`,
        severity: 'warning',
        type: 'xg',
        metric: 'xG underperformance rate',
        metricValue: `${xg.underperformingRate.toFixed(0)}%`,
        confidence: Math.min(xg.count / 20, 1),
      });
    }
    if (xg.xgDiff > 0.5) {
      insights.push({
        id: 'xg_positive',
        title: 'Your attack outperforms your defense in xG',
        description: `Average xG for: ${xg.avgXgMe} | xG against: ${xg.avgXgOpp}. You're generating better chances than you're allowing — a sign of tactical dominance.`,
        recommendation: `Keep the pressure up offensively. Your defensive shape is working — don't over-commit forward.`,
        severity: 'positive',
        type: 'xg',
        metric: 'xG differential',
        metricValue: `+${xg.xgDiff}`,
        confidence: Math.min(xg.count / 20, 1),
      });
    }
  }

  // 6. Consistency
  const cons = consistencyStats(matches);
  if (cons.trend > 15) {
    insights.push({
      id: 'consistency_up',
      title: 'You\'re on an upward trend',
      description: `Your last 10-game win rate is ${cons.last10WR.toFixed(0)}%, which is ${cons.trend.toFixed(0)}pp above your overall average. Momentum is building.`,
      recommendation: `Keep your current routine and setup. Don't change what's working right now.`,
      severity: 'positive',
      type: 'consistency',
      metric: 'Recent form vs average',
      metricValue: `+${cons.trend.toFixed(0)}pp`,
      confidence: 0.85,
    });
  } else if (cons.trend < -15) {
    insights.push({
      id: 'consistency_down',
      title: 'Recent form is below your average',
      description: `Your last 10-game win rate (${cons.last10WR.toFixed(0)}%) is ${Math.abs(cons.trend).toFixed(0)}pp below your overall average. Something might have changed.`,
      recommendation: `Review your last few defeats. Look for patterns — same formation issues, same time slot, fatigue signals? Reset your approach.`,
      severity: 'warning',
      type: 'consistency',
      metric: 'Form vs average',
      metricValue: `−${Math.abs(cons.trend).toFixed(0)}pp`,
      confidence: 0.85,
    });
  }
  if (cons.maxLossStreak >= 4) {
    insights.push({
      id: 'loss_streak',
      title: `You've had losing streaks of up to ${cons.maxLossStreak} in a row`,
      description: `Losing ${cons.maxLossStreak} matches consecutively is a mental and tactical red flag. Tilt can compound quickly in Weekend League.`,
      recommendation: `Set a rule: if you lose 3 in a row, stop and take a break. Come back fresh. Never chase losses in the same session.`,
      severity: cons.maxLossStreak >= 5 ? 'critical' : 'warning',
      type: 'consistency',
      metric: 'Longest losing streak',
      metricValue: `${cons.maxLossStreak} in a row`,
      confidence: 1,
    });
  }

  // 7. Scoring efficiency
  const totalGoals = matches.reduce((s, m) => s + m.goals_me, 0);
  const totalShots = matches.reduce((s, m) => s + (m.shots_me ?? 0), 0);
  if (totalShots > 0) {
    const shotConv = (totalGoals / totalShots) * 100;
    if (shotConv < 15) {
      insights.push({
        id: 'shot_conversion',
        title: 'Shot conversion is below average',
        description: `You're converting ${shotConv.toFixed(1)}% of your shots. The game average tends to be around 15–20%.`,
        recommendation: `Prioritize shot quality over quantity. Fewer, better-angled shots from inside the box will improve your conversion.`,
        severity: 'warning',
        type: 'scoring',
        metric: 'Shot conversion rate',
        metricValue: `${shotConv.toFixed(1)}%`,
        confidence: Math.min(matches.filter(m => m.shots_me != null).length / 15, 1),
      });
    }
  }

  // 8. Positive overall
  if (overallWR >= 65 && matches.length >= 20) {
    insights.push({
      id: 'overall_strong',
      title: 'Strong overall performance',
      description: `With a ${overallWR.toFixed(0)}% win rate across ${matches.length} tracked matches, you're performing at a high level consistently.`,
      recommendation: `Focus on incremental gains — closing out tight matches and reducing your loss streak risk.`,
      severity: 'positive',
      type: 'general',
      metric: 'Overall win rate',
      metricValue: `${overallWR.toFixed(0)}%`,
      confidence: Math.min(matches.length / 40, 1),
    });
  }

  return insights.sort((a, b) => {
    const order: InsightSeverity[] = ['critical', 'warning', 'positive', 'info'];
    return order.indexOf(a.severity) - order.indexOf(b.severity);
  });
}

// ─── Rank Projection ─────────────────────────────────────────────────────────
export function projectFinalRank(wins: number, totalPlayed: number, totalMatches = 20) {
  const remaining = totalMatches - totalPlayed;
  if (remaining <= 0) return wins;
  const winRate = totalPlayed > 0 ? wins / totalPlayed : 0.5;
  // Regress slightly toward mean for better projection
  const expectedFinal = wins + Math.round(remaining * (winRate * 0.85 + 0.15 * 0.5));
  return Math.min(expectedFinal, totalMatches);
}

export function getRankFromWins(wins: number): string {
  if (wins >= 15) return 'Top 100';
  if (wins >= 13) return 'Top 200';
  if (wins >= 11) return 'Elite I';
  if (wins >= 9)  return 'Elite II';
  if (wins >= 7)  return 'Elite III';
  if (wins >= 5)  return 'Gold III';
  if (wins >= 4)  return 'Gold II';
  if (wins >= 3)  return 'Gold I';
  return 'Silver';
}
