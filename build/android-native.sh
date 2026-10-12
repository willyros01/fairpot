#!/usr/bin/env bash
# Install native Android document Save As plugin in the generated Capacitor project.
set -euo pipefail
DIR="android/app/src/main/java/io/github/willyros01/fairpot"
mkdir -p "$DIR"
cat > "$DIR/MainActivity.java" <<'JAVA'
package io.github.willyros01.fairpot;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle savedInstanceState) {
    registerPlugin(FairpotDocumentPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
JAVA
cat > "$DIR/FairpotDocumentPlugin.java" <<'JAVA'
package io.github.willyros01.fairpot;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FairpotDocument")
public class FairpotDocumentPlugin extends Plugin {
  @PluginMethod
  public void save(PluginCall call) {
    String fileName = call.getString("fileName");
    String data = call.getString("data");
    if (fileName == null || !fileName.matches("[A-Za-z0-9._-]+\\.json") || data == null) {
      call.reject("Invalid backup file"); return;
    }
    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.setType("application/json");
    intent.putExtra(Intent.EXTRA_TITLE, fileName);
    intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
    startActivityForResult(call, intent, "saveResult");
  }

  @ActivityCallback
  private void saveResult(PluginCall call, ActivityResult result) {
    if (call == null) return;
    JSObject response = new JSObject();
    if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null ||
        result.getData().getData() == null) {
      response.put("saved", false);
      call.resolve(response); return;
    }
    Uri uri = result.getData().getData();
    String data = call.getString("data");
    if (data == null) { call.reject("Missing backup data"); return; }
    try (OutputStream stream = getContext().getContentResolver().openOutputStream(uri, "wt")) {
      if (stream == null) throw new java.io.IOException("Cannot open selected destination");
      stream.write(data.getBytes(StandardCharsets.UTF_8));
      stream.flush();
      response.put("saved", true);
      call.resolve(response);
    } catch (Exception ex) {
      call.reject("Failed to save backup: " + ex.getMessage());
    }
  }
}
JAVA
