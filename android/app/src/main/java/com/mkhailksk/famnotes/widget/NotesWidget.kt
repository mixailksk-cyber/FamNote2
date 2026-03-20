package com.mkhailksk.famnotes.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.util.Log
import com.mkhailksk.famnotes.MainActivity
import com.mkhailksk.famnotes.R
import org.json.JSONArray
import java.io.File

class NotesWidget : AppWidgetProvider() {
    
    companion object {
        private const val TAG = "FamNotesWidget"
        
        fun updateWidgetNotes(context: Context, notesJson: String) {
            Log.d(TAG, "📥 updateWidgetNotes called")
            
            try {
                // Сохраняем в файл как запасной вариант
                val file = File(context.filesDir, "widget_notes.json")
                file.writeText(notesJson)
                Log.d(TAG, "💾 Saved to file: ${file.absolutePath}")
                
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val componentName = android.content.ComponentName(context, NotesWidget::class.java)
                val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
                
                Log.d(TAG, "Found ${appWidgetIds.size} widgets")
                
                val widget = NotesWidget()
                widget.onUpdate(context, appWidgetManager, appWidgetIds)
                
            } catch (e: Exception) {
                Log.e(TAG, "Error updating widget notes", e)
            }
        }
        
        private fun getNotesFromFile(context: Context): String {
            try {
                val file = File(context.filesDir, "widget_notes.json")
                if (file.exists()) {
                    val content = file.readText()
                    Log.d(TAG, "📄 Read from file: ${content.take(100)}...")
                    return content
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error reading file", e)
            }
            return "[]"
        }
    }
    
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        Log.d(TAG, "onUpdate called for ${appWidgetIds.size} widgets")
        
        for (appWidgetId in appWidgetIds) {
            try {
                val views = RemoteViews(context.packageName, R.layout.widget_notes)
                
                // Пытаемся получить данные из файла
                val notesJson = getNotesFromFile(context)
                
                val notesText = formatAllNotes(notesJson)
                views.setTextViewText(R.id.widget_notes_list, notesText)
                
                val intent = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                
                val pendingIntent = PendingIntent.getActivity(
                    context, 0, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                
                views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
                
                appWidgetManager.updateAppWidget(appWidgetId, views)
                Log.d(TAG, "Widget $appWidgetId updated")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error updating widget $appWidgetId", e)
            }
        }
    }
    
    private fun formatAllNotes(notesJson: String?): String {
        if (notesJson.isNullOrEmpty() || notesJson == "[]") {
            return "• Нет заметок"
        }
        
        return try {
            val notesArray = JSONArray(notesJson)
            if (notesArray.length() == 0) {
                return "• Нет заметок"
            }
            
            val stringBuilder = StringBuilder()
            for (i in 0 until notesArray.length()) {
                val note = notesArray.getJSONObject(i)
                val title = note.optString("title", "Без названия")
                val preview = if (title.length > 25) title.substring(0, 22) + "..." else title
                stringBuilder.append("• ").append(preview)
                if (i < notesArray.length() - 1) {
                    stringBuilder.append("\n")
                }
            }
            stringBuilder.toString()
        } catch (e: Exception) {
            Log.e(TAG, "Error formatting notes", e)
            "• Ошибка загрузки"
        }
    }
    
    override fun onEnabled(context: Context) {
        Log.d(TAG, "onEnabled - Widget enabled")
    }
    
    override fun onDisabled(context: Context) {
        Log.d(TAG, "onDisabled - Widget disabled")
    }
}
