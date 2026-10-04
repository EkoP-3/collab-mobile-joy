package io.github.ekop3.momentum;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TimeZone;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Kalıcı "şu an / sıradaki" bildirimi ve görev hatırlatıcıları.
 *
 * Sunucu yok: program (JS tarafından gönderilir) SharedPreferences'ta saklanır, bildirim
 * sabit bir kimlikle yerinde güncellenir (yığılmaz) ve bir sonraki değişiklik anı için
 * AlarmManager kurulur. Kalan süre, sistemin geri sayım sayacıyla (chronometer) gösterilir;
 * bu yüzden dakikada bir uyanmaya gerek yoktur.
 */
final class OngoingEngine {

    static final String PREFS = "momentum_notifications";
    static final String KEY_ITEMS = "items";
    static final String KEY_ONGOING = "ongoing";
    static final String KEY_REMINDERS = "reminders";
    static final String KEY_FIRED = "fired";

    static final String CHANNEL_ONGOING = "momentum_ongoing";
    static final String CHANNEL_REMINDERS = "momentum_reminders";
    static final int ID_ONGOING = 1001;
    static final String ACTION_TICK = "io.github.ekop3.momentum.TICK";

    private static final int BRAND_COLOR = 0xFF5A7CFF;

    private OngoingEngine() {}

    // ---------------------------------------------------------------- yapılandırma

