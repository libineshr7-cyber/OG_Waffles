# ProGuard rules for OG Waffles POS
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.ogwaffles.pos.** { *; }
