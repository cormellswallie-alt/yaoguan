package art.yaoguan.app;

import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.view.Display;
import android.view.Surface;
import android.view.SurfaceView;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 刷新率控制：列出屏幕支持的刷新率，并通过 preferredDisplayModeId /
 * preferredRefreshRate 请求系统切换（Android 6+；多数 120Hz 机型在 Android 11+ 生效）。
 * mode: "auto" 交给系统；"max" 取最高；或具体数值（60/90/120/144）。
 */
@CapacitorPlugin(name = "RefreshRate")
public class RefreshRatePlugin extends Plugin {

    private static final String PREF = "yg_refresh";

    @Override
    public void load() {
        String saved = getContext().getSharedPreferences(PREF, Context.MODE_PRIVATE).getString("mode", "max");
        getActivity().runOnUiThread(() -> apply(saved));
    }

    private Display display() {
        Activity a = getActivity();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) return a.getDisplay();
        return a.getWindowManager().getDefaultDisplay();
    }

    private float apply(String mode) {
        Activity a = getActivity();
        Window w = a.getWindow();
        WindowManager.LayoutParams lp = w.getAttributes();
        Display d = display();
        if (d == null) return 0f;
        Display.Mode cur = d.getMode();
        float target = 0f;
        int modeId = 0;
        if ("auto".equals(mode)) {
            lp.preferredDisplayModeId = 0;
            lp.preferredRefreshRate = 0f;
        } else {
            float want = "max".equals(mode) ? 9999f : Float.parseFloat(mode);
            Display.Mode best = null;
            for (Display.Mode m : d.getSupportedModes()) {
                if (m.getPhysicalWidth() != cur.getPhysicalWidth() || m.getPhysicalHeight() != cur.getPhysicalHeight()) continue;
                float r = m.getRefreshRate();
                if (r <= want + 0.5f && (best == null || r > best.getRefreshRate())) best = m;
            }
            if (best == null) best = cur;
            modeId = best.getModeId();
            target = best.getRefreshRate();
            lp.preferredDisplayModeId = modeId;
            lp.preferredRefreshRate = target;
        }
        w.setAttributes(lp);
        // Android 11+：额外对 WebView 表面声明帧率意向
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && target > 0) {
            try {
                View root = w.getDecorView();
                View wv = getBridge().getWebView();
                if (wv instanceof SurfaceView) {
                    Surface s = ((SurfaceView) wv).getHolder().getSurface();
                    s.setFrameRate(target, Surface.FRAME_RATE_COMPATIBILITY_DEFAULT);
                }
                if (Build.VERSION.SDK_INT >= 35) {
                    java.lang.reflect.Method m = View.class.getMethod("setRequestedFrameRate", float.class);
                    m.invoke(root, target);
                    m.invoke(wv, target);
                }
            } catch (Throwable ignored) { }
        }
        return target;
    }

    @PluginMethod
    public void getInfo(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            Display d = display();
            JSObject ret = new JSObject();
            JSArray rates = new JSArray();
            if (d != null) {
                Display.Mode cur = d.getMode();
                java.util.TreeSet<Integer> set = new java.util.TreeSet<>();
                for (Display.Mode m : d.getSupportedModes()) {
                    if (m.getPhysicalWidth() == cur.getPhysicalWidth() && m.getPhysicalHeight() == cur.getPhysicalHeight())
                        set.add(Math.round(m.getRefreshRate()));
                }
                for (Integer r : set) rates.put(r);
                ret.put("current", Math.round(d.getRefreshRate()));
            }
            ret.put("supported", rates);
            ret.put("mode", getContext().getSharedPreferences(PREF, Context.MODE_PRIVATE).getString("mode", "max"));
            ret.put("sdk", Build.VERSION.SDK_INT);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void set(PluginCall call) {
        String mode = call.getString("mode", "max");
        getContext().getSharedPreferences(PREF, Context.MODE_PRIVATE).edit().putString("mode", mode).apply();
        getActivity().runOnUiThread(() -> {
            float t = apply(mode);
            JSObject ret = new JSObject();
            ret.put("target", Math.round(t));
            Display d = display();
            ret.put("current", d != null ? Math.round(d.getRefreshRate()) : 0);
            call.resolve(ret);
        });
    }
}
