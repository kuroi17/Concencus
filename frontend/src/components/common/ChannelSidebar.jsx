import { createPortal } from 'react-dom';

import { useState } from 'react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    BookOpen,
    LayoutGrid,
    Users,
    Plus,
    Pencil,
    Trash2,
    X,
} from 'lucide-react';
import { useChannel } from '../../context/useChannel';
import { useUser } from '../../context/UserContext';
import SidebarLogoutAction from '../../common/SidebarLogoutAction';
import { useNavigate } from 'react-router-dom';
import ChannelFormModal from './ChannelFormModal';
import CategoryFormModal from './CategoryFormModal';

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
                    className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-110 active:scale-95 dark:bg-slate-100 dark:text-slate-900"
                    aria-label="Expand sidebar"
                >
                    <ChevronRight size={18} />
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
                className="flex h-full flex-col bg-white/80 dark:bg-slate-950/90 px-4 py-6 backdrop-blur-xl transition-all duration-300"
                aria-label="Channel sidebar"
            >
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <h2 className="m-0 text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
                            Channels
                        </h2>
                        <div className="flex items-center gap-1">
                            {/* Mobile Close Button */}
                            <button
                                onClick={onCloseMobile}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 lg:hidden"
                                aria-label="Close menu"
                            >
                                <X size={16} />
                            </button>

                            {/* Add category — disabled for now */}
                            {/* {isAdmin && (
                                <button
                                onClick={() => setCategoryModal({ mode: "create" })}
                                className="hidden lg:flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all"
                                title="Add category"
                                >
                                <Plus size={15} />
                                </button>
                            )} */}

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
                    <div className="mt-2 h-1 w-8 rounded-full bg-[#800000]" />
                </div>

                {/* Category accordion */}
                <nav className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
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

                <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <SidebarLogoutAction />
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
