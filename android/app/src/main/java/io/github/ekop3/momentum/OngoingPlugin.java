package io.github.ekop3.momentum;

import android.Manifest;
import android.app.NotificationManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/** JS köprüsü: program verisini alır, bildirim durumunu ve izinleri yönetir. */
@CapacitorPlugin(
    name = "Ongoing",
    permissions = { @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications") }
)
public class OngoingPlugin extends Plugin {

    private JSObject status() {
        JSObject o = new JSObject();
        NotificationManager nm = getContext().getSystemService(NotificationManager.class);
        o.put("notifications", nm != null && nm.areNotificationsEnabled());
        o.put("exactAlarms", OngoingEngine.canScheduleExact(getContext()));
        return o;
    }

    /** { items: [...], ongoing: boolean, reminders: boolean } */
    @PluginMethod
    public void sync(PluginCall call) {
        JSArray items = call.getArray("items");
        boolean ongoing = Boolean.TRUE.equals(call.getBoolean("ongoing", false));
        boolean reminders = Boolean.TRUE.equals(call.getBoolean("reminders", false));
        OngoingEngine.saveConfig(getContext(), items == null ? "[]" : items.toString(), ongoing, reminders);
        OngoingEngine.refresh(getContext());
        call.resolve(status());
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) {
            call.resolve(status());
            return;
        }
        requestPermissionForAlias("notifications", call, "onNotificationPermission");
    }

    @PermissionCallback
    private void onNotificationPermission(PluginCall call) {
        OngoingEngine.refresh(getContext());
        call.resolve(status());
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName())
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 31) {
            Intent i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
                .setData(Uri.parse("package:" + getContext().getPackageName()))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        }
        call.resolve();
    }
}
