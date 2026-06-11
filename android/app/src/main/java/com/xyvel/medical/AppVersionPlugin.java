package com.xyvel.medical;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Lit la version installée d'une autre application (sous-app XYVEL) afin que
// le hub puisse la comparer à la dernière release GitHub et proposer une MAJ.
@CapacitorPlugin(name = "AppVersion")
public class AppVersionPlugin extends Plugin {

    @PluginMethod
    public void getInstalledVersion(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null || packageName.isEmpty()) {
            call.reject("packageName manquant");
            return;
        }

        JSObject ret = new JSObject();
        try {
            PackageManager pm = getContext().getPackageManager();
            PackageInfo info = pm.getPackageInfo(packageName, 0);
            ret.put("installed", true);
            ret.put("versionName", info.versionName);
        } catch (PackageManager.NameNotFoundException e) {
            ret.put("installed", false);
        }
        call.resolve(ret);
    }
}
