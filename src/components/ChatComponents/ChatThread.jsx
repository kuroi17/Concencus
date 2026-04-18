import { Users } from "lucide-react";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";

const messages = [
  {
    id: "m-01",
    sender: "Prof. M. Vance",
    time: "09:15 AM",
    type: "received",
    avatar: "MV",
    text: "I reviewed the latest structural report from engineering. The foundation work required for the west wing is more extensive than projected in the baseline budget.",
  },
  {
    id: "m-02",
    sender: "Dr. A. Sterling",
    time: "10:02 AM",
    type: "sent",
    avatar: "AS",
    text: "Understood. I will flag this for the Finance Committee and request the revised estimate before Thursday's plenary session.",
  },
  {
    id: "m-03",
    sender: "E. Chen",
    time: "10:45 AM",
    type: "received",
    avatar: "EC",
    text: "Any variance over 15% triggers the addendum process per statute 4.B. I can draft the preliminary notice this afternoon.",
  },
];

function ChatThread() {
  return (
    <section className="space-y-4" aria-label="Chat thread">
      <header className="soft-enter flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="m-0 text-[2.1rem] font-semibold leading-tight text-slate-900">
            # Block A: Infrastructure Planning
          </h2>
          <p className="m-0 mt-1 text-sm text-slate-600">
            Discussion thread regarding Q3 resource allocation for the physical
            sciences annex renovation.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
          <Users size={13} />
          14 Participants
        </span>
      </header>

      <div className="space-y-4 py-1">
        <p className="m-0 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Today, Oct 24
        </p>

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        <div className="ml-10 border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 sm:ml-12 sm:max-w-[420px]">
          <p className="m-0 font-medium">West_Wing_Structural_Assess_v2.pdf</p>
          <p className="m-0 mt-0.5 text-xs text-slate-500">
            4.2 MB • Uploaded 09:15 AM
          </p>
        </div>

        <p className="m-0 text-sm italic text-slate-500">
          Dr. A. Sterling pinned West_Wing_Structural_Assess_v2.pdf to this
          channel.
        </p>
      </div>

      <MessageComposer />
    </section>
  );
}

export default ChatThread;
