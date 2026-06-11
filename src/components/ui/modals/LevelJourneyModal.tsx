import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import TimeLine_01 from '../release-time-line';
import type { TimeLine_01Entry } from '../release-time-line';
import { 
    GraduationCap, 
    TrendingUp, 
    BookOpen, 
    Award, 
    Sparkles, 
    Zap, 
    Trophy, 
    Crown, 
    Compass, 
    Brain, 
    Bookmark, 
    Shield, 
    Target, 
    Medal, 
    Star, 
    Gem,
    User,
    Users,
    Layers,
    MessageSquare,
    Clock,
    Flame,
    Download,
    Link,
    ShoppingBag,
    Image,
    Bell,
    FolderPlus,
    Calendar,
    Ticket,
    Heart
} from 'lucide-react';

interface LevelJourneyModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLevel: number;
}

// Detailed level tiers with formatted and highlighted ReactNode descriptions for rewards
const levelTiers = [
    {
        name: 'Scholar Initiation',
        levelRange: 'Level 1',
        description: 'Your academic journey begins! Establish your core study habits and complete introductory courses.',
        icon: GraduationCap,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Base Avatar Pack:</strong> Unlocks a set of <strong className="text-blue-600 dark:text-blue-400 font-black">5 default academic avatars</strong> to customize your student profile appearance.
                    </span>
                ), 
                icon: User,
                type: 'cosmetic' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Access to Student Lounge:</strong> Join the <strong className="text-blue-600 dark:text-blue-400 font-black">global chat lobby</strong> to study, chat, and coordinate study sessions with peers.
                    </span>
                ), 
                icon: MessageSquare,
                type: 'social' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Standard Profile Card border:</strong> Unlocks the <strong className="text-blue-600 dark:text-blue-400 font-black">standard academic blue border</strong> for your student profile card.
                    </span>
                ), 
                icon: Layers,
                type: 'cosmetic' as const
            }
        ],
        gradient: 'from-zinc-500 to-zinc-650 dark:from-zinc-600 dark:to-zinc-800'
    },
    {
        name: 'Spark of Curiosity',
        levelRange: 'Level 2',
        description: 'Taking your first active steps. Unlock extra profile flair and double your study tracking limits.',
        icon: Sparkles,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Bronze Star Badge:</strong> Displays a gleaming <strong className="text-blue-600 dark:text-blue-400 font-black">bronze star icon</strong> next to your name in class chat rooms.
                    </span>
                ), 
                icon: Star,
                type: 'cosmetic' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Study Timer customizations:</strong> Unlocks <strong className="text-blue-600 dark:text-blue-400 font-black">custom focus session alarms</strong> and <strong className="text-blue-600 dark:text-blue-400 font-black">retro soundscapes</strong> in the study timer.
                    </span>
                ), 
                icon: Clock,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">+10% XP Daily Streak Bonus:</strong> Increases your XP rewards by <strong className="text-blue-600 dark:text-blue-400 font-black">1.1x multiplier</strong> for completing study sessions on consecutive days.
                    </span>
                ), 
                icon: Flame,
                type: 'boost' as const
            }
        ],
        gradient: 'from-zinc-500 to-zinc-650 dark:from-zinc-600 dark:to-zinc-800'
    },
    {
        name: 'Study Pioneer',
        levelRange: 'Level 3',
        description: 'Delving deeper into modules. Access forum discussions and download PDF course materials.',
        icon: BookOpen,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Access to General Forums:</strong> Post questions, study guides, and notes in the <strong className="text-blue-600 dark:text-blue-400 font-black">public community forums</strong>.
                    </span>
                ), 
                icon: MessageSquare,
                type: 'social' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Bronze Profile Border:</strong> Customize your avatar frame with a solid <strong className="text-blue-600 dark:text-blue-400 font-black">bronze border</strong> of achievement.
                    </span>
                ), 
                icon: Layers,
                type: 'cosmetic' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">PDF Course Exporter:</strong> Export your study summaries, notes, and predicting schedules directly to <strong className="text-blue-600 dark:text-blue-400 font-black">PDF files</strong>.
                    </span>
                ), 
                icon: Download,
                type: 'feature' as const
            }
        ],
        gradient: 'from-teal-500 to-emerald-600 dark:from-teal-600 dark:to-emerald-800'
    },
    {
        name: 'Academic Navigator',
        levelRange: 'Level 4',
        description: 'Navigating your studies with ease. Access advanced filters in citation generators.',
        icon: Compass,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Citation Exporter presets:</strong> Unlock <strong className="text-blue-600 dark:text-blue-400 font-black">APA, MLA, and Chicago format presets</strong> in the Reference Manager citation generator.
                    </span>
                ), 
                icon: Link,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">5% Bookstore Discount:</strong> Applies an automatic <strong className="text-blue-600 dark:text-blue-400 font-black">5% discount</strong> at checkout on all campus bookstore orders.
                    </span>
                ), 
                icon: ShoppingBag,
                type: 'discount' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Access to group study sheets:</strong> Collab in real-time on <strong className="text-blue-600 dark:text-blue-400 font-black">public spreadsheets</strong> and subject note guides.
                    </span>
                ), 
                icon: FolderPlus,
                type: 'feature' as const
            }
        ],
        gradient: 'from-emerald-500 to-cyan-600 dark:from-emerald-650 dark:to-cyan-800'
    },
    {
        name: 'Rising Scholar',
        levelRange: 'Level 5',
        description: 'Halfway through the foundation levels! Earn priority notifications for assignments.',
        icon: TrendingUp,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Rising Scholar Chat Tag:</strong> Earns you a highlighted <strong className="text-blue-600 dark:text-blue-400 font-black">\'Rising Scholar\' prefix badge</strong> in global chat channels.
                    </span>
                ), 
                icon: MessageSquare,
                type: 'cosmetic' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Custom Profile Banners:</strong> Upload <strong className="text-blue-600 dark:text-blue-400 font-black">custom cover banner images</strong> to personalize your student dashboard header.
                    </span>
                ), 
                icon: Image,
                type: 'cosmetic' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Assignment deadline alerts:</strong> Receive SMS alerts and push reminders <strong className="text-blue-600 dark:text-blue-400 font-black">24 hours prior</strong> to homework deadlines.
                    </span>
                ), 
                icon: Bell,
                type: 'feature' as const
            }
        ],
        gradient: 'from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-800'
    },
    {
        name: 'Dedicated Researcher',
        levelRange: 'Level 6',
        description: 'Consistent efforts starting to show. Unlock research document storage slots.',
        icon: Award,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">10 Peer Study Rooms access:</strong> Host private virtual study rooms with screen-sharing and audio for up to <strong className="text-blue-600 dark:text-blue-400 font-black">10 participants</strong>.
                    </span>
                ), 
                icon: Users,
                type: 'social' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Research Manager (+5 slots):</strong> Increases your citation dashboard storage capacity to track <strong className="text-blue-600 dark:text-blue-400 font-black">5 additional projects</strong>.
                    </span>
                ), 
                icon: FolderPlus,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Exclusive focus theme:</strong> Unlock a <strong className="text-blue-600 dark:text-blue-400 font-black">premium retro study space</strong> environment background for the Focus mode.
                    </span>
                ), 
                icon: Image,
                type: 'cosmetic' as const
            }
        ],
        gradient: 'from-blue-500 to-indigo-650 dark:from-blue-600 dark:to-indigo-850'
    },
    {
        name: 'Mindful Thinker',
        levelRange: 'Level 7',
        description: 'Exhibiting deep comprehension. Expand vocabulary and checks in paraphrasing tools.',
        icon: Brain,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Paraphraser word limit upgrade:</strong> Increases check limit to <strong className="text-blue-600 dark:text-blue-400 font-black">500 words per run</strong> in the automated writing validator.
                    </span>
                ), 
                icon: BookOpen,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Study Streak multiplier (+1.1x XP):</strong> Applies a permanent <strong className="text-blue-600 dark:text-blue-400 font-black">1.1x multiplier</strong> to all XP gained from active study sessions.
                    </span>
                ), 
                icon: Flame,
                type: 'boost' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Interactive study cards pack:</strong> Access pre-made flashcard decks for <strong className="text-blue-600 dark:text-blue-400 font-black">general science and IT modules</strong>.
                    </span>
                ), 
                icon: Layers,
                type: 'feature' as const
            }
        ],
        gradient: 'from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-800'
    },
    {
        name: 'Academic Builder',
        levelRange: 'Level 8',
        description: 'Strengthening your academic routine. Customize your study workspace.',
        icon: Bookmark,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Personalized Widget Dashboards:</strong> Rearrange, resize, and hide widgets on your <strong className="text-blue-600 dark:text-blue-400 font-black font-black">main student home layout</strong>.
                    </span>
                ), 
                icon: Layers,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">10% Bookstore Discount:</strong> Increases campus bookstore checkout discount to a permanent <strong className="text-blue-600 dark:text-blue-400 font-black">10%</strong> on all orders.
                    </span>
                ), 
                icon: ShoppingBag,
                type: 'discount' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Custom folder icons:</strong> Color-code and tag folders in your reference library for <strong className="text-blue-600 dark:text-blue-400 font-black">better organization</strong>.
                    </span>
                ), 
                icon: FolderPlus,
                type: 'feature' as const
            }
        ],
        gradient: 'from-purple-500 to-fuchsia-600 dark:from-purple-600 dark:to-fuchsia-800'
    },
    {
        name: 'Honor Candidate',
        levelRange: 'Level 9',
        description: 'Approaching the elite tiers. Unlock silver frames and custom chat banners.',
        icon: Trophy,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Silver Profile Border:</strong> Customize your avatar frame with a sleek <strong className="text-blue-600 dark:text-blue-400 font-black">silver metallic border</strong>.
                    </span>
                ), 
                icon: Layers,
                type: 'cosmetic' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Silver Star chat badge:</strong> Replaces the bronze star badge with a glowing <strong className="text-blue-600 dark:text-blue-400 font-black">silver star</strong> next to your name.
                    </span>
                ), 
                icon: Star,
                type: 'cosmetic' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Access to honor student forums:</strong> Join locked community forums for <strong className="text-blue-600 dark:text-blue-400 font-black">advanced study groups</strong> and exam prep.
                    </span>
                ), 
                icon: MessageSquare,
                type: 'social' as const
            }
        ],
        gradient: 'from-fuchsia-500 to-pink-600 dark:from-fuchsia-600 dark:to-pink-800'
    },
    {
        name: 'Distinguished Scholar',
        levelRange: 'Level 10',
        description: 'A major milestone reached! Unlock animated borders and early access to beta features.',
        icon: Zap,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Animated Profile Border:</strong> Unlocks the animated glowing <strong className="text-blue-600 dark:text-blue-400 font-black">blue neon border</strong> for your student avatar card.
                    </span>
                ), 
                icon: Sparkles,
                type: 'cosmetic' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Priority Course Registration:</strong> Gain early access window to <strong className="text-blue-600 dark:text-blue-400 font-black">enroll in upcoming modules</strong> before general registration opens.
                    </span>
                ), 
                icon: Calendar,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">12% Bookstore Discount:</strong> Increases bookstore checkout discount to an automatic <strong className="text-blue-600 dark:text-blue-400 font-black">12% off</strong> all textbooks.
                    </span>
                ), 
                icon: ShoppingBag,
                type: 'discount' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Early access to new modules:</strong> Test out and study <strong className="text-blue-600 dark:text-blue-400 font-black">new interactive simulation labs</strong> before public deployment.
                    </span>
                ), 
                icon: Zap,
                type: 'feature' as const
            }
        ],
        gradient: 'from-pink-500 to-rose-600 dark:from-pink-600 dark:to-rose-800'
    },
    {
        name: 'Master Student',
        levelRange: 'Levels 11 - 19',
        description: 'Demonstrating academic leadership. Unlock elite study groups and higher limits.',
        icon: Shield,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Elite Study Groups invitation:</strong> Get matched automatically with <strong className="text-blue-600 dark:text-blue-400 font-black">high-performing students</strong> for collaborative exam review.
                    </span>
                ), 
                icon: Users,
                type: 'social' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">15% Bookstore Discount:</strong> Unlocks a permanent <strong className="text-blue-600 dark:text-blue-400 font-black">15% discount code</strong> for textbooks, gear, and merchandise.
                    </span>
                ), 
                icon: ShoppingBag,
                type: 'discount' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Feature requests priority voting:</strong> Submit and vote on upcoming portal feature proposals directly with <strong className="text-blue-600 dark:text-blue-400 font-black">eLMS admins</strong>.
                    </span>
                ), 
                icon: Trophy,
                type: 'vip' as const
            }
        ],
        gradient: 'from-sky-500 to-indigo-650 dark:from-sky-600 dark:to-indigo-850'
    },
    {
        name: 'Grandmaster Learner',
        levelRange: 'Levels 20 - 29',
        description: 'Unparalleled dedication and performance. Custom theme styling for the entire dashboard.',
        icon: Target,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Exclusive App Themes:</strong> Unlock <strong className="text-blue-600 dark:text-blue-400 font-black">5 premium visual themes</strong> (Dracula, Midnight Blue, Emerald, Sunrise, Cyberpunk).
                    </span>
                ), 
                icon: Image,
                type: 'cosmetic' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Access to virtual study auditoriums:</strong> Participate in large-scale guest speaker sessions with <strong className="text-blue-600 dark:text-blue-400 font-black">live chat interaction</strong>.
                    </span>
                ), 
                icon: Users,
                type: 'social' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Study Streak multiplier (+1.2x XP):</strong> Applies a permanent <strong className="text-blue-600 dark:text-blue-400 font-black">1.2x multiplier</strong> to all XP gained from study activities.
                    </span>
                ), 
                icon: Flame,
                type: 'boost' as const
            }
        ],
        gradient: 'from-green-500 to-teal-600 dark:from-green-600 dark:to-teal-800'
    },
    {
        name: 'High Honor Graduate',
        levelRange: 'Levels 30 - 39',
        description: 'Recognized for continuous academic mastery and peer mentorship support.',
        icon: Medal,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">High Honor VIP Chat Badges:</strong> Displays a specialized glowing <strong className="text-blue-600 dark:text-blue-400 font-black">Emblem of Honor</strong> next to your profile in all chats.
                    </span>
                ), 
                icon: Star,
                type: 'cosmetic' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Event VIP seating invitations:</strong> Receive priority invitations and <strong className="text-blue-600 dark:text-blue-400 font-black">reserved seating</strong> for physical campus symposiums.
                    </span>
                ), 
                icon: Ticket,
                type: 'vip' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Direct consultation hotline:</strong> Ability to schedule <strong className="text-blue-600 dark:text-blue-400 font-black">1-on-1 virtual mentoring sessions</strong> directly with eLMS counselors.
                    </span>
                ), 
                icon: Bell,
                type: 'vip' as const
            }
        ],
        gradient: 'from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-800'
    },
    {
        name: 'Distinguished Scholar Elite',
        levelRange: 'Levels 40 - 49',
        description: 'At the gates of the absolute top tier. Enjoy premium library research tools.',
        icon: Star,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Premium Library Research:</strong> Unlock premium indexing and <strong className="text-blue-600 dark:text-blue-400 font-black">full-text downloads</strong> for international journals.
                    </span>
                ), 
                icon: BookOpen,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">20% Bookstore Discount:</strong> Applies an automatic <strong className="text-blue-600 dark:text-blue-400 font-black">20% discount</strong> on all bookstore textbook and accessory orders.
                    </span>
                ), 
                icon: ShoppingBag,
                type: 'discount' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Interactive badge customization:</strong> Showcase up to <strong className="text-blue-600 dark:text-blue-400 font-black">10 earned achievements</strong> on your public profile cards.
                    </span>
                ), 
                icon: Trophy,
                type: 'cosmetic' as const
            }
        ],
        gradient: 'from-violet-500 to-purple-700 dark:from-violet-600 dark:to-purple-900'
    },
    {
        name: 'Master Academic',
        levelRange: 'Levels 50 - 99',
        description: 'Complete academic mastery. Formally act as peer mentor and guide other students.',
        icon: Gem,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Library VIP Room Access:</strong> Unlock access to premium <strong className="text-blue-600 dark:text-blue-400 font-black">private physical study rooms</strong> equipped with research databases.
                    </span>
                ), 
                icon: Layers,
                type: 'vip' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Custom App Desktop Icon:</strong> Unlocks premium <strong className="text-blue-600 dark:text-blue-400 font-black">custom desktop icon options</strong> for the eLMS application shortcut.
                    </span>
                ), 
                icon: Image,
                type: 'cosmetic' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Mentorship role badge:</strong> Unlocks the <strong className="text-blue-600 dark:text-blue-400 font-black">\'Peer Mentor\' role banner</strong>, letting other students reach out to you for help.
                    </span>
                ), 
                icon: Shield,
                type: 'social' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Unlimited cloud storage:</strong> Upload unlimited PDF, docx, and presentation slides to your reference library.
                    </span>
                ), 
                icon: FolderPlus,
                type: 'feature' as const
            }
        ],
        gradient: 'from-rose-500 to-pink-700 dark:from-rose-600 dark:to-pink-900'
    },
    {
        name: 'Apex Legend',
        levelRange: 'Level 100',
        description: 'The highest educational achievement on the STI eLMS platform. The peak of scholastic excellence.',
        icon: Crown,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Physical Commemorative Plaque:</strong> Earn a physical <strong className="text-blue-600 dark:text-blue-400 font-black">engraved wooden plaque</strong> shipped directly to your home.
                    </span>
                ), 
                icon: Trophy,
                type: 'vip' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Free Graduation Tickets:</strong> Receive <strong className="text-blue-600 dark:text-blue-400 font-black">4 extra premium tickets</strong> for graduation guests with VIP seating.
                    </span>
                ), 
                icon: Ticket,
                type: 'vip' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Ultimate Digital Crown:</strong> Displays the legendary <strong className="text-blue-600 dark:text-blue-400 font-black">glowing crown animation</strong> over your avatar banner.
                    </span>
                ), 
                icon: Crown,
                type: 'cosmetic' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-black">Permanent hall of fame listing:</strong> Permanently list your name in the <strong className="text-blue-600 dark:text-blue-400 font-black">STI eLMS Hall of Fame</strong> directory page.
                    </span>
                ), 
                icon: Heart,
                type: 'vip' as const
            }
        ],
        gradient: 'from-yellow-500 via-orange-500 to-red-600 dark:from-yellow-600 dark:via-orange-600 dark:to-red-800'
    }
];

