import { createPortal } from 'react-dom';
import { useState } from 'react';
import {
    ChevronDown, ChevronLeft, ChevronRight,
    GraduationCap, BookOpen, LayoutGrid, Users,
    Plus, Pencil, Trash2, X,
} from 'lucide-react';
import { useChannel } from '../../context/useChannel';
import { useUser } from '../../context/UserContext';
import SidebarLogoutAction from '../../common/SidebarLogoutAction';
import { useNavigate } from 'react-router-dom';
import ChannelFormModal from './ChannelFormModal';
import CategoryFormModal from './CategoryFormModal';
import ConcensusLogo from './ConcensusLogo';

const categoryIcons = {
    colleges: GraduationCap,
    programs: BookOpen,
    blocks: LayoutGrid,
    organizations: Users,
};

const categoryAccent = {
    colleges: 'text-violet-600',
    programs: 'text-sky-600',
    blocks: 'text-emerald-600',
    organizations: 'text-amber-600',
};

function ChannelSidebar({
    collapsed = false,
    onCollapseChange,
    onCloseMobile,
}) {
    const {
        categories,
        currentChannel,
        setCurrentChannel,
        loadingChannels,
        createChannel,
        updateChannel,
        deleteChannel,
        createCategory,
    } = useChannel();
    const { profile, isAdmin } = useUser();
    const navigate = useNavigate();

    const [openCategories, setOpenCategories] = useState(() =>
        Object.fromEntries(
            ['colleges', 'programs', 'blocks', 'organizations'].map((id) => [
                id,
                true,
            ]),
        ),
    );

    const [channelModal, setChannelModal] = useState(null);
    const [categoryModal, setCategoryModal] = useState(null);

    const toggleCategory = (id) =>
        setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));

    const toggleCollapse = () => {
        if (onCollapseChange) onCollapseChange(!collapsed);
    };

    const handleDeleteChannel = async (e, ch) => {
        e.stopPropagation();
        if (!window.confirm(`Delete "${ch.name}"? This cannot be undone.`))
            return;
        await deleteChannel(ch.id);
    };

    // ── Collapsed view ────────────────────────────────────────────
    if (collapsed) {
        return (
            <aside
                className="hidden lg:flex flex-col items-center border-r border-slate-200/60 bg-white/80 dark:border-slate-800/60 dark:bg-slate-950/90 py-6 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:overflow-x-hidden no-scrollbar transition-all duration-300"
                aria-label="Channel sidebar (collapsed)"
            >
                    <button
                        type="button"
                        onClick={toggleCollapse}
                        className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-md ring-1 ring-slate-200 dark:ring-slate-700 transition-all hover:scale-110 active:scale-95"
                        aria-label="Expand sidebar"
                    >
                        <ConcensusLogo size={28} className="rounded-lg" />
                    </button>

                <nav className="flex flex-1 flex-col items-center gap-4">
                    {loadingChannels ? (
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-10 w-10 animate-pulse rounded-xl bg-slate-200/60 dark:bg-slate-800/60"
                                />
                            ))}
                        </div>
                    ) : (
                        categories.map((category) => {
                            const Icon = categoryIcons[category.id] ?? Users;
                            const hasActiveChild = category.channels.some(
                                (ch) => currentChannel?.id === ch.id,
                            );
                            return (
                                <div
                                    key={category.id}
                                    className="relative group"
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (category.channels.length > 0) {
                                                if (onCloseMobile)
                                                    onCloseMobile();
                                                setCurrentChannel(
                                                    category.channels[0],
                                                );
                                                navigate('/hub');
                                            }
                                        }}
                                        className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 ${
                                            hasActiveChild
                                                ? 'bg-[#800000] text-white shadow-lg shadow-red-900/20'
                                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                        title={category.label}
                                    >
                                        <Icon size={20} />
                                    </button>
                                    <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white dark:text-slate-900 opacity-0 shadow-xl transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100">
                                        {category.label}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </nav>

                <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-3">
                    <SidebarLogoutAction compact />
                </div>
            </aside>
        );
    }

    // ── Expanded view ─────────────────────────────────────────────
    return (
        <>
            <aside
                className="flex h-full max-h-screen sticky top-0 flex-col bg-white/90 dark:bg-slate-950/95 px-4 py-5 backdrop-blur-xl transition-all duration-300 border-r border-slate-200/60 dark:border-slate-800/60"
                aria-label="Channel sidebar"
            >
                {/* ── Brand header ─────────────────────────────── */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        {/* Logo + wordmark */}
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white dark:bg-slate-800 shadow-md ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
                                <ConcensusLogo size={26} />
                            </div>
                            <div>
                                <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">Concensus</span>
                                <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-[#800000] to-transparent mt-0.5" />
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={onCloseMobile}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 lg:hidden"
                                aria-label="Close menu"
                            >
                                <X size={16} />
                            </button>
                            {onCollapseChange && (
                                <button
                                    type="button"
                                    onClick={toggleCollapse}
                                    className="hidden lg:flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-all"
                                    aria-label="Collapse sidebar"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Channel label */}
                    <div className="mt-5 flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Channels</span>
                        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                    </div>
                </div>

                {/* Category accordion */}
                <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
                    {loadingChannels ? (
                        <div className="space-y-6 px-1">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="h-3 w-20 animate-pulse rounded bg-slate-200/60 dark:bg-slate-800/60" />
                                    {[...Array(2)].map((__, j) => (
                                        <div
                                            key={j}
                                            className="h-9 w-full animate-pulse rounded-xl bg-slate-100/60 dark:bg-slate-800/60"
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : (
                        categories.map((category) => {
                            const Icon = categoryIcons[category.id] ?? Users;
                            const isOpen = openCategories[category.id] ?? true;

                            return (
                                <section
                                    key={category.id}
                                    className="space-y-2"
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleCategory(category.id)
                                        }
                                        className="flex w-full items-center justify-between px-1 py-1 text-left"
                                        aria-expanded={isOpen}
                                    >
                                        <span
                                            className={`flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isOpen ? categoryAccent[category.id] || 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}
                                        >
                                            <Icon size={14} />
                                            {category.label}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {isAdmin && (
                                                <span className="relative group/add">
                                                    <span
                                                        role="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setChannelModal({
                                                                mode: 'create',
                                                                category:
                                                                    category.id,
                                                            });
                                                        }}
                                                        className="inline-flex items-center justify-center rounded-lg w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-teal-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        <Plus size={12} />
                                                    </span>
                                                    <span className="pointer-events-none absolute right-0 top-full z-50 mt-1.5 whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-white dark:text-slate-900 opacity-0 shadow-lg transition-all duration-200 group-hover/add:opacity-100 translate-y-1 group-hover/add:translate-y-0">
                                                        Add Channel
                                                    </span>
                                                </span>
                                            )}
                                            <ChevronDown
                                                size={12}
                                                className={`text-slate-300 dark:text-slate-600 transition-transform duration-300 ${isOpen ? '' : '-rotate-90'}`}
                                            />
                                        </div>
                                    </button>
                                    {isOpen && (
                                        <ul className="space-y-1" role="list">
                                            {category.channels.map((ch) => {
                                                const isActive =
                                                    currentChannel?.id ===
                                                    ch.id;
                                                return (
                                                    <li
                                                        key={ch.id}
                                                        className="group/item"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (
                                                                    onCloseMobile
                                                                )
                                                                    onCloseMobile();
                                                                setCurrentChannel(
                                                                    ch,
                                                                );
                                                                navigate(
                                                                    '/hub',
                                                                );
                                                            }}
                                                            className={`relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition-all duration-300 overflow-hidden ${
                                                                isActive
                                                                    ? 'bg-[#800000] text-white shadow-lg shadow-red-900/20 ring-1 ring-[#800000]'
                                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                                            }`}
                                                            aria-current={
                                                                isActive
                                                                    ? 'page'
                                                                    : undefined
                                                            }
                                                            title={ch.name}
                                                        >
                                                            <span
                                                                className={`truncate transition-all duration-200 ${isAdmin ? 'group-hover/item:mr-14' : ''} ${isActive ? 'font-bold' : 'font-semibold'}`}
                                                            >
                                                                {ch.name}
                                                            </span>

                                                            {isActive && (
                                                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] group-hover/item:hidden" />
                                                            )}

                                                            {isAdmin && (
                                                                <span
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    <span
                                                                        role="button"
                                                                        onClick={() =>
                                                                            setChannelModal(
                                                                                {
                                                                                    mode: 'edit',
                                                                                    channel:
                                                                                        ch,
                                                                                },
                                                                            )
                                                                        }
                                                                        className="rounded-lg p-1.5 hover:text-sky-400 hover:bg-black/10 transition-colors"
                                                                        title="Edit channel"
                                                                    >
                                                                        <Pencil
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                    </span>
                                                                    <span
                                                                        role="button"
                                                                        onClick={(
                                                                            e,
                                                                        ) =>
                                                                            handleDeleteChannel(
                                                                                e,
                                                                                ch,
                                                                            )
                                                                        }
                                                                        className="rounded-lg p-1.5 hover:text-red-400 hover:bg-black/10 transition-colors"
                                                                        title="Delete channel"
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </section>
                            );
                        })
                    )}
                </nav>

                {/* ── User mini-card ───────────────────────────── */}
                <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-slate-900 px-3 py-2.5">
                        {/* Avatar */}
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="avatar" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
                        ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#800000] to-[#b00000] text-xs font-black text-white">
                                {profile?.full_name?.split(" ").slice(0,2).map(w => w[0]).join("") || "ME"}
                            </div>
                        )}
                        {/* Info */}
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{profile?.full_name || "User"}</p>
                            <span className="inline-block rounded-md bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#800000] dark:text-red-400">
                                {profile?.campus_role || "student"}
                            </span>
                        </div>
                        {/* Logout */}
                        <SidebarLogoutAction compact />
                    </div>
                </div>
            </aside>

            {/* Modals */}
            {channelModal &&
                createPortal(
                    <ChannelFormModal
                        initial={
                            channelModal.mode === 'edit'
                                ? channelModal.channel
                                : null
                        }
                        fixedCategory={
                            channelModal.mode === 'create'
                                ? channelModal.category
                                : null
                        }
                        categories={categories}
                        onSave={async (data) => {
                            if (channelModal.mode === 'create') {
                                await createChannel({
                                    ...data,
                                    category: channelModal.category,
                                });
                            } else {
                                await updateChannel(
                                    channelModal.channel.id,
                                    data,
                                );
                            }
                            setChannelModal(null);
                        }}
                        onClose={() => setChannelModal(null)}
                    />,
                    document.body,
                )}

            {categoryModal &&
                createPortal(
                    <CategoryFormModal
                        initial={null}
                        onSave={async (data) => {
                            await createCategory(data);
                            setCategoryModal(null);
                        }}
                        onClose={() => setCategoryModal(null)}
                    />,
                    document.body,
                )}
        </>
    );
}

export default ChannelSidebar;
