package com.mkhailksk.famnotes; // Изменено с famnote на famnotes

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.module.annotations.ReactModule;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@ReactModule(name = WidgetDataModule.NAME)
public class WidgetDataModule extends ReactContextBaseJavaModule {
    public static final String NAME = "WidgetDataModule";
    private static final String PREFS_NAME = "com.mkhailksk.famnotes.widget"; // Изменено
    private static final String NOTES_KEY = "widget_notes";

    public WidgetDataModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void updateWidgetNotes(String notesJson) {
        try {
            Context context = getReactApplicationContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(NOTES_KEY, notesJson).apply();

            // Обновляем виджет
            Class<?> widgetClass = Class.forName("com.mkhailksk.famnotes.widget.NotesWidget");
            java.lang.reflect.Method method = widgetClass.getMethod("updateWidgetNotes", Context.class, String.class);
            method.invoke(null, context, notesJson);

            Log.d(NAME, "Widget updated");
        } catch (Exception e) {
            Log.e(NAME, "Error updating widget", e);
        }
    }
}
