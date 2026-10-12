#!/usr/bin/env bash
# Android native plugins; generated only on the android branch.
# Save backups to device Downloads on Fire OS / Android without a picker.
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

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FairpotDocument", permissions = {
  @Permission(alias = "legacyStorage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE })
})
public class FairpotDocumentPlugin extends Plugin {
  @PluginMethod
  public void saveToDownloads(PluginCall call) {
    String name = call.getString("fileName");
    String data = call.getString("data");
    if (name == null || !name.matches("[A-Za-z0-9._-]+\\.json") || data == null) {
      call.reject("Invalid backup data or filename");
      return;
    }
    // Fire OS 8 (Android 10/11): MediaStore needs no storage permission.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      writeMediaStore(call, name, data);
      return;
    }
    // Fire OS 7 (Android 9): public Downloads requires WRITE_EXTERNAL_STORAGE.
    if (getPermissionState("legacyStorage") != PermissionState.GRANTED) {
      requestPermissionForAlias("legacyStorage", call, "legacyPermissionResult");
      return;
    }
    writeLegacy(call, name, data);
  }

  @PermissionCallback
  private void legacyPermissionResult(PluginCall call) {
    if (call == null) return;
    if (getPermissionState("legacyStorage") != PermissionState.GRANTED) {
      call.reject("Storage permission denied. Allow file access to save into Downloads.");
      return;
    }
    String name = call.getString("fileName");
    String data = call.getString("data");
    if (name == null || data == null) {
      call.reject("Backup information was lost; please retry.");
      return;
    }
    writeLegacy(call, name, data);
  }

  private void success(PluginCall call, String fileName) {
    JSObject result = new JSObject();
    result.put("saved", true);
    result.put("fileName", fileName);
    result.put("location", "Downloads");
    call.resolve(result);
  }

  private void writeMediaStore(PluginCall call, String name, String data) {
    ContentResolver resolver = getContext().getContentResolver();
    ContentValues values = new ContentValues();
    values.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
    values.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/");
    values.put(MediaStore.MediaColumns.IS_PENDING, 1);
    Uri location = null;
    try {
      location = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
      if (location == null) throw new IOException("Android Downloads storage is unavailable");
      try (OutputStream output = resolver.openOutputStream(location, "w")) {
        if (output == null) throw new IOException("Cannot write to Downloads");
        output.write(data.getBytes(StandardCharsets.UTF_8));
        output.flush();
      }
      ContentValues ready = new ContentValues();
      ready.put(MediaStore.MediaColumns.IS_PENDING, 0);
      if (resolver.update(location, ready, null, null) < 1) {
        throw new IOException("Unable to finalize saved file");
      }
      // The MediaStore provider may rename a duplicate filename. Report its real name.
      String actualName = name;
      try (android.database.Cursor cursor = resolver.query(location,
          new String[] { MediaStore.MediaColumns.DISPLAY_NAME }, null, null, null)) {
        if (cursor != null && cursor.moveToFirst()) actualName = cursor.getString(0);
      } catch (Exception ignored) {
        // File is already finalized; a failed display-name lookup is nonfatal.
      }
      success(call, actualName);
    } catch (Exception error) {
      if (location != null) {
        try { resolver.delete(location, null, null); } catch (Exception ignored) { }
      }
      call.reject("Could not save to Downloads: " + error.getMessage());
    }
  }

  @SuppressWarnings("deprecation")
  private void writeLegacy(PluginCall call, String name, String data) {
    try {
      if (!Environment.MEDIA_MOUNTED.equals(Environment.getExternalStorageState())) {
        throw new IOException("Local storage is not mounted");
      }
      File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
      if (!dir.exists() && !dir.mkdirs()) throw new IOException("Cannot create Downloads folder");
      String base = name.substring(0, name.length() - 5);
      File file = new File(dir, name);
      for (int suffix = 2; file.exists(); suffix++) {
        if (suffix > 1000) throw new IOException("Too many backup copies");
        file = new File(dir, base + "-" + suffix + ".json");
      }
      // createNewFile refuses to overwrite even when simultaneous saves occur.
      if (!file.createNewFile()) throw new IOException("Cannot create backup in Downloads");
      try (OutputStream output = new FileOutputStream(file)) {
        output.write(data.getBytes(StandardCharsets.UTF_8));
        output.flush();
      } catch (Exception error) {
        file.delete();
        throw error;
      }
      success(call, file.getName());
    } catch (Exception error) {
      call.reject("Could not save to Downloads: " + error.getMessage());
    }
  }
}
JAVA

# Fire OS 7 (Android 9) requires user-granted legacy storage permission.
# Restrict it to API 28 or below. Fire OS 8 uses MediaStore instead.
python3 - <<'PY'
from pathlib import Path
manifest = Path("android/app/src/main/AndroidManifest.xml")
source = manifest.read_text()
marker = '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />'
if marker not in source:
    assert "<application" in source, "Unexpected AndroidManifest format"
    source = source.replace("<application", marker + "\n    <application", 1)
    manifest.write_text(source)
PY