    static void saveConfig(Context ctx, String itemsJson, boolean ongoing, boolean reminders) {
        prefs(ctx)
            .edit()
            .putString(KEY_ITEMS, itemsJson)
            .putBoolean(KEY_ONGOING, ongoing)
            .putBoolean(KEY_REMINDERS, reminders)
            .apply();
    }

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static List<ScheduleLogic.Item> parseItems(String json) {
        List<ScheduleLogic.Item> items = new ArrayList<>();
        try {
            JSONArray arr = new JSONArray(json == null ? "[]" : json);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                int start = parseTime(o.optString("start", ""));
                if (start < 0) continue;
                String end = o.optString("end", "");
                Set<String> done = new HashSet<>();
                JSONArray d = o.optJSONArray("done");
                if (d != null) {
                    for (int k = 0; k < d.length(); k++) done.add(d.optString(k));
                }
                items.add(
                    new ScheduleLogic.Item(
                        o.optString("id", String.valueOf(i)),
                        o.optString("title", "Görev"),
                        start,
                        end.isEmpty() ? -1 : parseTime(end),
                        o.optBoolean("remind", false),
                        done
                    )
                );
            }
        } catch (Exception ignored) {
            // bozuk veri: boş program gibi davran
        }
        return items;
    }

    /** "HH:mm" → dakika; geçersizse -1. */
    static int parseTime(String t) {
        if (t == null || t.length() != 5 || t.charAt(2) != ':') return -1;
        try {
            int h = Integer.parseInt(t.substring(0, 2));
            int m = Integer.parseInt(t.substring(3, 5));
            if (h < 0 || h > 23 || m < 0 || m > 59) return -1;
            return h * 60 + m;
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    // ---------------------------------------------------------------- ana akış

    /** Bildirimleri güncelle, hatırlatıcıları göster ve bir sonraki alarmı kur. */
    static void refresh(Context ctx) {
        Context app = ctx.getApplicationContext();
        SharedPreferences p = prefs(app);
        boolean ongoing = p.getBoolean(KEY_ONGOING, false);
        boolean reminders = p.getBoolean(KEY_REMINDERS, false);
        List<ScheduleLogic.Item> items = parseItems(p.getString(KEY_ITEMS, "[]"));

        NotificationManager nm = app.getSystemService(NotificationManager.class);
        if (nm == null) return;
        ensureChannels(nm);
        boolean canPost = nm.areNotificationsEnabled();
        long now = System.currentTimeMillis();
        TimeZone tz = TimeZone.getDefault();

        if (ongoing && canPost && !items.isEmpty()) {
            nm.notify(ID_ONGOING, buildOngoing(app, ScheduleLogic.compute(items, now, tz)));
        } else {
            nm.cancel(ID_ONGOING);
        }

        if (reminders && canPost && !items.isEmpty()) {
            fireDueReminders(app, nm, p, items, now, tz);
        }

        if ((ongoing || reminders) && !items.isEmpty()) {
            scheduleAlarm(app, ScheduleLogic.nextEventAt(items, now, tz));
        } else {
            cancelAlarm(app);
        }
    }

    private static void fireDueReminders(
        Context ctx,
        NotificationManager nm,
        SharedPreferences p,
        List<ScheduleLogic.Item> items,
        long now,
        TimeZone tz
    ) {
        String today = ScheduleLogic.dayKey(now, tz);
        Set<String> fired = ScheduleLogic.pruneFired(
            new HashSet<>(p.getStringSet(KEY_FIRED, new HashSet<String>())),
            today
        );
        List<ScheduleLogic.Item> due = ScheduleLogic.dueReminders(items, now, tz, fired);
        for (ScheduleLogic.Item it : due) {
            String key = ScheduleLogic.reminderKey(today, it);
            nm.notify(2000 + (key.hashCode() & 0xFFFF), buildReminder(ctx, it, now));
            fired.add(key);
        }
        p.edit().putStringSet(KEY_FIRED, fired).apply();
    }

    // ---------------------------------------------------------------- bildirimler

    private static Notification.Builder builder(Context ctx, String channel) {
        return Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(ctx, channel)
            : new Notification.Builder(ctx);
    }

    private static PendingIntent openAppIntent(Context ctx) {
        Intent launch = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (launch == null) launch = new Intent();
        launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        return PendingIntent.getActivity(ctx, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static Notification buildOngoing(Context ctx, ScheduleLogic.State s) {
        String title;
        String text;
        if (s.current != null) {
            int end = s.countdownTo > 0 ? minutesOf(s.countdownTo) : s.current.startMin;
            title = (s.currentDone ? "✓ " : "") + s.current.title;
            String range = ScheduleLogic.formatTime(s.current.startMin) + "–" + ScheduleLogic.formatTime(end);
            text = range + " · " + nextLine(s);
        } else if (s.next != null && !s.nextIsTomorrow) {
            title = "Serbest zaman";
            text = nextLine(s);
        } else {
            title = "Bugünlük program tamam";
            text = s.next != null ? nextLine(s) : "Güzel iş!";
        }

        Notification.Builder b = builder(ctx, CHANNEL_ONGOING)
            .setSmallIcon(R.drawable.ic_stat_momentum)
            .setColor(BRAND_COLOR)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(new Notification.BigTextStyle().bigText(text))
            .setSubText("Momentum")
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(Notification.CATEGORY_STATUS)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setContentIntent(openAppIntent(ctx));

        if (s.countdownTo > 0) {
            // Sistem kalan süreyi kendisi geriye sayar; uygulamanın uyanmasına gerek yok.
            b.setShowWhen(true).setWhen(s.countdownTo).setUsesChronometer(true).setChronometerCountDown(true);
        } else {
            b.setShowWhen(false);
        }
        return b.build();
    }

    private static String nextLine(ScheduleLogic.State s) {
        if (s.next == null) return "Günün son bloğu";
        String when = (s.nextIsTomorrow ? "Yarın " : "") + ScheduleLogic.formatTime(s.next.startMin);
        return "Sırada " + when + " · " + s.next.title;
    }

    private static int minutesOf(long epochMs) {
        java.util.Calendar c = java.util.Calendar.getInstance(TimeZone.getDefault());
        c.setTimeInMillis(epochMs);
        return c.get(java.util.Calendar.HOUR_OF_DAY) * 60 + c.get(java.util.Calendar.MINUTE);
    }

    static Notification buildReminder(Context ctx, ScheduleLogic.Item it, long when) {
        return builder(ctx, CHANNEL_REMINDERS)
            .setSmallIcon(R.drawable.ic_stat_momentum)
            .setColor(BRAND_COLOR)
            .setContentTitle(ScheduleLogic.formatTime(it.startMin) + " · " + it.title)
            .setContentText("Sıradaki görevin başlıyor")
            .setWhen(when)
            .setShowWhen(true)
            .setAutoCancel(true)
            .setCategory(Notification.CATEGORY_REMINDER)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setContentIntent(openAppIntent(ctx))
            .build();
    }

    static void ensureChannels(NotificationManager nm) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationChannel ongoing = new NotificationChannel(
            CHANNEL_ONGOING,
            "Canlı program",
            NotificationManager.IMPORTANCE_LOW
        );
        ongoing.setDescription("Şu an hangi program bloğunda olduğunu ve sıradakini gösteren sabit bildirim");
        ongoing.setShowBadge(false);
        nm.createNotificationChannel(ongoing);

        NotificationChannel reminders = new NotificationChannel(
            CHANNEL_REMINDERS,
            "Görev hatırlatıcıları",
            NotificationManager.IMPORTANCE_HIGH
        );
        reminders.setDescription("Program saatin geldiğinde sıradaki görevi hatırlatır");
        nm.createNotificationChannel(reminders);
    }

    // ---------------------------------------------------------------- alarm

    private static PendingIntent alarmIntent(Context ctx) {
        Intent i = new Intent(ctx, AlarmReceiver.class).setAction(ACTION_TICK);
        return PendingIntent.getBroadcast(ctx, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static boolean canScheduleExact(Context ctx) {
        if (Build.VERSION.SDK_INT < 31) return true;
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        return am != null && am.canScheduleExactAlarms();
    }

    private static void scheduleAlarm(Context ctx, long at) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am == null) return;
        PendingIntent pi = alarmIntent(ctx);
        try {
            if (canScheduleExact(ctx)) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                return;
            }
        } catch (SecurityException ignored) {
            // izin tam bu arada geri alındı: aşağıdaki yaklaşık alarma düş
        }
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
    }

    private static void cancelAlarm(Context ctx) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am != null) am.cancel(alarmIntent(ctx));
    }
}
