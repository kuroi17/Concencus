function MessageBubble({ message }) {
  const isOwn = message.type === "sent";

  return (
    <div className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      {!isOwn && (
        <div className="mt-1 h-8 w-8 shrink-0 rounded-[10px] bg-slate-800 text-center text-xs font-semibold leading-8 text-white">
          {message.avatar}
        </div>
      )}

      <div
        className={`max-w-[86%] sm:max-w-[72%] ${isOwn ? "text-right" : "text-left"}`}
      >
        <p className="m-0 text-[12px] text-slate-500">
          <span className="font-semibold text-slate-800">{message.sender}</span>{" "}
          {message.time}
        </p>
        <div
          className={`mt-1 inline-block px-3 py-2 text-sm leading-relaxed ${
            isOwn
              ? "rounded-[14px] bg-[#7f1d1d] text-white"
              : "rounded-[14px] border border-slate-200 bg-white text-slate-800"
          }`}
        >
          {message.text}
        </div>
      </div>

      {isOwn && (
        <div className="mt-1 h-8 w-8 shrink-0 rounded-[10px] bg-slate-700 text-center text-xs font-semibold leading-8 text-white">
          {message.avatar}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
