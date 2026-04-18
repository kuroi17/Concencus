import { Megaphone, MessagesSquare, Newspaper } from "lucide-react";

const channels = [
  {
    id: "announcements",
    label: "Announcements",
    icon: Megaphone,
    isActive: true,
  },
  {
    id: "chat",
    label: "Chats",
    icon: MessagesSquare,
    isActive: false,
  },
  {
    id: "forum",
    label: "Forum",
    icon: Newspaper,
    isActive: false,
  },
];

function AnnouncementChannelTabs() {
  return (
    <section className="rounded-[14px] border border-slate-200 bg-[#fbfcff] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Screen
          </p>
          <h2 className="m-0 mt-1 text-[1.45rem] font-semibold text-slate-900">
            Campus Broadcast
          </h2>
        </div>
        <p className="m-0 text-sm text-slate-500">Static Preview</p>
      </div>

      <nav
        className="mt-4 flex flex-wrap items-center gap-2"
        aria-label="Announcement channels"
      >
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <button
              key={channel.id}
              type="button"
              className={`inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
                channel.isActive
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={15} />
              <span>{channel.label}</span>
            </button>
          );
        })}
      </nav>
    </section>
  );
}

export default AnnouncementChannelTabs;
