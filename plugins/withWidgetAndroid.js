const {
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const withWidgetAndroid = (config) => {
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    
    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }
    
    const hasWidgetReceiver = mainApplication.receiver.some(
      receiver => receiver.$ && receiver.$['android:name'] === '.widget.NotesWidget'
    );
    
    if (!hasWidgetReceiver) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.widget.NotesWidget',
          'android:exported': 'true'
        },
        'intent-filter': [{
          action: [{
            $: {
              'android:name': 'android.appwidget.action.APPWIDGET_UPDATE'
            }
          }]
        }],
        'meta-data': [{
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/notes_widget_info'
          }
        }]
      });
    }
    
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const platformRoot = path.join(config.modRequest.platformProjectRoot, 'app/src/main');
      const packageName = config.android.package || 'com.mkhailksk.famnote';
      const packagePath = packageName.replace(/\./g, '/');
      
      // Копируем Java/Kotlin файлы в правильную папку
      const widgetSource = path.join(config.modRequest.projectRoot, 'widgets/android/src/main/java');
      const targetSource = path.join(platformRoot, 'java', packagePath);
      
      if (fs.existsSync(widgetSource)) {
        copyFolderRecursive(widgetSource, targetSource);
      } else {
        // Создаем файл вручную
        createWidgetFileManually(targetSource);
      }
      
      // Копируем ресурсы
      const widgetRes = path.join(config.modRequest.projectRoot, 'widgets/android/src/main/res');
      const targetRes = path.join(platformRoot, 'res');
      
      if (fs.existsSync(widgetRes)) {
        copyFolderRecursive(widgetRes, targetRes);
      } else {
        createWidgetResourcesManually(platformRoot);
      }
      
      return config;
    }
  ]);

  return config;
};

function createWidgetFileManually(targetSource) {
  const widgetDir = path.join(targetSource, 'widget');
  if (!fs.existsSync(widgetDir)) {
    fs.mkdirSync(widgetDir, { recursive: true });
  }
  
  const widgetFile = path.join(widgetDir, 'NotesWidget.kt');
  const widgetContent = `package com.mkhailksk.famnote.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import com.mkhailksk.famnote.R;
import com.mkhailksk.famnote.MainActivity;

public class NotesWidget extends AppWidgetProvider {
    
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_notes);
            
            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);
            views.setTextViewText(R.id.widget_text, "FamNote");
            
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}`;
  
  fs.writeFileSync(widgetFile, widgetContent);
  console.log('✓ Created NotesWidget.kt manually');
}

function createWidgetResourcesManually(platformRoot) {
  // Создаем layout
  const layoutDir = path.join(platformRoot, 'res', 'layout');
  if (!fs.existsSync(layoutDir)) {
    fs.mkdirSync(layoutDir, { recursive: true });
  }
  
  const layoutFile = path.join(layoutDir, 'widget_notes.xml');
  const layoutContent = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_container"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="#008080">

    <TextView
        android:id="@+id/widget_title"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="FamNote"
        android:textSize="18sp"
        android:textStyle="bold"
        android:textColor="@android:color/white" />
    
    <TextView
        android:id="@+id/widget_text"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:text="Заметки"
        android:textSize="14sp"
        android:textColor="@android:color/white" />
    
</LinearLayout>`;
  
  fs.writeFileSync(layoutFile, layoutContent);
  
  // Создаем xml
  const xmlDir = path.join(platformRoot, 'res', 'xml');
  if (!fs.existsSync(xmlDir)) {
    fs.mkdirSync(xmlDir, { recursive: true });
  }
  
  const xmlFile = path.join(xmlDir, 'notes_widget_info.xml');
  const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="180dp"
    android:minHeight="40dp"
    android:targetCellWidth="3"
    android:targetCellHeight="1"
    android:updatePeriodMillis="86400000"
    android:initialLayout="@layout/widget_notes"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen">
</appwidget-provider>`;
  
  fs.writeFileSync(xmlFile, xmlContent);
  console.log('✓ Created widget resources manually');
}

function copyFolderRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyFolderRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

module.exports = createRunOncePlugin(withWidgetAndroid, 'withWidgetAndroid', '1.0.0');
