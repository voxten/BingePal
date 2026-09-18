"use client";

import { FiLock } from 'react-icons/fi';
import { VIEWER_TIERS, getTier, getNextTier, hoursForLevel } from '../../services/viewerLevelService';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import TierAvatar from './TierAvatar';

const formatHours = (hours) => Math.round(hours).toLocaleString();

export default function TierLadderModal({ isOpen, onClose, levelInfo }) {
    if (!isOpen || !levelInfo) return null;

    const tier = getTier(levelInfo.level);
    const nextTier = getNextTier(levelInfo.level);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            title="Viewer tiers"
            description="Levels come from hours watched. Each tier changes your profile frame."
        >
            <div className="space-y-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-sm">
                        <span className="font-semibold text-slate-900 dark:text-white tabular-nums">Level {levelInfo.level}</span>
                        <span className="text-slate-400"> · </span>
                        <span className={`font-semibold ${tier.accentText}`}>{tier.name}</span>
                        <span className="text-slate-500 dark:text-slate-400"> · {tier.description}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {nextTier
                            ? `Next: ${nextTier.name} at level ${nextTier.minLevel} (${formatHours(hoursForLevel(nextTier.minLevel))} h)`
                            : 'Top tier reached. Levels keep going.'}
                    </p>
                </div>

                <ol className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {VIEWER_TIERS.map((t) => {
                        const isCurrent = t.key === tier.key;
                        const isLocked = levelInfo.level < t.minLevel;

                        return (
                            <li
                                key={t.key}
                                className={`flex flex-col items-center gap-2.5 rounded-xl border px-2 py-4 text-center ${
                                    isCurrent
                                        ? 'border-indigo-300 bg-indigo-50/60 dark:border-indigo-500/40 dark:bg-indigo-500/5'
                                        : 'border-slate-200 dark:border-slate-800'
                                }`}
                            >
                                <TierAvatar
                                    size="md"
                                    tier={t}
                                    label={t.minLevel}
                                    className={isLocked ? 'grayscale opacity-40' : ''}
                                />
                                <div className="min-w-0">
                                    <div className={`flex items-center justify-center gap-1 text-xs font-medium ${
                                        isLocked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                                    }`}>
                                        {isLocked && <FiLock className="w-3 h-3 shrink-0" />}
                                        <span className="truncate">{t.name}</span>
                                    </div>
                                    <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                                        Lv {t.minLevel} · {formatHours(hoursForLevel(t.minLevel))} h
                                    </div>
                                </div>
                                {isCurrent && <Badge tone="accent">You are here</Badge>}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </Modal>
    );
}
