package io.github.ekop3.momentum;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TimeZone;
import org.junit.Test;

public class ScheduleLogicTest {

    private static final TimeZone TZ = TimeZone.getTimeZone("Europe/Istanbul");

    private static long at(int day, int hour, int minute, int second) {
        Calendar c = Calendar.getInstance(TZ);
        c.clear();
        c.set(2026, Calendar.OCTOBER, day, hour, minute, second);
        return c.getTimeInMillis();
    }

    private static ScheduleLogic.Item item(String id, String title, String start, String end, boolean remind, String... done) {
        return new ScheduleLogic.Item(
            id,
            title,
            parse(start),
            end == null ? -1 : parse(end),
            remind,
            new HashSet<>(Arrays.asList(done))
        );
    }

    private static int parse(String t) {
        return Integer.parseInt(t.substring(0, 2)) * 60 + Integer.parseInt(t.substring(3, 5));
    }

    private static List<ScheduleLogic.Item> seed() {
        List<ScheduleLogic.Item> l = new ArrayList<>();
        l.add(item("a", "Uyan ve su iç", "07:00", "07:30", true));
        l.add(item("b", "Meditasyon", "07:30", "08:00", true));
        l.add(item("c", "Derin çalışma", "09:00", "12:30", true));
        l.add(item("d", "Öğle yemeği", "13:00", "13:45", false));
        l.add(item("e", "Kitap oku", "21:30", "22:00", true));
        return l;
    }

    @Test
    public void currentBlockAndNext() {
        ScheduleLogic.State s = ScheduleLogic.compute(seed(), at(4, 9, 41, 12), TZ);
        assertEquals("c", s.current.id);
        assertEquals("d", s.next.id);
        assertFalse(s.nextIsTomorrow);
        assertEquals(at(4, 12, 30, 0), s.countdownTo);
    }

    @Test
    public void freeTimeBetweenBlocks() {
        ScheduleLogic.State s = ScheduleLogic.compute(seed(), at(4, 8, 15, 0), TZ);
        assertNull(s.current);
        assertEquals("c", s.next.id);
        assertEquals(at(4, 9, 0, 0), s.countdownTo);
    }

    @Test
    public void blockBoundariesAreStartInclusiveEndExclusive() {
        assertEquals("b", ScheduleLogic.compute(seed(), at(4, 7, 30, 0), TZ).current.id);
        assertNull(ScheduleLogic.compute(seed(), at(4, 8, 0, 0), TZ).current);
    }

    @Test
    public void afterLastItemPointsToTomorrow() {
        ScheduleLogic.State s = ScheduleLogic.compute(seed(), at(4, 22, 30, 0), TZ);
        assertNull(s.current);
        assertTrue(s.nextIsTomorrow);
        assertEquals("a", s.next.id);
        assertEquals(at(5, 7, 0, 0), s.countdownTo);
    }

    @Test
    public void missingEndFallsBackToNextStart() {
        List<ScheduleLogic.Item> l = new ArrayList<>();
        l.add(item("x", "Açık uçlu", "10:00", null, false));
        l.add(item("y", "Sonraki", "11:15", null, false));
        ScheduleLogic.State s = ScheduleLogic.compute(l, at(4, 10, 30, 0), TZ);
        assertEquals("x", s.current.id);
        assertEquals(at(4, 11, 15, 0), s.countdownTo);
        // Sonuncunun bitişi 23:59.
        assertEquals("y", ScheduleLogic.compute(l, at(4, 20, 0, 0), TZ).current.id);
        assertNull(ScheduleLogic.compute(l, at(5, 0, 0, 0), TZ).current);
    }

    @Test
    public void invalidEndIsIgnored() {
        List<ScheduleLogic.Item> l = new ArrayList<>();
        l.add(item("x", "Ters bitiş", "10:00", "09:00", false));
        l.add(item("y", "Sonraki", "11:00", "11:30", false));
        assertEquals("x", ScheduleLogic.compute(l, at(4, 10, 59, 0), TZ).current.id);
    }

