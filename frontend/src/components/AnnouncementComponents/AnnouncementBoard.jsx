import AnnouncementCard from "./AnnouncementCard";

const announcementItems = [
  {
    id: "a-101",
    title: "Revised Enrollment Timeline for Midyear Intake",
    unit: "Registrar",
    author: "Enrollment Team",
    postedAt: "Apr 19, 2026",
    tag: "Academic",
    priority: "High",
    layout: "feature",
    delay: 30,
    excerpt:
      "Enrollment windows were adjusted to reduce queue congestion. Submission cutoffs and validation checkpoints are now aligned by department.",
  },
  {
    id: "a-102",
    title: "CICS Lab B: Weekend Network Maintenance",
    unit: "CICS IT Services",
    author: "Infra Desk",
    postedAt: "Apr 18, 2026",
    tag: "Operations",
    priority: "Notice",
    layout: "tall",
    delay: 90,
    excerpt:
      "Access to Lab B systems may be intermittent from Saturday 8:00 PM to Sunday 4:00 AM while core switches are upgraded.",
  },
  {
    id: "a-103",
    title: "Call for Student Org Compliance Updates",
    unit: "Student Affairs",
    author: "Org Relations",
    postedAt: "Apr 17, 2026",
    tag: "Admin",
    priority: "Action",
    layout: "standard",
    delay: 130,
    excerpt:
      "Recognized organizations are requested to submit officer rosters and financial activity summaries for this term.",
  },
  {
    id: "a-104",
    title: "Department Townhall Schedule Released",
    unit: "College Office",
    author: "Office of the Dean",
    postedAt: "Apr 17, 2026",
    tag: "Events",
    priority: "Update",
    layout: "wide",
    delay: 180,
    excerpt:
      "Townhall sessions will run in two waves per department to accommodate class schedules and open Q&A segments.",
  },
  {
    id: "a-105",
    title: "Library Access Rules for Finals Period",
    unit: "Academic Support",
    author: "Library Desk",
    postedAt: "Apr 16, 2026",
    tag: "Policy",
    priority: "Notice",
    layout: "standard",
    delay: 220,
    excerpt:
      "Extended seating zones and booking limits are active. Group room reservations now prioritize capstone project teams.",
  },
  {
    id: "a-106",
    title: "Scholarship Interview Panel Assignment",
    unit: "Scholarship Unit",
    author: "Program Secretariat",
    postedAt: "Apr 15, 2026",
    tag: "Scholarship",
    priority: "Action",
    layout: "tall",
    delay: 260,
    excerpt:
      "Qualified applicants should check panel room assignments and arrive 20 minutes early with complete verification documents.",
  },
  {
    id: "a-107",
    title: "Emergency Drill Briefing for Academic Buildings",
    unit: "Campus Safety",
    author: "Emergency Office",
    postedAt: "Apr 14, 2026",
    tag: "Safety",
    priority: "High",
    layout: "standard",
    delay: 310,
    excerpt:
      "The coordinated drill includes evacuation mapping for lecture halls, laboratories, and support offices.",
  },
];

function AnnouncementBoard() {
  return (
    <section className="soft-enter pb-2" aria-label="Announcement board">
      <div className="mb-3 flex items-center justify-between pb-4">
        <h2 className="m-0 text-base font-semibold text-slate-900 sm:text-lg">
          Announcement Board
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:auto-rows-[108px] sm:grid-cols-8 xl:grid-cols-12">
        {announcementItems.map((item) => (
          <AnnouncementCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export default AnnouncementBoard;
