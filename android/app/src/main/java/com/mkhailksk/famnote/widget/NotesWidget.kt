package com.mkhailksk.famnote.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.widget.RemoteViews
import com.mkhailksk.famnote.MainActivity
import org.json.JSONArray
import org.json.JSONObject

class NotesWidget : AppWidgetProvider() {
    
    companion object {
        const val WIDGET_PREFS = "widget_prefs"
        const val NOTES_KEY = "widget_notes"
        const val PREFS_NAME = "com.mkhailksk.famnote.widget"
        const val CLICK_ACTION = "com.mkhailksk.famnote.widget.CLICK"
        
        // Функция для обновления данных из React Native
        fun updateWidgetNotes(context: Context, notesJson: String) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(NOTES_KEY, notesJson).apply()
            
            // Обновляем все виджеты
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = android.content.ComponentName(context, NotesWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
            
            for (appWidgetId in appWidgetIds) {
                updateWidget(context, appWidgetManager, appWidgetId)
            }
        }
        
        private fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_notes)
            
            // Получаем сохраненные заметки
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val notesJson = prefs.getString(NOTES_KEY, "[]")
            
            // Форматируем текст для отображения
            val displayText = formatNotesText(notesJson)
            views.setTextViewText(R.id.widget_text, displayText)
            
            // Intent для открытия приложения
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
            
            // Обновляем виджет
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
        
        private fun formatNotesText(notesJson: String?): String {
            if (notesJson.isNullOrEmpty() || notesJson == "[]") {
                return "Нет заметок"
            }
            
            return try {
                val notesArray = JSONArray(notesJson)
                if (notesArray.length() == 0) {
                    return "Нет заметок"
                }
                
                val stringBuilder = StringBuilder()
                for (i in 0 until notesArray.length()) {
                    val note = notesArray.getJSONObject(i)
                    val title = note.optString("title", "Без названия")
                    val content = note.optString("content", "...")
                    
                    stringBuilder.append("• ")
                        .append(title)
                        .append(": ")
                        .append(content.take(30))
                    if (content.length > 30) stringBuilder.append("...")
                    
                    if (i < notesArray.length() - 1) {
                        stringBuilder.append("\n")
                    }
                }
                stringBuilder.toString()
            } catch (e: Exception) {
                "Нет заметок"
            }
        }
    }
    
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }
    
    private fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_notes)
        
        // Получаем заметки
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val notesJson = prefs.getString(NOTES_KEY, "[]")
        val displayText = formatNotesText(notesJson)
        views.setTextViewText(R.id.widget_text, displayText)
        
        // Intent для открытия приложения
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
        
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
    
    private fun formatNotesText(notesJson: String?): String {
        if (notesJson.isNullOrEmpty() || notesJson == "[]") {
            return "Нет заметок"
        }
        
        return try {
            val notesArray = JSONArray(notesJson)
            if (notesArray.length() == 0) {
                return "Нет заметок"
            }
            
            val stringBuilder = StringBuilder()
            for (i in 0 until notesArray.length()) {
                val note = notesArray.getJSONObject(i)
                val title = note.optString("title", "Без названия")
                val content = note.optString("content", "...")
                
                stringBuilder.append("• ")
                    .append(title)
                    .append(": ")
                    .append(content.take(30))
                if (content.length > 30) stringBuilder.append("...")
                
                if (i < notesArray.length() - 1) {
                    stringBuilder.append("\n")
                }
            }
            stringBuilder.toString()
        } catch (e: Exception) {
            "Нет заметок"
        }
    }
}
