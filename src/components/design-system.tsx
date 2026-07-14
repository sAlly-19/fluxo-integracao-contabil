import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { AnimatedGroup, AnimatedItem, AnimatedPage } from "./animate-ui/motion";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Landmark,
  Calendar,
  Check,
  X,
  Building2,
  Download,
  FileText,
  History,
  Link2,
  Moon,
  Plus,
  Search,
  Settings,
  FileSpreadsheet,
  Sparkles,
  Sun,
  Table,
  Upload,
  Shield,
  Trash2,
  LayoutDashboard,
  Home,
  LogOut,
  MessageSquare
} from "lucide-react";

export type AppIconName =
  | "activity"
  | "alert"
  | "arrow"
  | "bank"
  | "calendar"
  | "check"
  | "close"
  | "company"
  | "download"
  | "file"
  | "history"
  | "link"
  | "moon"
  | "plus"
  | "search"
  | "settings"
  | "sheet"
  | "spark"
  | "sun"
  | "table"
  | "upload"
  | "shield"
  | "trash"
  | "dashboard"
  | "home"
  | "logout"
  | "message-square";

const iconMap: Record<AppIconName, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  alert: AlertTriangle,
  arrow: ArrowRight,
  bank: Landmark,
  calendar: Calendar,
  check: Check,
  close: X,
  company: Building2,
  download: Download,
  file: FileText,
  history: History,
  link: Link2,
  moon: Moon,
  plus: Plus,
  search: Search,
  settings: Settings,
  sheet: FileSpreadsheet,
  spark: Sparkles,
  sun: Sun,
  table: Table,
  upload: Upload,
  shield: Shield,
  trash: Trash2,
  dashboard: LayoutDashboard,
  home: Home,
  logout: LogOut,
  "message-square": MessageSquare
};

export function AppIcon({ className, name }: { className?: string; name: AppIconName }) {
  const IconComponent = iconMap[name] || Sparkles;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-md text-[0.95rem] leading-none transition-all",
        className
      )}
    >
      <IconComponent className="size-4 block" />
    </span>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20">
        <Sparkles className="size-5 text-white" />
        <div className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-indigo-400 animate-pulse" />
      </div>
      <div className="flex flex-col">
        <span className="font-sans text-base font-bold tracking-tight text-foreground leading-none">Fluxo</span>
        <span className="font-sans text-[10px] font-semibold text-muted-foreground tracking-wider uppercase mt-1 leading-none">INTEGRAÇÃO</span>
      </div>
    </div>
  );
}

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <AnimatedPage className={cn("mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8", className)}>{children}</AnimatedPage>;
}

export function PageHeader({
  actions,
  badge,
  description,
  title
}: {
  actions?: ReactNode;
  badge?: string;
  description?: ReactNode;
  title: string;
}) {
  return (
    <AnimatedGroup className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <AnimatedItem className="max-w-3xl">
        {badge ? (
          <Badge className="mb-3 rounded-full px-3 py-1" variant="secondary">
            {badge}
          </Badge>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h1>
        {description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </AnimatedItem>
      {actions ? <AnimatedItem className="flex shrink-0 flex-wrap items-center gap-2">{actions}</AnimatedItem> : null}
    </AnimatedGroup>
  );
}

export function MetricCard({
  description,
  icon,
  label,
  value
}: {
  description?: string;
  icon: AppIconName;
  label: string;
  value: string;
}) {
  return (
    <Card className="relative overflow-hidden bg-card/60 backdrop-blur-md border-border/80 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 group">
      <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-primary to-blue-500 rounded-l-full" />
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <strong className="block text-3xl font-extrabold tracking-tight text-foreground transition-all group-hover:text-primary">
            {value}
          </strong>
          {description ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium bg-muted/40 px-2 py-0.5 rounded-full border border-border/50">
              {description}
            </span>
          ) : null}
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
          <AppIcon className="bg-transparent text-current" name={icon} />
        </div>
      </CardContent>
    </Card>
  );
}

export function DataCard({
  children,
  className,
  description,
  title
}: {
  children: ReactNode;
  className?: string;
  description?: string;
  title: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        {description ? <CardDescription>{description}</CardDescription> : null}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function StatusPill({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "danger" | "info" | "neutral" | "success" | "warning";
}) {
  const tones = {
    danger: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
    info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
    neutral: "border-border bg-muted text-muted-foreground",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} />;
}
