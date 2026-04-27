import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bnitxfikghljftepsult.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaXR4ZmlrZ2hsamZ0ZXBzdWx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUyNDk5OSwiZXhwIjoyMDkyMTAwOTk5fQ.wl3-8MZ1_5-GUoTk6gUd2eMXYUhqBhrfK3GpAUmqqKs";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// The CICS channel (main channel with existing proposals)
const CHANNEL_ID = "786b6830-c10d-4086-b2bf-d9a846dd9516";
const AUTHOR_ID  = "ca97f3b0-9a2e-41a3-990e-f00c55988147";

const STATUSES = ["Under Review", "Approved", "Implemented", "Rejected"];
const CATEGORIES = ["Academic", "Facilities", "Policy"];

const proposals = [
  {
    title: "Extend Computer Lab Access to Weekends",
    description:
      "Many students struggle to finish their programming requirements during weekdays due to overlapping class schedules. I propose that the computer laboratories in the CICS building be made accessible on Saturdays from 8:00 AM to 5:00 PM under the supervision of a lab assistant. This would greatly help students who need additional time to complete their projects and practice their coding skills outside of class hours.",
    category: "Facilities",
    sdg_tags: [4, 9],
    status: "Under Review",
    is_anonymous: false,
    upvotes_count: 47,
    downvotes_count: 3,
  },
  {
    title: "Introduce Peer Tutoring Program for Core CS Subjects",
    description:
      "A structured peer tutoring program would benefit students struggling with foundational subjects like Data Structures, Algorithms, and Discrete Mathematics. I suggest creating a system where academically excellent upper-year students can volunteer as tutors, receiving course credit or a certificate of recognition. Sessions could be held weekly in available classrooms or online through the platform.",
    category: "Academic",
    sdg_tags: [4, 17],
    status: "Approved",
    is_anonymous: false,
    upvotes_count: 82,
    downvotes_count: 5,
  },
  {
    title: "Mandatory Industry Immersion Before Graduation",
    description:
      "To better prepare graduating students for the real-world tech industry, I propose making a minimum 200-hour industry immersion or internship mandatory for all BS Computer Science and BS IT students. This would ensure graduates have practical experience beyond their academic training, improving their employability and the college's reputation in the industry.",
    category: "Policy",
    sdg_tags: [8, 9, 4],
    status: "Under Review",
    is_anonymous: false,
    upvotes_count: 61,
    downvotes_count: 12,
  },
  {
    title: "Install Ergonomic Chairs in Laboratory Rooms",
    description:
      "Students spend an average of 4–6 hours per day in laboratory settings working on tasks that require prolonged sitting. The current chairs cause significant discomfort and have led to health issues among students. I propose replacing the old chairs with ergonomic alternatives to improve posture, reduce fatigue, and create a healthier learning environment.",
    category: "Facilities",
    sdg_tags: [3],
    status: "Implemented",
    is_anonymous: true,
    upvotes_count: 109,
    downvotes_count: 2,
  },
  {
    title: "Open-Source Textbook Initiative",
    description:
      "Textbook costs are a significant financial burden for students, especially those enrolled in programming and mathematics-heavy programs. This proposal advocates for the CICS faculty to adopt and recommend open-source or freely available textbooks such as those from OpenStax for subjects where premium textbooks are currently required. This would reduce educational costs without compromising quality.",
    category: "Academic",
    sdg_tags: [4, 10],
    status: "Under Review",
    is_anonymous: false,
    upvotes_count: 55,
    downvotes_count: 6,
  },
  {
    title: "Dedicated Student Lounge for CICS Students",
    description:
      "CICS currently lacks a dedicated space where students can relax, collaborate, or work on group projects outside of formal class settings. I propose converting the unused room on the 3rd floor of the CICS building into a student lounge equipped with comfortable seating, whiteboards, and reliable Wi-Fi. This would foster a stronger sense of community among students.",
    category: "Facilities",
    sdg_tags: [11, 16],
    status: "Under Review",
    is_anonymous: false,
    upvotes_count: 73,
    downvotes_count: 7,
  },
  {
    title: "Annual Hackathon Organized by Student Government",
    description:
      "I propose that the CICS Student Government organize an annual inter-department hackathon open to all CICS students. The event would challenge students to build solutions for real-world problems within 24 to 48 hours, simulating actual industry sprints. Winning teams should be supported to represent the college in regional and national competitions.",
    category: "Academic",
    sdg_tags: [9, 17],
    status: "Approved",
    is_anonymous: false,
    upvotes_count: 95,
    downvotes_count: 4,
  },
  {
    title: "Mental Health Day Policy — No Examinations",
    description:
      "Given the increasing prevalence of student burnout, anxiety, and depression within the department, I propose that CICS officially designate at least one mental health day per semester during which no examinations or major deadlines are allowed. This would signal to students that the institution values their well-being and supports psychological health alongside academic achievement.",
    category: "Policy",
    sdg_tags: [3, 4],
    status: "Under Review",
    is_anonymous: true,
    upvotes_count: 134,
    downvotes_count: 9,
  },
  {
    title: "Mandatory Cybersecurity Awareness Module",
    description:
      "In an age of increasing cyber threats, it is alarming that many students are unaware of basic digital safety practices. I propose adding a mandatory one-unit cybersecurity awareness module to the curriculum for all CICS freshmen. The module should cover password hygiene, phishing detection, data privacy, and safe browsing, taught by faculty or invited industry practitioners.",
    category: "Academic",
    sdg_tags: [9, 16],
    status: "Under Review",
    is_anonymous: false,
    upvotes_count: 41,
    downvotes_count: 3,
  },
  {
    title: "Student-Managed GitHub Organization for Projects",
    description:
      "I propose establishing an official CICS GitHub organization where students can publish and collaborate on academic projects. This would serve as a portfolio platform managed by the student organization, allowing faculty to review student work transparently and enabling students to build a professional digital presence early in their academic careers.",
    category: "Academic",
    sdg_tags: [9, 17],
    status: "Approved",
    is_anonymous: false,
    upvotes_count: 88,
    downvotes_count: 1,
  },
  {
    title: "Repair and Upgrade Projectors in Lecture Halls",
    description:
      "Several projectors in the main lecture halls are outdated, frequently malfunction, or display poor image quality, disrupting lessons and wasting valuable class time. I propose a systematic audit of all audio-visual equipment, followed by the repair or replacement of non-functional units, and the upgrade of outdated projectors to modern full-HD models.",
    category: "Facilities",
    sdg_tags: [4, 9],
    status: "Rejected",
    is_anonymous: false,
    upvotes_count: 29,
    downvotes_count: 14,
  },
  {
    title: "Flexible Grading Policy for Research-Focused Subjects",
    description:
      "Research subjects often require different timelines and unpredictable workloads compared to traditional coursework. This proposal requests that faculty teaching capstone and thesis subjects adopt a more flexible grading framework that evaluates continuous progress rather than rigid semester-end deliverables. Milestone-based grading would reduce student pressure and improve research quality.",
    category: "Policy",
    sdg_tags: [4],
    status: "Under Review",
    is_anonymous: true,
    upvotes_count: 50,
    downvotes_count: 8,
  },
  {
    title: "Subsidized Student Tech Bundle Program",
    description:
      "Not all students can afford the hardware and software required for advanced programming and design courses. I propose partnering with local technology suppliers to offer subsidized laptops, peripherals, and licensed software bundles to enrolled CICS students through an installment payment scheme facilitated by the college. This will level the playing field and ensure no student is left behind due to economic constraints.",
    category: "Policy",
    sdg_tags: [10, 4, 8],
    status: "Under Review",
    is_anonymous: false,
    upvotes_count: 117,
    downvotes_count: 6,
  },
  {
    title: "Establish a CICS Alumni Mentorship Network",
    description:
      "Connecting current students with alumni who are now working professionals would provide invaluable career guidance, industry insight, and networking opportunities. I propose that the student government create a formal mentorship matching platform where alumni volunteer to guide students in career planning, resume building, and technical interview preparation.",
    category: "Academic",
    sdg_tags: [8, 17],
    status: "Approved",
    is_anonymous: false,
    upvotes_count: 76,
    downvotes_count: 2,
  },
  {
    title: "Noise Policy for Study Areas in the CICS Building",
    description:
      "The library and designated study areas within the CICS building are often disrupted by noise, making it difficult for students to focus. I propose implementing and enforcing a clear noise policy in these areas, including the installation of quiet zone signage and the assignment of a student monitor during peak hours to ensure a productive study environment.",
    category: "Policy",
    sdg_tags: [11],
    status: "Implemented",
    is_anonymous: true,
    upvotes_count: 63,
    downvotes_count: 10,
  },
  {
    title: "Recognition Program for Academically Excellent Students",
    description:
      "A formal departmental recognition program would motivate students to strive for excellence. I propose that CICS establish a quarterly academic achievement recognition list distinct from the university's Dean's List, which would include awards for top performers in specific subject areas such as programming, mathematics, and research. Recipients should receive certificates and small incentives.",
    category: "Academic",
    sdg_tags: [4],
    status: "Under Review",
    is_anonymous: false,
    upvotes_count: 44,
    downvotes_count: 5,
  },
  {
    title: "AI Ethics Module in Computer Science Curriculum",
    description:
      "As artificial intelligence becomes deeply embedded in society, computer science students must be prepared to think critically about the ethical implications of the systems they build. I propose incorporating a dedicated AI ethics module into the curriculum covering topics such as algorithmic bias, data privacy, surveillance technology, and responsible AI development.",
    category: "Academic",
    sdg_tags: [9, 16, 4],
    status: "Under Review",
    is_anonymous: false,
    upvotes_count: 99,
    downvotes_count: 7,
  },
  {
    title: "Better Ventilation in Laboratory 301",
    description:
      "Laboratory 301 has consistently poor air circulation, especially during summer months when the temperature inside becomes unbearable. Multiple students have reported headaches and difficulty concentrating during extended lab sessions. I urge the administration to inspect and repair the ventilation system or install additional air conditioning units before the next semester begins.",
    category: "Facilities",
    sdg_tags: [3, 13],
    status: "Approved",
    is_anonymous: true,
    upvotes_count: 86,
    downvotes_count: 1,
  },
  {
    title: "Digital Submission Portal for All Student Requirements",
    description:
      "The current inconsistency across departments regarding how student requirements are submitted — some through email, others through physical copies, and others through various apps — creates unnecessary confusion and inefficiency. I propose that CICS adopt a unified digital submission portal integrated with the current student information system for all academic requirements.",
    category: "Policy",
    sdg_tags: [9, 16],
    status: "Under Review",
    is_anonymous: false,
    upvotes_count: 68,
    downvotes_count: 4,
  },
  {
    title: "Regular Town Halls Between Faculty and Students",
    description:
      "Open communication between faculty and students is crucial for a healthy academic environment. I propose that CICS conduct quarterly town hall meetings where students can raise concerns, give feedback, and collaborate with faculty on academic policy changes. These meetings should be facilitated by the student government and have structured agenda points to ensure productive dialogue.",
    category: "Policy",
    sdg_tags: [16, 17],
    status: "Approved",
    is_anonymous: false,
    upvotes_count: 91,
    downvotes_count: 3,
  },
];

async function seed() {
  const now = new Date();
  const rows = proposals.map((p, i) => {
    // Stagger created_at timestamps over the past 60 days for variety
    const daysAgo = Math.floor(Math.random() * 60);
    const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    return {
      ...p,
      channel_id: CHANNEL_ID,
      author_id: AUTHOR_ID,
      created_at: createdAt,
    };
  });

  const { data, error } = await supabase.from("proposals").insert(rows).select("id, title");
  if (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
  console.log(`✅ Inserted ${data.length} proposals:`);
  data.forEach((d, i) => console.log(`  ${i + 1}. [${d.id}] ${d.title}`));
}

seed();
