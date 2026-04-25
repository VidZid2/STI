/**
 * GroupChatPage Constants
 * Shared constants and configuration for the group chat feature
 */

import type { UserBadge, StudyReaction, ToolColorConfig } from './types';

// Tool color configuration for study tools menu
export const TOOL_COLOR_CONFIG: Record<string, ToolColorConfig> = {
    flashcard: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)' },
    poll: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)' },
    schedule: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
    pin: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
    whiteboard: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
    voicenote: { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.08)' },
    file: { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)' },
    material: { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.08)' } };

// Study-specific reactions for messages
export const STUDY_REACTIONS: StudyReaction[] = [
    { emoji: '✓', label: 'Understood', color: '#22c55e' },
    { emoji: '?', label: 'Confused', color: '#f59e0b' },
    { emoji: '📌', label: 'Important', color: '#3b82f6' },
    { emoji: '💡', label: 'Helpful', color: '#a855f7' },
    { emoji: '🔥', label: 'Great point', color: '#ef4444' },
];

// Badge definitions for gamification
export const BADGES: Record<string, UserBadge> = {
    streak3: { id: 'streak3', icon: '🔥', label: '3-Day Streak', color: '#f59e0b' },
    streak7: { id: 'streak7', icon: '⚡', label: 'Week Warrior', color: '#8b5cf6' },
    streak30: { id: 'streak30', icon: '🏆', label: 'Monthly Master', color: '#eab308' },
    helper: { id: 'helper', icon: '🤝', label: 'Helper', color: '#22c55e' },
    superHelper: { id: 'superHelper', icon: '⭐', label: 'Super Helper', color: '#3b82f6' },
    contributor: { id: 'contributor', icon: '📚', label: 'Contributor', color: '#ec4899' },
    earlyBird: { id: 'earlyBird', icon: '🌅', label: 'Early Bird', color: '#06b6d4' },
    nightOwl: { id: 'nightOwl', icon: '🦉', label: 'Night Owl', color: '#6366f1' } };

// XP rewards for various actions
export const XP_REWARDS: Record<string, number> = {
    sendMessage: 5,
    shareFlashcard: 15,
    createPoll: 10,
    scheduleSession: 20,
    shareResource: 10,
    receiveHelpful: 25,
    dailyLogin: 10 };

// Quick emoji reactions for message input
export const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👏'];

// Emoji category type
export type EmojiCategory = {
    id: string;
    name: string;
    icon: string;
    emojis: string[];
};

// Emoji categories for the full emoji picker
export const EMOJI_CATEGORIES: EmojiCategory[] = [
    {
        id: 'recent',
        name: 'Recent',
        icon: '🕐',
        emojis: ['👍', '❤️', '😂', '🎉', '🔥', '👏', '✅', '💯'] },
    {
        id: 'study',
        name: 'Study',
        icon: '📚',
        emojis: ['📚', '📖', '📝', '✏️', '📓', '📒', '📕', '📗', '📘', '📙', '🎓', '🏆', '💡', '🧠', '📊', '📈', '✅', '❌', '❓', '❗', '💯', '🎯', '⏰', '📅'] },
    {
        id: 'smileys',
        name: 'Smileys',
        icon: '😀',
        emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '😎', '🤓', '🧐', '😏', '🤔', '🤗', '🤭', '😐', '😑', '😶', '😬', '🙄', '😴'] },
    {
        id: 'gestures',
        name: 'Gestures',
        icon: '👋',
        emojis: ['👋', '🤚', '✋', '🖐️', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪'] },
    {
        id: 'hearts',
        name: 'Hearts',
        icon: '❤️',
        emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '🫶', '💑', '💏'] },
    {
        id: 'celebration',
        name: 'Celebration',
        icon: '🎉',
        emojis: ['🎉', '🎊', '🎈', '🎁', '🎀', '🏅', '🥇', '🥈', '🥉', '🏆', '⭐', '🌟', '✨', '💫', '🔥', '💥', '🎆', '🎇', '🪅', '🎯', '🎮', '🎲'] },
    {
        id: 'food',
        name: 'Food',
        icon: '🍕',
        emojis: ['☕', '🍵', '🧃', '🥤', '🍺', '🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🍰', '🍩', '🍪', '🍫', '🍬', '🍭', '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓'] },
    {
        id: 'nature',
        name: 'Nature',
        icon: '🌸',
        emojis: ['🌸', '🌺', '🌻', '🌹', '🌷', '🌱', '🌲', '🌳', '🍀', '🌈', '☀️', '🌙', '⭐', '🌊', '🔥', '❄️', '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁'] },
    {
        id: 'objects',
        name: 'Objects',
        icon: '💻',
        emojis: ['💻', '🖥️', '📱', '⌨️', '🖱️', '💾', '📷', '🎥', '📺', '🔊', '🎵', '🎶', '🎤', '🎧', '📻', '⏰', '⏱️', '📆', '📌', '📎', '✂️', '🔑', '🔒', '💡'] },
    {
        id: 'symbols',
        name: 'Symbols',
        icon: '✅',
        emojis: ['✅', '❌', '❓', '❗', '💯', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '▶️', '⏸️', '⏹️', '⏺️', '⏭️', '⏮️', '🔀', '🔁', '🔂', '➕', '➖', '➗', '✖️', '♾️'] },
];
