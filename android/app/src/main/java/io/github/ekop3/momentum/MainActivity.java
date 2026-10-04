package io.github.ekop3.momentum;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Özel eklentiler super.onCreate'ten ÖNCE kaydedilmeli.
        registerPlugin(OngoingPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
