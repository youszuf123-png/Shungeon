import type { SkillId, WeaponId } from './types';

export type JotaroAnnouncementKind =
  | 'boss_intro'
  | 'player_weapon'
  | 'player_skill'
  | 'boss_attack'
  | 'boss_defeat'
  | 'retreat'
  | 'dialogue';

export interface JotaroVoicePrompt {
  cacheKey: string;
  kind: JotaroAnnouncementKind;
  attackName: string;
  captionLine: string;
  ttsScript: string;
  voiceStyle: string;
}

export interface JotaroAnnouncementInput {
  kind: Exclude<JotaroAnnouncementKind, 'dialogue'>;
  attackName: string;
  weaponId?: WeaponId;
  weaponStyle?: string;
  skillId?: SkillId;
  bossName?: string;
  standName?: string;
}

const JOTARO_JAPANESE_AGGRO_STYLE =
  'Speak strictly in authentic JAPANESE (日本語) in the original anime voice of Jotaro Kujo (小野大輔 style, JoJo Stardust Crusaders): ultra-deep, gravelly, explosive baritone packed with maximum volume, fury, and raw battle aggression! Shout skill names loudly from the diaphragm with fierce rasp, clenched-teeth intensity, and booming battle cries—zero calm narration!';

const JOTARO_INTRO_STYLE =
  'Speak strictly in the iconic deep, gravelly anime voice of Jotaro Kujo (JoJo Stardust Crusaders): heavy stoic gravity, dry disdain, simmering tension, and rising fierce resolve in a tight single opening monologue.';

/**
 * Original iconic Japanese JoJo anime voicelines + fierce Japanese katakana skill names.
 * High loudness, raw emotion, and pure combat aggression.
 */
const ORIGINAL_JAPANESE_SKILL_CALLS: Record<
  SkillId,
  { tts: string; caption: (name: string) => string; direction: string }
> = {
  stand_rush: {
    tts: 'スタープラチナ！オラ・バラージ！！オラオラオラオラオラァァァッ！！',
    caption: (name) => `スタープラチナ！${name}！！オラオラオラァァッ！！`,
    direction:
      'SHOUT AT PEAK VOLUME AND FURY! Explosive rapid-fire ORA ORA ORA punch roar tearing straight through the throat.',
  },
  chrono_freeze: {
    tts: 'スタープラチナ・ザ・ワールド！ストップ・セカンド！！時よ止まれェェッ！！',
    caption: (name) => `ザ・ワールド！${name}！！時よ止まれェェッ！！`,
    direction:
      'THUNDEROUS, EARTH-SHAKING ANIME COMMAND! Bellow "Toki yo tomare!!" with terrifying absolute authority and gravel.',
  },
  parry_guard: {
    tts: 'ロイヤル・ディフレクト！！裁くのは俺のスタンドだァァッ！！',
    caption: (name) => `${name}！！裁くのは俺のスタンドだァッ！！`,
    direction:
      'SNARLING, FIERCE ANIME VERDICT! Loud, icy rage exploding on the final shout.',
  },
  candlefire_wave: {
    tts: 'キャンドルファイア・アーク！！ここで叩き込んでやる、オラァァッ！！',
    caption: (name) => `${name}！！ここで叩き込んでやる、オラァッ！！`,
    direction:
      'FEROCIOUS BATTLE ROAR! Aggressive diagonal slash shout packed with blazing combat fury.',
  },
  blade_dash: {
    tts: 'ファントム・ランジ！！スターフィンガー！！オラァァッ！！',
    caption: (name) => `${name}！！スターフィンガー！オラァッ！！`,
    direction:
      'SHARP EXPLOSIVE ANIME CRY! High-impact supersonic lunge shout followed by a snapping ORAA!',
  },
  sunburst_cleave: {
    tts: 'ハモン・サンバースト！！サンライト・イエロー・オーバードライブ！！オラァァッ！！',
    caption: (name) => `${name}！！オーバードライブ！！オラァァッ！！`,
    direction:
      'MAXIMUM CLIMAX WAR CRY! Roar every syllable with overwhelming, speaker-shaking battle intensity.',
  },
};

export function buildJotaroAttackAnnouncement(
  input: JotaroAnnouncementInput,
): JotaroVoicePrompt {
  const cleanAttack = input.attackName.trim() || 'Stand Strike';

  if (input.kind === 'player_skill' && input.skillId) {
    const template = ORIGINAL_JAPANESE_SKILL_CALLS[input.skillId];
    return {
      cacheKey: `skill_jp_v3:${input.skillId}`,
      kind: input.kind,
      attackName: cleanAttack,
      captionLine: template.caption(cleanAttack),
      ttsScript: template.tts,
      voiceStyle: `${JOTARO_JAPANESE_AGGRO_STYLE} ${template.direction}`,
    };
  }

  // Fallback for replay if no skill was cast yet
  return {
    cacheKey: `skill_jp_v3:${cleanAttack.toLowerCase()}`,
    kind: input.kind,
    attackName: cleanAttack,
    captionLine: `スタープラチナ！${cleanAttack}！オラァッ！！`,
    ttsScript: `スタープラチナ！${cleanAttack}！！オラァァッ！！`,
    voiceStyle: JOTARO_JAPANESE_AGGRO_STYLE,
  };
}

export function buildJotaroDialoguePrompt(
  rawText: string,
  speakerKind: 'warrior' | 'throne' | 'candle' | 'secret' | 'boss' | 'system' = 'warrior',
): JotaroVoicePrompt {
  const clean = rawText.replace(/^\*\s*/, '').trim().slice(0, 180) || 'Yare yare daze.';
  const ttsScript = clean.toLowerCase().startsWith('yare yare')
    ? clean
    : `Yare yare daze. ${clean}`;
  return {
    cacheKey: `dlg_v3:${speakerKind}:${clean.toLowerCase()}`,
    kind: 'dialogue',
    attackName: clean.slice(0, 48),
    captionLine: clean,
    ttsScript,
    voiceStyle: JOTARO_INTRO_STYLE,
  };
}
