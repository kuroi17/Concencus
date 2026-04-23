# 🏛️ Concensus
### *Where Campus Voices Shape Governance*

> **Techofusion 2026 Hackathon Entry** — A campus-wide participatory governance platform designed to transform fragmented student engagement into structured, transparent, and SDG-aligned institutional change.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat-square&logo=socketdotio)](https://socket.io/)

---

## 📋 Table of Contents

- [Overview & Problem Statement](#-overview--problem-statement)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Component Architecture](#-component-architecture)
- [SDG Alignment](#-sdg-alignment)
- [Setup & Installation](#-setup--installation)
- [Project Structure](#-project-structure)

---

## 🎯 Overview & Problem Statement

**The Problem:** Campus communities often suffer from weak leadership commitment, fragmented student engagement, and a lack of transparent sustainability platforms. Students feel unheard, and administrators lack real-time data on the community's most pressing concerns.

**The Solution:** **Concensus** bridges the gap between the student body and campus administration. By integrating institutional announcements, a democratic governance forum, actionable student proposals, and real-time communication, Concensus creates a unified ecosystem for campus progression.

---

## ✨ Key Features

### 📢 1. Institutional Announcements
- **Categorized Feeds:** View crucial updates filtered by tags (Academic, Event, Governance) and priorities (Urgent, Important, FYI).
- **Rich Media Support:** Multi-image uploads via Supabase Storage with fullscreen lightbox capabilities.
- **Masonry Layout:** Visually engaging card layout that automatically adjusts to content size.

### 🏛️ 2. Governance Forum (New!)
- **Democratic Discourse:** Upvoting/downvoting system (`VoteWidget`) to elevate the most important discussions.
- **Nested Threaded Comments:** Deep, structured conversations via `CommentSection` and `CommentItem`.
- **Safe Engagement:** Option for anonymous posting to protect student identities while encouraging honest feedback.

### 📝 3. Participatory Proposals (New!)
- **Actionable Governance:** Students can submit actionable proposals categorized by SDG alignment.
- **Transparent Tracking:** Track proposal statuses from *Under Review* ➡️ *Approved* ➡️ *Implemented* ➡️ *Rejected*.
- **Official Admin Responses:** Administrators can directly reply to proposals, establishing accountability and trust.

### 💬 4. Real-Time Communications (DMs)
- **Instant Messaging:** Powered by Socket.IO for real-time, optimistic UI updates without page refreshes.
- **Rich Interactions:** Support for image sharing, emoji reactions, and live connection status indicators.

### 📊 5. SDG Impact Dashboard
- **Live Metrics:** Real-time data visualization of campus-wide SDG impact using Recharts.
- **Impact Leaders:** Tracks and displays the most active contributors driving sustainable goals on campus.

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 (Functional Components & Hooks)
- Vite (Next-generation frontend tooling)
- Tailwind CSS (Utility-first styling)
- Recharts (Data visualization)
- React Router DOM (Navigation)

**Backend & Real-time:**
- Node.js & Express (Socket.IO server)
- Socket.IO Client/Server (Real-time events)

**BaaS (Backend-as-a-Service):**
- Supabase (PostgreSQL Database, Authentication, Row Level Security, Object Storage)

---

## 🏗️ Component Architecture

Concencus is built with a highly modular, scalable React architecture consisting of ~35 distinct components categorized into 6 core modules:

1. **Announcements Module:** `AnnouncementBoard`, `AnnouncementCard`, `CreateAnnouncementModal`, `AnnouncementDetailModal`, `AnnouncementSidebar`.
2. **Governance Forum Module:** `ForumBoard`, `ForumThread`, `VoteWidget`, `CommentSection`, `CommentItem`, `CreatePostModal`.
3. **Participatory Proposals Module:** `ProposalBoard`, `ProposalCard`, `CreateProposalModal`, `ProposalsSidebar`.
4. **SDG Dashboard Module:** `SDGImpactDashboard` (Dynamic charts computing real-time metrics).
5. **Real-time Chat Module:** `ConversationListPanel`, `ChatThread`, `ChatWidget`, `MessageBubble`, `MessageComposer`.
6. **Core & Profile Module:** `MainLayout`, `OnboardingModal`, `EditProfileModal`, and Reusable UI (`TabSwitcher`, `SDGBadge`, `ImageDropzone`).

---

## 🌍 SDG Alignment

Concencus is directly aligned with the United Nations Sustainable Development Goals:
- **Target 4 (Quality Education):** Facilitating better communication between educators and students.
- **Target 16 (Peace, Justice, and Strong Institutions):** Building transparent, accountable, and inclusive campus governance through public proposals and forums.
- **Target 17 (Partnerships for the Goals):** Creating a unified digital hub for organizations and administrative bodies to collaborate.

---

## 🚀 Setup & Installation

### 1. Prerequisites
- Node.js 20+ (LTS recommended)
- npm (included with Node.js)
- Git
- Supabase account + project

### 2. Clone & Install
```bash
git clone [https://github.com/kuroi17/Concencus.git](https://github.com/kuroi17/Concencus.git)
cd Concencus

# Install all workspace dependencies
npm install
