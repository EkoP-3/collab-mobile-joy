package io.github.ekop3.momentum;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Yeniden başlatma, uygulama güncellemesi, saat/saat dilimi değişimi ve tam alarm izni
 * değişiminden sonra bildirimi yeniden kurar (alarmlar bu olaylarda silinir ya da kayar).
 */
public class SystemEventReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? null : intent.getAction();
        if (action == null) return;
        switch (action) {
            case Intent.ACTION_BOOT_COMPLETED:
            case Intent.ACTION_MY_PACKAGE_REPLACED:
            case Intent.ACTION_TIME_CHANGED:
            case Intent.ACTION_TIMEZONE_CHANGED:
            case "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED":
                OngoingEngine.refresh(context);
                break;
            default:
                break;
        }
    }
}
