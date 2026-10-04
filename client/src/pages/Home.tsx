import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { clearMarketingDraft, loadMarketingDraft, saveMarketingDraft } from "@/lib/draftStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Bot, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronLeft, Copy, DollarSign, Globe2, Layers3, Megaphone, Plus, Sparkles, Target, UsersRound } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const roles = [
  ["مدير التسويق", "يوحّد القرارات ويحوّل الأهداف إلى مسار نمو واضح", BriefcaseBusiness],
  ["الاستراتيجي", "يبني التموضع والرسالة والقنوات ذات الأولوية", Target],
  ["باحث الجمهور", "يفكك الاحتياجات والدوافع والاعتراضات", UsersRound],
  ["مخطط المحتوى", "يصمم نظام محتوى متعدد القنوات وجدول نشر", CalendarDays],
  ["الكاتب الإعلاني", "ينتج نسخاً تسويقية جاهزة للحملات", Megaphone],
  ["كاتب السيناريو", "يحوّل الفكرة إلى سيناريوهات فيديو قابلة للتصوير", Layers3],
] as const;

const initialForm = { name: "", idea: "", audience: "", country: "السعودية", duration: "90 يوماً", budget: "", sector: "", goals: "" };

export default function Home() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<typeof initialForm>(() => loadMarketingDraft(initialForm));
  useEffect(() => { saveMarketingDraft(form); }, [form]);
  const [showForm, setShowForm] = useState(true);
  const projects = trpc.marketing.list.useQuery(undefined, { retry: false });
  const create = trpc.marketing.createAndRun.useMutation({
    onSuccess: (result) => { clearMarketingDraft(); toast.success("اكتملت حزمة التسويق وحُفظت في مشروعك"); setLocation(`/project/${result.projectId}`); },
    onError: (error) => toast.error(error.message || "تعذر تشغيل الوكيل")
  });
  const submit = (event: React.FormEvent) => { event.preventDefault(); create.mutate(form); };
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
    <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur sticky top-0 z-20"><div className="container flex h-16 items-center justify-between">
      <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-[#101828] text-white shadow-sm"><Sparkles className="size-4" /></div><div><div className="font-bold tracking-tight">فريقك التسويقي</div><div className="text-[11px] text-slate-500">AI Marketing Office</div></div></div>
      <div className="flex items-center gap-2"><Badge variant="outline" className="hidden sm:flex gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-500" /> يعمل تلقائياً</Badge><Button variant="ghost" onClick={() => setShowForm(true)}><Plus className="ml-2 size-4" /> مشروع جديد</Button></div>
    </div></header>
    <main className="container py-8 md:py-12">
      <section className="mb-10 grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-end"><div><Badge className="mb-4 rounded-full bg-[#e8edff] px-3 py-1 text-[#4355b9] hover:bg-[#e8edff]">وكيل تسويق يعمل كفريق كامل</Badge><h1 className="max-w-3xl text-4xl font-black leading-[1.15] tracking-tight text-[#101828] md:text-6xl">من فكرة واحدة إلى<br /><span className="text-[#5263d6]">نظام نمو متكامل.</span></h1><p className="mt-5 max-w-xl text-base leading-8 text-slate-600">أدخل تفاصيل مشروعك، ودع الوكيل ينسّق عمل الاستراتيجي والباحث وكاتب المحتوى وكاتب السيناريو ليبني لك حزمة تسويقية قابلة للتنفيذ.</p></div><div className="relative hidden min-h-[210px] overflow-hidden rounded-3xl bg-[#101828] p-7 text-white shadow-xl lg:block"><div className="absolute -left-8 -top-10 size-40 rounded-full bg-[#5969df]/40 blur-2xl" /><div className="relative"><div className="mb-10 flex items-center justify-between text-xs text-slate-300"><span>WORKFLOW / 01</span><span className="rounded-full border border-white/15 px-2 py-1">AUTONOMOUS</span></div><div className="flex items-end gap-3"><div className="h-16 w-1.5 rounded-full bg-[#7382ef]" /><div><div className="text-3xl font-bold">6 أدوار</div><div className="mt-1 text-sm text-slate-300">تعمل معاً لإخراج خطة واحدة</div></div></div><div className="mt-7 flex gap-2">{roles.slice(0, 5).map(([label], i) => <span key={label} className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] text-slate-200">{i + 1}. {label}</span>)}</div></div></div></section>
      <div className="grid gap-8 xl:grid-cols-[1.25fr_.75fr]">
        {showForm && <Card className="border-0 shadow-[0_12px_50px_rgba(16,24,40,.07)]"><CardHeader className="border-b border-slate-100 px-6 py-5"><div className="flex items-center justify-between"><div><CardTitle className="flex items-center gap-2 text-xl"><Bot className="size-5 text-[#5263d6]" /> ابدأ تشغيل الوكيل</CardTitle><p className="mt-1 text-sm text-slate-500">كلما كانت التفاصيل أدق، كانت الخطة أكثر واقعية.</p></div><span className="text-xs font-medium text-slate-400">الخطوة 01 / 01</span></div></CardHeader><CardContent className="px-6 py-6"><form onSubmit={submit} className="space-y-5"><div className="grid gap-5 md:grid-cols-2"><Field label="اسم المشروع" icon={BriefcaseBusiness}><Input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="مثال: تطبيق وجبات صحية" /></Field><Field label="القطاع" icon={Layers3}><Input required value={form.sector} onChange={e => set("sector", e.target.value)} placeholder="تقنية، تجزئة، تعليم..." /></Field></div><Field label="فكرة المشروع أو الخطة الحالية" icon={Sparkles}><Textarea required value={form.idea} onChange={e => set("idea", e.target.value)} placeholder="صف المنتج، المشكلة التي يحلها، وما الذي تفكر في إطلاقه..." className="min-h-28 resize-none" /></Field><Field label="الفئة المستهدفة" icon={UsersRound}><Input required value={form.audience} onChange={e => set("audience", e.target.value)} placeholder="العمر، السلوك، الاحتياج، مستوى الدخل..." /></Field><div className="grid gap-5 md:grid-cols-3"><Field label="البلد" icon={Globe2}><Input required value={form.country} onChange={e => set("country", e.target.value)} /></Field><Field label="المدة" icon={CalendarDays}><Input required value={form.duration} onChange={e => set("duration", e.target.value)} /></Field><Field label="الميزانية" icon={DollarSign}><Input required value={form.budget} onChange={e => set("budget", e.target.value)} placeholder="مثال: 20,000 ريال" /></Field></div><Field label="الأهداف الأساسية" icon={Target}><Textarea required value={form.goals} onChange={e => set("goals", e.target.value)} placeholder="زيادة المبيعات، إطلاق المنتج، بناء الوعي..." className="min-h-24 resize-none" /></Field><Button disabled={create.isPending} type="submit" className="h-12 w-full bg-[#5263d6] text-base font-semibold shadow-lg shadow-[#5263d6]/20 hover:bg-[#4355b9]">{create.isPending ? <><Loader2 className="ml-2 size-4 animate-spin" /> الوكيل ينفذ أدوار الفريق ويجمع الحزمة...</> : <><Sparkles className="ml-2 size-4" /> شغّل فريق التسويق الآن <ArrowLeft className="mr-auto size-4" /></>}</Button></form></CardContent></Card>}
        <aside className="space-y-6"><Card className="border-0 bg-[#101828] text-white shadow-xl"><CardHeader><CardTitle className="text-base">كيف يعمل الوكيل؟</CardTitle></CardHeader><CardContent className="space-y-4">{roles.map(([label, desc, Icon], index) => <div className="flex gap-3" key={label}><div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10"><Icon className="size-4 text-[#aab4ff]" /></div><div><div className="text-sm font-semibold">{label}</div><div className="mt-0.5 text-xs leading-5 text-slate-400">{desc}</div></div><span className="mr-auto text-xs text-slate-600">0{index + 1}</span></div>)}</CardContent></Card><Card className="border-0 shadow-sm"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">مشاريعك المحفوظة</CardTitle><Badge variant="secondary">{projects.data?.length ?? 0}</Badge></CardHeader><CardContent className="pt-0">{projects.isLoading ? <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-slate-400" /></div> : projects.error ? <div className="py-8 text-center text-sm text-slate-500"><p>تعذر تحميل المشاريع.</p><Button variant="link" onClick={() => projects.refetch()}>إعادة المحاولة</Button></div> : projects.data?.length ? <div className="space-y-2">{projects.data.slice(0, 5).map(project => <button key={project.id} onClick={() => setLocation(`/project/${project.id}`)} className="flex w-full items-center gap-3 rounded-xl p-3 text-right transition-colors hover:bg-slate-50"><div className="flex size-9 items-center justify-center rounded-lg bg-[#eef0ff] text-[#5263d6]"><BriefcaseBusiness className="size-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><div className="truncate text-sm font-semibold">{project.name}</div><span className={`rounded-full px-1.5 py-0.5 text-[10px] ${project.runStatus === "running" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{statusLabel(project.runStatus)}</span></div><div className="text-xs text-slate-400">{project.sector} · {project.country} · {new Date(project.updatedAt).toLocaleDateString("ar-SA")}</div><div className="mt-1 truncate text-[11px] text-slate-500">{project.outputExcerpt}</div></div><ChevronLeft className="size-4 text-slate-300" /></button>)}</div> : <div className="py-8 text-center text-sm leading-6 text-slate-400">لا توجد مشاريع بعد.<br />ابدأ بتشغيل أول وكيل لك.</div>}</CardContent></Card></aside>
      </div>
    </main>
  </div>;
}
function statusLabel(status?: string) { return status === "running" ? "قيد التشغيل" : status === "retrying" ? "إعادة المحاولة" : status === "failed" ? "فشل التشغيل" : "مكتمل"; }
function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) { return <label className="block space-y-2"><span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"><Icon className="size-3.5 text-[#5263d6]" />{label}</span>{children}</label>; }
