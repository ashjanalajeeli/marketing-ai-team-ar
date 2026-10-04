import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { createAgentRun, createMarketingProject, getLatestAgentRun, getMarketingOutput, getMarketingProject, listMarketingProjects, saveMarketingOutput, updateAgentRun } from "./db";

const projectInput = z.object({
  name: z.string().min(2), idea: z.string().min(10), audience: z.string().min(3), country: z.string().min(2),
  duration: z.string().min(1), budget: z.string().min(1), sector: z.string().min(2), goals: z.string().min(3),
});

const outputSchema = {
  type: "object",
  properties: {
    executiveSummary: { type: "string" },
    strategy: { type: "object", properties: { positioning: { type: "string" }, message: { type: "string" }, values: { type: "array", items: { type: "string" } }, personality: { type: "string" }, tone: { type: "string" }, channels: { type: "array", items: { type: "string" } } }, required: ["positioning", "message", "values", "personality", "tone", "channels"], additionalProperties: false },
    annualPlan: { type: "array", items: { type: "object", properties: { period: { type: "string" }, objective: { type: "string" }, actions: { type: "array", items: { type: "string" } }, metric: { type: "string" } }, required: ["period", "objective", "actions", "metric"], additionalProperties: false } },
    monthlyPlan: { type: "array", items: { type: "object", properties: { month: { type: "string" }, focus: { type: "string" }, deliverables: { type: "array", items: { type: "string" } } }, required: ["month", "focus", "deliverables"], additionalProperties: false } },
    weeklyPlan: { type: "array", items: { type: "object", properties: { week: { type: "string" }, priority: { type: "string" }, tasks: { type: "array", items: { type: "string" } }, owner: { type: "string" } }, required: ["week", "priority", "tasks", "owner"], additionalProperties: false } },
    executionPlan: { type: "array", items: { type: "object", properties: { phase: { type: "string" }, priority: { type: "string" }, tasks: { type: "array", items: { type: "string" } }, outcome: { type: "string" } }, required: ["phase", "priority", "tasks", "outcome"], additionalProperties: false } },
    contentPlan: { type: "array", items: { type: "object", properties: { channel: { type: "string" }, format: { type: "string" }, idea: { type: "string" }, hook: { type: "string" }, cta: { type: "string" }, timing: { type: "string" } }, required: ["channel", "format", "idea", "hook", "cta", "timing"], additionalProperties: false } },
    copySamples: { type: "array", items: { type: "object", properties: { use: { type: "string" }, headline: { type: "string" }, body: { type: "string" }, cta: { type: "string" } }, required: ["use", "headline", "body", "cta"], additionalProperties: false } },
    scripts: { type: "array", items: { type: "object", properties: { title: { type: "string" }, platform: { type: "string" }, duration: { type: "string" }, scenes: { type: "array", items: { type: "string" } }, closing: { type: "string" } }, required: ["title", "platform", "duration", "scenes", "closing"], additionalProperties: false } },
  },
  required: ["executiveSummary", "strategy", "annualPlan", "monthlyPlan", "weeklyPlan", "executionPlan", "contentPlan", "copySamples", "scripts"],
  additionalProperties: false,
} as const;

export const marketingTeamRoles = [
  "مدير التسويق",
  "الاستراتيجي",
  "باحث الجمهور",
  "مخطط المحتوى",
  "الكاتب الإعلاني",
  "كاتب السيناريو",
] as const;

