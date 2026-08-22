package com.ogwaffles.pos;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class MainActivity extends AppCompatActivity {

    private static final String PREFS_NAME = "OGWafflesPrefs";
    private static final String KEY_SERVER_URL = "server_api_url";
    private static final String LOCAL_INDEX_URL = "file:///android_asset/www/index.html";

    private WebView webView;
    private SwipeRefreshLayout swipeRefreshLayout;
    private ProgressBar progressBar;
    private View errorView;
    private Button btnRetry;
    private Button btnChangeServer;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

        webView = findViewById(R.id.webView);
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        progressBar = findViewById(R.id.progressBar);
        errorView = findViewById(R.id.errorView);
        btnRetry = findViewById(R.id.btnRetry);
        btnChangeServer = findViewById(R.id.btnChangeServer);

        setupSwipeRefresh();
        setupWebView();
        setupButtons();

        loadApp();
    }

    private void setupSwipeRefresh() {
        swipeRefreshLayout.setColorSchemeResources(R.color.gold_primary, R.color.gold_dark);
        swipeRefreshLayout.setProgressBackgroundColorSchemeResource(R.color.card_dark);
        swipeRefreshLayout.setOnRefreshListener(() -> {
            if (webView != null) {
                webView.reload();
            }
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        webView.setWebViewClient(new CustomWebViewClient());
        webView.setWebChromeClient(new CustomWebChromeClient());
    }

    private void setupButtons() {
        btnRetry.setOnClickListener(v -> {
            errorView.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            loadApp();
        });

        btnChangeServer.setOnClickListener(v -> showServerConfigDialog());
    }

    private void loadApp() {
        webView.setVisibility(View.VISIBLE);
        errorView.setVisibility(View.GONE);
        webView.loadUrl(LOCAL_INDEX_URL);
    }

    public String getServerUrl() {
        String defaultUrl = getString(R.string.default_server_url);
        return prefs.getString(KEY_SERVER_URL, defaultUrl);
    }

    public void setServerUrl(String url) {
        if (url != null) {
            String clean = url.trim().replaceAll("/+$", "");
            prefs.edit().putString(KEY_SERVER_URL, clean).apply();
            injectServerUrl(clean);
        }
    }

    private void injectServerUrl(String serverUrl) {
        String js = String.format(
            "if (typeof window.APP_CONFIG !== 'undefined' && window.APP_CONFIG.setApiBaseUrl) { " +
            "   window.APP_CONFIG.setApiBaseUrl('%s'); " +
            "} else { " +
            "   localStorage.setItem('ogw_api_base_url', '%s'); " +
            "   if (typeof api !== 'undefined') api.baseUrl = '%s'; " +
            "}", serverUrl, serverUrl, serverUrl
        );
        webView.evaluateJavascript(js, null);
    }

    public void showServerConfigDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this, androidx.appcompat.R.style.Theme_AppCompat_Dialog_Alert);
        builder.setTitle("Configure Server URL");

        final EditText input = new EditText(this);
        input.setHint("https://og-waffles-backend.onrender.com");
        input.setText(getServerUrl());
        input.setSingleLine(true);
        input.setPadding(40, 30, 40, 30);
        builder.setView(input);

        builder.setPositiveButton("Save & Reload", (dialog, which) -> {
            String newUrl = input.getText().toString().trim();
            if (!newUrl.isEmpty()) {
                setServerUrl(newUrl);
                Toast.makeText(MainActivity.this, "Server URL updated to: " + newUrl, Toast.LENGTH_SHORT).show();
                loadApp();
            }
        });

        builder.setNeutralButton("Reset Default", (dialog, which) -> {
            String defUrl = getString(R.string.default_server_url);
            setServerUrl(defUrl);
            Toast.makeText(MainActivity.this, "Reset to default: " + defUrl, Toast.LENGTH_SHORT).show();
            loadApp();
        });

        builder.setNegativeButton("Cancel", (dialog, which) -> dialog.cancel());
        builder.show();
    }

    private class CustomWebViewClient extends WebViewClient {
        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            progressBar.setVisibility(View.VISIBLE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            progressBar.setVisibility(View.GONE);
            swipeRefreshLayout.setRefreshing(false);
            injectServerUrl(getServerUrl());
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            if (request.isForMainFrame()) {
                progressBar.setVisibility(View.GONE);
                swipeRefreshLayout.setRefreshing(false);
                webView.setVisibility(View.GONE);
                errorView.setVisibility(View.VISIBLE);
            }
        }
    }

    private class CustomWebChromeClient extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            if (newProgress < 100) {
                progressBar.setProgress(newProgress);
            } else {
                progressBar.setVisibility(View.GONE);
            }
        }

        @Override
        public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
            new AlertDialog.Builder(MainActivity.this)
                    .setTitle("OG Waffles POS")
                    .setMessage(message)
                    .setPositiveButton("OK", (dialog, which) -> result.confirm())
                    .setCancelable(false)
                    .show();
            return true;
        }

        @Override
        public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
            new AlertDialog.Builder(MainActivity.this)
                    .setTitle("OG Waffles POS")
                    .setMessage(message)
                    .setPositiveButton("Yes", (dialog, which) -> result.confirm())
                    .setNegativeButton("No", (dialog, which) -> result.cancel())
                    .setCancelable(false)
                    .show();
            return true;
        }

        @Override
        public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
            return super.onConsoleMessage(consoleMessage);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
