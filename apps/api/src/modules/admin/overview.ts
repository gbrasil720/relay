import { db } from "@relay/db";
import { user } from "@relay/db/schema/auth";
import { gte } from "drizzle-orm";
import { adminProcedure, router } from "../../index";
import { nextBatchAt } from "./rules";
import { countsOf, dayKey, loadEntries, perDay } from "./waitlist";

const DAY = 86_400_000;

function plural(total: number, one: string, many: string) {
  return `${total} ${total === 1 ? one : many}`;
}

export const overviewRouter = router({
  summary: adminProcedure.query(async () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * DAY);
    const [{ entries, rules }, clients, newClients] = await Promise.all([
      loadEntries(now),
      db.$count(user),
      db.$count(user, gte(user.createdAt, weekAgo)),
    ]);
    const counts = countsOf(entries);
    const entriesByDay = perDay(entries.map((e) => e.subscribedAt), 30, now);

    const isToday = (date: Date | null): date is Date =>
      date !== null && dayKey(date) === dayKey(now);
    const today = (dates: (Date | null)[]) => dates.filter(isToday);
    const latest = (dates: Date[]) => new Date(Math.max(...dates.map(Number)));
    const joined = today(entries.map((e) => e.subscribedAt));
    const invited = today(entries.map((e) => e.invitedAt));
    const opened = today(entries.map((e) => e.inviteOpenedAt));
    const activity = [
      ...entries.flatMap((e) =>
        isToday(e.redeemedAt)
          ? [
              {
                strong: e.domain,
                text: " criou conta pelo convite",
                at: e.redeemedAt,
                color: "#6BD49A",
              },
            ]
          : [],
      ),
      ...(joined.length
        ? [
            {
              text: `${plural(joined.length, "entrada", "entradas")} na waitlist`,
              at: latest(joined),
              color: "#C81E3A",
            },
          ]
        : []),
      ...(invited.length
        ? [
            {
              text: plural(invited.length, "convite enviado", "convites enviados"),
              at: latest(invited),
              color: "#E0B341",
            },
          ]
        : []),
      ...(opened.length
        ? [
            {
              text: plural(opened.length, "convite aberto", "convites abertos"),
              at: latest(opened),
              color: "#3A3D46",
            },
          ]
        : []),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());

    const unreminded = entries.filter(
      (e) =>
        e.status === "invited" &&
        !e.inviteOpenedAt &&
        !e.remindedAt &&
        (e.invitedDays ?? 0) >= rules.reminderDay,
    ).length;
    const attention = [
      ...(counts.expired
        ? [
            {
              title: plural(counts.expired, "convite expirou", "convites expiraram"),
              detail: "voltam para a fila com prioridade",
              action: "reenviar" as const,
            },
          ]
        : []),
      ...(unreminded
        ? [
            {
              title: `${plural(unreminded, "convite", "convites")} sem abrir há ${rules.reminderDay} dias`,
              detail: "nenhum lembrete sai sozinho",
              action: "ver" as const,
            },
          ]
        : []),
    ];

    return {
      clients,
      newClients,
      counts,
      newEntries: entries.filter((e) => e.subscribedAt >= weekAgo).length,
      entriesByDay,
      activity: activity.slice(0, 5),
      attention,
      rulesSize: rules.size,
      nextBatchAt: nextBatchAt(rules, now),
    };
  }),
});
