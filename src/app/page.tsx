import { DashboardShell } from "@/components/dashboard/DashboardShell";

// The dashboard is a client island; the route stays a thin server component.
export default function Page() {
  return <DashboardShell />;
}
