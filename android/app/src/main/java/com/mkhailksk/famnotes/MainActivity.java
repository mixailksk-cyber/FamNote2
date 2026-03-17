package com.mkhailksk.famnote;

import android.content.Intent;
import android.os.Bundle;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import org.json.JSONObject;
import org.json.JSONException;

public class MainActivity extends ReactActivity {

    @Override
    protected String getMainComponentName() {
        return "FamNote";
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(
            this,
            getMainComponentName(),
            // Если включен New Architecture
            DefaultNewArchitectureEntryPoint.getFabricEnabled()
        );
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Обработка интента при создании активности
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent); // Обновляем текущий intent
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;

        String action = intent.getStringExtra("action");
        
        if ("create_note".equals(action)) {
            // Создание новой заметки
            String folder = intent.getStringExtra("folder");
            if (folder == null) folder = "Главная";
            
            // Отправляем событие в React Native
            WritableMap params = Arguments.createMap();
            params.putString("action", "create_note");
            params.putString("folder", folder);
            
            sendEventToJS("widgetAction", params);
            
        } else if ("edit_note".equals(action)) {
            // Редактирование заметки
            String noteId = intent.getStringExtra("note_id");
            String noteData = intent.getStringExtra("note_data");
            
            try {
                JSONObject note = new JSONObject(noteData);
                
                WritableMap params = Arguments.createMap();
                params.putString("action", "edit_note");
                params.putString("note_id", noteId);
                params.putString("note_title", note.optString("title", ""));
                params.putString("note_content", note.optString("content", ""));
                
                sendEventToJS("widgetAction", params);
                
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }

    private void sendEventToJS(String eventName, WritableMap params) {
        // Отправляем событие в React Native
        getReactInstanceManager()
            .getCurrentReactContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
}
