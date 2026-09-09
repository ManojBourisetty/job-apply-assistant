import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Search,
  Sparkles,
  Bookmark,
  KanbanSquare,
  FileText,
  Wand2,
  Building2,
  ShieldCheck,
  Users,
  BarChart3,
  Settings,
  Sliders,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Job Discovery", href: "/jobs", icon: Search },
  { title: "Search Profiles", href: "/search-profiles", icon: Sliders },
  { title: "Recommended Jobs", href: "/recommended", icon: Sparkles },
  { title: "Saved Jobs", href: "/jobs?saved=true", icon: Bookmark },
  { title: "Application Tracker", href: "/applications", icon: KanbanSquare },
  { title: "Master Resume", href: "/resumes", icon: FileText },
  { title: "Resume Tailoring", href: "/tailoring", icon: Wand2 },
  { title: "Company Tracker", href: "/companies", icon: Building2 },
  { title: "Sponsorship Intelligence", href: "/sponsorship", icon: ShieldCheck },
  { title: "Recruiter Contacts", href: "/recruiters", icon: Users },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
];