    @Test
    public void doneTodayIsReported() {
        List<ScheduleLogic.Item> l = new ArrayList<>();
        l.add(item("c", "Derin çalışma", "09:00", "12:30", true, "2026-10-04"));
        assertTrue(ScheduleLogic.compute(l, at(4, 10, 0, 0), TZ).currentDone);
        assertFalse(ScheduleLogic.compute(l, at(5, 10, 0, 0), TZ).currentDone);
    }

    @Test
    public void emptyScheduleHasNoState() {
        ScheduleLogic.State s = ScheduleLogic.compute(Collections.<ScheduleLogic.Item>emptyList(), at(4, 10, 0, 0), TZ);
        assertNull(s.current);
        assertNull(s.next);
    }

    @Test
    public void nextEventIsNextBoundary() {
        assertEquals(at(4, 12, 30, 0), ScheduleLogic.nextEventAt(seed(), at(4, 9, 41, 12), TZ));
        assertEquals(at(4, 9, 0, 0), ScheduleLogic.nextEventAt(seed(), at(4, 8, 0, 0), TZ));
        // Tam bir sınırda iken bir sonrakini seç.
        assertEquals(at(4, 8, 0, 0), ScheduleLogic.nextEventAt(seed(), at(4, 7, 30, 0), TZ));
    }

    @Test
    public void nextEventAfterLastItemIsMidnight() {
        assertEquals(at(5, 0, 0, 0), ScheduleLogic.nextEventAt(seed(), at(4, 22, 30, 0), TZ));
    }

    @Test
    public void midnightWinsOverFarBoundary() {
        List<ScheduleLogic.Item> l = new ArrayList<>();
        l.add(item("x", "Sabah", "07:00", "08:00", true));
        assertEquals(at(5, 0, 0, 0), ScheduleLogic.nextEventAt(l, at(4, 8, 30, 0), TZ));
    }

    @Test
    public void dueRemindersRespectGraceDoneAndFired() {
        List<ScheduleLogic.Item> l = seed();
        Set<String> fired = new HashSet<>();
        List<ScheduleLogic.Item> due = ScheduleLogic.dueReminders(l, at(4, 9, 0, 5), TZ, fired);
        assertEquals(1, due.size());
        assertEquals("c", due.get(0).id);

        fired.add("2026-10-04-c");
        assertTrue(ScheduleLogic.dueReminders(l, at(4, 9, 0, 5), TZ, fired).isEmpty());

        // Çok geç kaldıysa gösterilmez.
        assertTrue(ScheduleLogic.dueReminders(l, at(4, 9, 11, 0), TZ, new HashSet<String>()).isEmpty());
        // Hatırlatıcı kapalı madde (d) hiç çıkmaz.
        assertTrue(ScheduleLogic.dueReminders(l, at(4, 13, 0, 5), TZ, new HashSet<String>()).isEmpty());
    }

    @Test
    public void doneItemsDoNotRemind() {
        List<ScheduleLogic.Item> l = new ArrayList<>();
        l.add(item("c", "Derin çalışma", "09:00", "12:30", true, "2026-10-04"));
        assertTrue(ScheduleLogic.dueReminders(l, at(4, 9, 0, 5), TZ, new HashSet<String>()).isEmpty());
    }

    @Test
    public void pruneKeepsOnlyToday() {
        Set<String> fired = new HashSet<>(Arrays.asList("2026-10-03-a", "2026-10-04-b"));
        Set<String> kept = ScheduleLogic.pruneFired(fired, "2026-10-04");
        assertEquals(1, kept.size());
        assertTrue(kept.contains("2026-10-04-b"));
        assertNotNull(ScheduleLogic.formatTime(9 * 60 + 5));
        assertEquals("09:05", ScheduleLogic.formatTime(9 * 60 + 5));
    }
}