function buildPrompt(input: z.infer<typeof projectInput>) {
  return `أنت وكيل تسويق رقمي عربي يعمل كفريق متكامل. لا تكتفِ بنصائح عامة؛ حلّل المشروع ثم نسّق عمل الأدوار التالية داخلياً: مدير التسويق، الاستراتيجي، باحث الجمهور، مخطط المحتوى، الكاتب الإعلاني، وكاتب السيناريو. أخرج حزمة عملية قابلة للتنفيذ باللغة العربية، مناسبة للبلد والقطاع والميزانية والمدة. كن واقعياً في حجم الخطة ولا تفترض بيانات غير مذكورة.

بيانات المشروع:
الاسم: ${input.name}
الفكرة/الخطة: ${input.idea}
الجمهور المستهدف: ${input.audience}
البلد: ${input.country}
المدة: ${input.duration}
الميزانية: ${input.budget}
القطاع: ${input.sector}
الأهداف: ${input.goals}`;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  marketing: router({
    list: protectedProcedure.query(({ ctx }) => listMarketingProjects(ctx.user.id)),
    get: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ ctx, input }) => ({ project: await getMarketingProject(input.projectId, ctx.user.id), output: await getMarketingOutput(input.projectId), run: await getLatestAgentRun(input.projectId) })),
    runStatus: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ ctx, input }) => { const project = await getMarketingProject(input.projectId, ctx.user.id); if (!project) throw new Error("المشروع غير موجود"); return getLatestAgentRun(input.projectId); }),
    createAndRun: protectedProcedure.input(projectInput).mutation(async ({ ctx, input }) => {
      const projectId = await createMarketingProject({ ...input, ownerId: ctx.user.id });
      const runId = await createAgentRun(projectId);
      const team = marketingTeamRoles.map((role) => [role, {
        "مدير التسويق": "حلّل الصورة العامة، الأولويات، ومقياس النجاح.",
        "الاستراتيجي": "حدّد التموضع والرسالة والقيم والشخصية والقنوات.",
        "باحث الجمهور": "استخرج شرائح الجمهور ودوافعهم واعتراضاتهم ورسائل الوصول.",
        "مخطط المحتوى": "صمّم نظام محتوى متعدد القنوات وجدول نشر واقعي.",
        "الكاتب الإعلاني": "اكتب نماذج نسخ للحملات والإعلانات والصفحات.",
        "كاتب السيناريو": "اقترح سيناريوهات فيديو بمشاهد وخطافات وخواتيم.",
      }[role]]);
      await updateAgentRun(runId, { activeRole: "أعضاء الفريق يعملون بالتوازي", completedRoles: 0 });
      const roleReports = await Promise.all(team.map(async ([role, assignment], roleIndex) => {
        const roleResponse = await invokeLLM({ messages: [{ role: "system", content: `أنت ${role} ضمن فريق تسويق عربي. ${assignment} أجب بنقاط عملية مختصرة، ولا تخترع أرقاماً غير معطاة.` }, { role: "user", content: buildPrompt(input) }] });
        const roleContent = roleResponse.choices?.[0]?.message?.content;
        await updateAgentRun(runId, { activeRole: role, completedRoles: roleIndex + 1 });
        return [role, typeof roleContent === "string" ? roleContent : "لم يصل تقرير هذا الدور"] as const;
      })).catch(async (error) => { await updateAgentRun(runId, { status: "failed", activeRole: "فشل أحد أدوار الفريق" }); throw error; });
      const roleOutputs = Object.fromEntries(roleReports);
      const synthesis = await invokeLLM({ messages: [{ role: "system", content: "أنت مدير التسويق وقائد الوكيل. اجمع تقارير الأدوار في حزمة تنفيذية عربية واحدة. أعد JSON مطابقاً للمخطط فقط." }, { role: "user", content: `${buildPrompt(input)}\n\nتقارير أعضاء الفريق:\n${Object.entries(roleOutputs).map(([role, report]) => `### ${role}\n${report}`).join("\n\n")}\n\nادمج هذه التقارير مع إزالة التكرار، واجعل الخطط مناسبة للمدة والميزانية.` }], response_format: { type: "json_schema", json_schema: { name: "marketing_team_output", strict: true, schema: outputSchema } } });
      const content = synthesis.choices?.[0]?.message?.content;
      if (typeof content !== "string") { await updateAgentRun(runId, { status: "failed", activeRole: "فشل التجميع" }); throw new Error("تعذر تجميع مخرجات الوكيل"); }
      let parsed: unknown;
      try { parsed = JSON.parse(content); } catch { await updateAgentRun(runId, { status: "failed", activeRole: "استجابة غير منظمة" }); throw new Error("وصلت استجابة غير منظمة من الوكيل، حاول تشغيله مرة أخرى"); }
      await saveMarketingOutput(projectId, JSON.stringify(parsed));
      await updateAgentRun(runId, { status: "completed", activeRole: "اكتمل التجميع", completedRoles: team.length });
      return { projectId, content: parsed, runId };
    }),
    retry: protectedProcedure.input(z.object({ projectId: z.number() })).mutation(async ({ ctx, input }) => {
      const project = await getMarketingProject(input.projectId, ctx.user.id);
      if (!project) throw new Error("المشروع غير موجود");
      const runId = await createAgentRun(project.id);
      await updateAgentRun(runId, { status: "retrying", activeRole: "إعادة تشغيل الوكيل" });
      try {
        const response = await invokeLLM({ messages: [{ role: "system", content: "أنت فريق تسويق رقمي عربي. أعد حزمة عملية كاملة بصيغة JSON مطابقة للمخطط فقط." }, { role: "user", content: buildPrompt(project) }], response_format: { type: "json_schema", json_schema: { name: "marketing_team_output", strict: true, schema: outputSchema } } });
        const content = response.choices?.[0]?.message?.content;
        if (typeof content !== "string") throw new Error("تعذر إعادة تشغيل الوكيل");
        const parsed = JSON.parse(content);
        await saveMarketingOutput(project.id, JSON.stringify(parsed));
        await updateAgentRun(runId, { status: "completed", activeRole: "اكتمل التجميع", completedRoles: 6 });
        return { projectId: project.id, content: parsed, runId };
      } catch (error) {
        await updateAgentRun(runId, { status: "failed", activeRole: "فشل التشغيل" });
        throw error;
      }
    }),
    saveOutput: protectedProcedure.input(z.object({ projectId: z.number(), content: z.string() })).mutation(async ({ ctx, input }) => {
      const project = await getMarketingProject(input.projectId, ctx.user.id);
      if (!project) throw new Error("المشروع غير موجود");
      await saveMarketingOutput(input.projectId, input.content);
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
