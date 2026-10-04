package io.github.ekop3.momentum;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Kendi kurduğumuz alarmı karşılar (dışarıya kapalı). */
public class AlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        OngoingEngine.refresh(context);
    }
}
