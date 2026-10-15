package art.yaoguan.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RefreshRatePlugin.class);
        super.onCreate(savedInstanceState);
        // 排盘表为精确栅格，锁定文字缩放为 100%，避免系统“大字体”撑破布局
        try { getBridge().getWebView().getSettings().setTextZoom(100); } catch (Throwable ignored) { }
    }
}