const LevelJourneyModal: React.FC<LevelJourneyModalProps> = ({ isOpen, onClose, currentLevel }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));

    // Auto-minimizing header state
    const [isMinimized, setIsMinimized] = useState(false);
    const lastScrollY = useRef(0);
    const scrollDirection = useRef<'up' | 'down' | null>(null);
    const anchorScrollY = useRef(0);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        
        // Handle iOS rubber banding / top of scroll
        if (currentScrollY <= 10) {
            setIsMinimized(false);
            lastScrollY.current = currentScrollY;
            scrollDirection.current = null;
            anchorScrollY.current = currentScrollY;
            return;
        }

        const delta = currentScrollY - lastScrollY.current;
        
        if (delta > 0) {
            // Scrolling down
            if (scrollDirection.current !== 'down') {
                scrollDirection.current = 'down';
                anchorScrollY.current = lastScrollY.current;
            }
            
            // If we have scrolled down by more than 30px from the anchor, minimize
            if (currentScrollY - anchorScrollY.current > 30) {
                setIsMinimized(true);
            }
        } else if (delta < 0) {
            // Scrolling up
            if (scrollDirection.current !== 'up') {
                scrollDirection.current = 'up';
                anchorScrollY.current = lastScrollY.current;
            }
        }

        lastScrollY.current = currentScrollY;
    }, []);

    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Helper to render premium inline SVG/CSS cards instead of static image links
    const renderCardMedia = (title: string, subtitle: string, Icon: React.ComponentType<{ className?: string }>, gradient: string) => {
        return (
            <div className={`w-full h-48 md:h-56 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center relative overflow-hidden shadow-inner`}>
                {/* Decorative background grid and blurs */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-black/20 rounded-full blur-2xl pointer-events-none" />
                
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg relative z-10">
                    <Icon className="w-10 h-10 text-white drop-shadow-md" />
                </div>
                <span className="text-white/80 text-[10px] font-extrabold uppercase tracking-widest mt-4 relative z-10 leading-none">{subtitle}</span>
                <span className="text-white text-lg font-black tracking-tight mt-1.5 relative z-10 leading-none">{title}</span>
            </div>
        );
    };

    // Map the static levelTiers data into TimeLine_01Entry format
    const mappedEntries: TimeLine_01Entry[] = levelTiers.map((tier, index) => {
        // Evaluate if user reached this tier
        let isReached = false;
        if (tier.levelRange.startsWith('Level ')) {
            const levelVal = parseInt(tier.levelRange.replace('Level ', ''));
            isReached = currentLevel >= levelVal;
        } else {
            const minLevel = parseInt(tier.levelRange.match(/\d+/)?.[0] || '0');
            isReached = currentLevel >= minLevel;
        }

        // Determine if this is the immediate next tier
        let isNext = false;
        if (!isReached) {
            if (index === 0) {
                isNext = true;
            } else {
                // Check if previous tier was reached
                const prevTier = levelTiers[index - 1];
                let prevReached = false;
                if (prevTier.levelRange.startsWith('Level ')) {
                    const prevVal = parseInt(prevTier.levelRange.replace('Level ', ''));
                    prevReached = currentLevel >= prevVal;
                } else {
                    const prevMin = parseInt(prevTier.levelRange.match(/\d+/)?.[0] || '0');
                    prevReached = currentLevel >= prevMin;
                }
                if (prevReached) {
                    isNext = true;
                }
            }
        }
        
        let statusText = '';
        if (isReached) {
            statusText = ' • Reached';
        } else if (isNext) {
            statusText = ' • Next Tier';
        }

        return {
            icon: tier.icon,
            title: tier.name,
            subtitle: `${tier.levelRange}${statusText}`,
            description: tier.description,
            items: tier.rewards.map(reward => ({
                ...reward,
                isReached,
                isNext
            })),
            image: renderCardMedia(tier.name, tier.levelRange, tier.icon, tier.gradient),
        };
    });

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.3)',
                            backdropFilter: 'blur(16px)',
                        }}
                    />

                    {/* Modal Content */}
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ 
                            type: 'spring', 
                            damping: 30, 
                            stiffness: 300
                        }}
                        className="relative w-full max-w-[680px] md:max-w-[850px] h-[90vh] sm:h-[85vh] max-h-[850px] bg-zinc-50 dark:bg-zinc-900 rounded-[24px] sm:rounded-[36px] shadow-3xl flex flex-col overflow-hidden border border-zinc-200/50 dark:border-zinc-800/60"
                    >
                        {/* Header */}
                        <motion.div 
                            animate={{
                                padding: isMinimized ? '12px 16px' : '16px 16px 8px 16px'
                            }}
                            className="relative border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-[24px] sm:rounded-t-[36px] shrink-0 z-10"
                        >
                            <motion.div 
                                animate={{ marginBottom: isMinimized ? '0px' : '24px' }}
                                className="flex items-start gap-3 sm:gap-4"
                            >
                                {/* Student Tools Style Header Card */}
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ 
                                        opacity: 1, 
                                        y: 0,
                                        padding: isMinimized ? '10px 12px' : '12px 16px',
                                        gap: isMinimized ? '10px' : '12px'
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                                    className="flex-1 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] sm:rounded-[24px] flex items-center group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 text-left"
                                >
                                    {/* SaaS Background Accents */}
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                    <motion.div
                                        animate={{
                                            width: isMinimized ? 40 : 48,
                                            height: isMinimized ? 40 : 48,
                                            borderRadius: isMinimized ? 12 : 14
                                        }}
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className="bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400 relative z-10"
                                    >
                                        <div className="hidden sm:flex">
                                            <Trophy size={24} />
                                        </div>
                                        <div className="flex sm:hidden">
                                            <Trophy size={24} />
                                        </div>
                                    </motion.div>
                                    
                                    <div className="relative z-10 flex-1 min-w-0 pr-2 sm:pr-4">
                                        <motion.h2 
                                            animate={{ fontSize: isMinimized ? '16px' : '20px' }}
                                            className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-0.5 sm:mb-1 truncate"
                                        >
                                            Level Journey
                                        </motion.h2>
                                        <motion.p 
                                            animate={{ fontSize: isMinimized ? '12px' : '13px' }}
                                            className="text-zinc-600 dark:text-zinc-400 leading-relaxed m-0"
                                        >
                                            Discover benefits, advantages, and rewards up to max level 100.
                                        </motion.p>
                                    </div>
                                    <div className="relative z-20 self-start">
                                        <motion.button
                                            onClick={onClose}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="flex-shrink-0 flex items-center justify-center rounded-lg sm:rounded-xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-2 text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                            aria-label="Close modal"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        {/* Scrollable Content */}
                        <div 
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent"
                        >
                            
                            {/* Current Status Box (SaaS Style) */}
                            <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] sm:rounded-[24px] p-4 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 shrink-0">
                                {/* SaaS Background Accents */}
                                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                {/* Left: Icon & Text */}
                                <div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full sm:w-auto">
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
                                        className="w-12 h-12 rounded-2xl sm:w-16 sm:h-16 sm:rounded-[20px] bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                                    >
                                        <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                                    </motion.div>
                                    
                                    <div>
                                        <p className="text-[10px] sm:text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1 sm:mb-1.5">Your Current Status</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">Level {currentLevel}</span>
                                            <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">/ Max Level 100</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Goal Card */}
                                <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                                    <div className="flex-1 sm:flex-none flex flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-200/80 dark:hover:border-emerald-800/50 group">
                                        <div className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0 border border-emerald-100 dark:border-emerald-800/50 transition-colors group-hover:bg-emerald-100">
                                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                                        </div>
                                        <div>
                                            <span className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-zinc-100 block mb-0.5">Next Tier Goal</span>
                                            <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 block leading-tight max-w-[200px] sm:max-w-[220px]">Unlock more exclusive avatar rewards & discounts</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tiers Timeline */}
                            <TimeLine_01 
                                entries={mappedEntries} 
                                title="" 
                                description="" 
                                className="py-0 pb-[25vh] md:pb-[35vh]" 
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default LevelJourneyModal;
