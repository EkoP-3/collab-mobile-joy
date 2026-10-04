package io.github.ekop3.momentum;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TimeZone;

/**
 * Günlük programın "şu an / sıradaki" hesabı. Android'e bağımlı DEĞİL (JVM'de test edilir).
 * Mantık, web tarafındaki src/lib/schedule.ts içindeki activeIndex ile aynıdır.
 */
final class ScheduleLogic {

    /** Bir hatırlatıcının başlamasından sonra en fazla bu kadar dakika geç de gösterilir. */
    static final int REMINDER_GRACE_MINUTES = 10;

    static final class Item {
        final String id;
        final String title;
        final int startMin;
        /** Açık bitiş saati (dakika); yoksa -1. */
        final int endMin;
        final boolean remind;
        /** Tamamlandı işaretli günler (yyyy-MM-dd). */
        final Set<String> doneDays;

        Item(String id, String title, int startMin, int endMin, boolean remind, Set<String> doneDays) {
            this.id = id;
            this.title = title;
            this.startMin = startMin;
            this.endMin = endMin;
            this.remind = remind;
            this.doneDays = doneDays;
        }
    }

    static final class State {
        /** Şu an aktif madde (yoksa null = serbest zaman / program bitti). */
        Item current;
        /** Sıradaki madde (bugün kalmadıysa yarının ilk maddesi). */
        Item next;
        boolean nextIsTomorrow;
        boolean currentDone;
        /** Geri sayımın biteceği an (epoch ms); 0 = geri sayım yok. */
        long countdownTo;
    }

    private ScheduleLogic() {}

    static String dayKey(Calendar c) {
        return String.format(
            java.util.Locale.ROOT,
            "%04d-%02d-%02d",
            c.get(Calendar.YEAR),
            c.get(Calendar.MONTH) + 1,
            c.get(Calendar.DAY_OF_MONTH)
        );
    }

    static String dayKey(long nowMs, TimeZone tz) {
        Calendar c = Calendar.getInstance(tz);
        c.setTimeInMillis(nowMs);
        return dayKey(c);
    }

    static String formatTime(int minutes) {
        return String.format(java.util.Locale.ROOT, "%02d:%02d", minutes / 60, minutes % 60);
    }

    static List<Item> sorted(List<Item> items) {
        List<Item> copy = new ArrayList<>(items);
        Collections.sort(copy, new Comparator<Item>() {
            @Override
            public int compare(Item a, Item b) {
                return Integer.compare(a.startMin, b.startMin);
            }
        });
        return copy;
    }

    /** Maddenin etkin bitişi: geçerli açık bitiş, yoksa sıradaki maddenin başlangıcı, yoksa 23:59. */
    private static int effectiveEnd(List<Item> sorted, int i) {
        Item cur = sorted.get(i);
        if (cur.endMin > cur.startMin) return cur.endMin;
        if (i + 1 < sorted.size()) return sorted.get(i + 1).startMin;
        return 23 * 60 + 59;
    }

    /** Verilen günün (nowMs'in günü + dayOffset) gece yarısından itibaren `minute`. */
    static long atMinute(long nowMs, TimeZone tz, int dayOffset, int minute) {
        Calendar c = Calendar.getInstance(tz);
        c.setTimeInMillis(nowMs);
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        c.add(Calendar.DAY_OF_MONTH, dayOffset);
        c.set(Calendar.HOUR_OF_DAY, minute / 60);
        c.set(Calendar.MINUTE, minute % 60);
        return c.getTimeInMillis();
    }

    private static int minuteOfDay(long nowMs, TimeZone tz) {
        Calendar c = Calendar.getInstance(tz);
        c.setTimeInMillis(nowMs);
        return c.get(Calendar.HOUR_OF_DAY) * 60 + c.get(Calendar.MINUTE);
    }

    static State compute(List<Item> items, long nowMs, TimeZone tz) {
        State s = new State();
        if (items.isEmpty()) return s;
        List<Item> sorted = sorted(items);
        int nowMin = minuteOfDay(nowMs, tz);
        String today = dayKey(nowMs, tz);

        int currentIndex = -1;
        for (int i = 0; i < sorted.size(); i++) {
            int start = sorted.get(i).startMin;
            if (nowMin >= start && nowMin < effectiveEnd(sorted, i)) {
                currentIndex = i;
                break;
            }
        }
        if (currentIndex >= 0) {
            s.current = sorted.get(currentIndex);
            s.currentDone = s.current.doneDays.contains(today);
            s.countdownTo = atMinute(nowMs, tz, 0, effectiveEnd(sorted, currentIndex));
        }

        for (Item it : sorted) {
            if (it.startMin > nowMin) {
                s.next = it;
                break;
            }
        }
        if (s.next == null) {
            s.next = sorted.get(0);
            s.nextIsTomorrow = true;
        }
        if (s.current == null) {
            s.countdownTo = atMinute(nowMs, tz, s.nextIsTomorrow ? 1 : 0, s.next.startMin);
        }
        return s;
    }

    /**
     * Bildirimin/hatırlatıcının değişeceği bir sonraki an (epoch ms): bir sonraki başlangıç/bitiş
     * saati ya da yoksa gece yarısı (tarih anahtarı yenilensin diye).
     */
    static long nextEventAt(List<Item> items, long nowMs, TimeZone tz) {
        int nowMin = minuteOfDay(nowMs, tz);
        List<Item> sorted = sorted(items);
        int best = Integer.MAX_VALUE;
        for (int i = 0; i < sorted.size(); i++) {
            Item it = sorted.get(i);
            int[] candidates = { it.startMin, it.endMin, effectiveEnd(sorted, i) };
            for (int c : candidates) {
                if (c > nowMin && c < best) best = c;
            }
        }
        long at = best == Integer.MAX_VALUE
            ? atMinute(nowMs, tz, 1, 0)
            : atMinute(nowMs, tz, 0, best);
        // Gece yarısı da her zaman bir güncelleme noktasıdır.
        long midnight = atMinute(nowMs, tz, 1, 0);
        if (midnight < at) at = midnight;
        return Math.max(at, nowMs + 1000);
    }

    /** Şu an gösterilmesi gereken (henüz gösterilmemiş) hatırlatıcılar. */
    static List<Item> dueReminders(List<Item> items, long nowMs, TimeZone tz, Set<String> fired) {
        int nowMin = minuteOfDay(nowMs, tz);
        String today = dayKey(nowMs, tz);
        List<Item> due = new ArrayList<>();
        for (Item it : items) {
            if (!it.remind || it.doneDays.contains(today)) continue;
            int late = nowMin - it.startMin;
            if (late < 0 || late > REMINDER_GRACE_MINUTES) continue;
            if (fired.contains(reminderKey(today, it))) continue;
            due.add(it);
        }
        return due;
    }

    static String reminderKey(String today, Item it) {
        return today + "-" + it.id;
    }

    /** Dünün anahtarlarını at; sadece bugünküler kalsın. */
    static Set<String> pruneFired(Set<String> fired, String today) {
        Set<String> kept = new HashSet<>();
        for (String k : fired) {
            if (k.startsWith(today)) kept.add(k);
        }
        return kept;
    }
}
