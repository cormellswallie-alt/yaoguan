"""在 `npx cap add android` 之后运行：
1. 声明网络、震动权限（量子随机源需要联网）
2. 竖屏锁定
3. release 构建使用仓库内固定的 keystore 签名（便于覆盖安装；正式上架请替换为私有密钥并放到 Secrets）
4. 版本号取 GitHub run number
"""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AND = os.path.join(ROOT, 'android')

# ---- Manifest ----
mf = os.path.join(AND, 'app/src/main/AndroidManifest.xml')
s = open(mf, encoding='utf-8').read()
for perm in ['android.permission.INTERNET', 'android.permission.VIBRATE', 'android.permission.HIGH_SAMPLING_RATE_SENSORS']:
    if perm not in s:
        s = s.replace('</manifest>', f'    <uses-permission android:name="{perm}" />\n</manifest>')
if 'screenOrientation' not in s:
    s = re.sub(r'(<activity\b)', r'\1 android:screenOrientation="portrait"', s, count=1)
open(mf, 'w', encoding='utf-8').write(s)

# ---- build.gradle ----
bg = os.path.join(AND, 'app/build.gradle')
g = open(bg, encoding='utf-8').read()
run = int(os.environ.get('GITHUB_RUN_NUMBER', '1'))
g = re.sub(r'versionCode \d+', f'versionCode {run}', g)
g = re.sub(r'versionName "[^"]*"', f'versionName "1.0.{run}"', g)
ks = os.path.join(ROOT, 'ci/debug.keystore').replace('\\', '/')
if 'signingConfigs' not in g:
    g = g.replace('    buildTypes {', f'''    signingConfigs {{
        shared {{
            storeFile file("{ks}")
            storePassword "android"
            keyAlias "androiddebugkey"
            keyPassword "android"
        }}
    }}
    buildTypes {{''', 1)
    g = re.sub(r'(release\s*\{)', r'\1\n            signingConfig signingConfigs.shared', g, count=1)
    g = re.sub(r'minifyEnabled true', 'minifyEnabled false', g)
open(bg, 'w', encoding='utf-8').write(g)

# ---- 原生插件：刷新率 ----
import shutil
pkg = os.path.join(AND, 'app/src/main/java/art/yaoguan/app')
os.makedirs(pkg, exist_ok=True)
for f in ('MainActivity.java', 'RefreshRatePlugin.java'):
    shutil.copy(os.path.join(ROOT, 'native', f), os.path.join(pkg, f))

# ---- 状态栏 / 导航栏颜色（主题） ----
st = os.path.join(AND, 'app/src/main/res/values/styles.xml')
if os.path.exists(st):
    x = open(st, encoding='utf-8').read()
    if 'android:navigationBarColor' not in x:
        x = x.replace('<item name="android:background">@null</item>', '<item name="android:background">@null</item>\n        <item name="android:navigationBarColor">#F2ECE1</item>\n        <item name="android:windowLightNavigationBar">true</item>')
    open(st, 'w', encoding='utf-8').write(x)
print('patched:', mf, bg)
print(g[g.find('defaultConfig'):g.find('defaultConfig') + 300])
print(g[g.find('signingConfigs'):g.find('signingConfigs') + 500])
