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

class NotesWidget : AppWidgetProvider() {
    
    companion object {
        private const val TAG = "FamNotesWidget"
        private const val PREFS_NAME = "com.mkhailksk.famnotes.widget"
        private const val NOTES_KEY = "widget_notes"
        
        fun updateWidgetNotes(context: Context, notesJson: String) {
            Log.d(TAG, "📥 updateWidgetNotes called")
            
            try {
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                prefs.edit().putString(NOTES_KEY, notesJson).apply()
                Log.d(TAG, "💾 Saved to SharedPreferences: $notesJson")
                
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val componentName = android.content.ComponentName(context, NotesWidget::class.java)
                val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
                
                Log.d(TAG, "Found ${appWidgetIds.size} widgets to update")
                
                if (appWidgetIds.isNotEmpty()) {
                    // Создаем экземпляр и вызываем onUpdate
                    val widget = NotesWidget()
                    widget.onUpdate(context, appWidgetManager, appWidgetIds)
                } else {
                    Log.d(TAG, "No widgets found to update")
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error updating widget notes", e)
            }
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
                Log.d(TAG, "Updating widget $appWidgetId")
                
                val views = RemoteViews(context.packageName, R.layout.widget_notes)
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val notesJson = prefs.getString(NOTES_KEY, "[]") ?: "[]"
                
                Log.d(TAG, "Notes JSON from prefs: $notesJson")
                
                val notesText = formatAllNotes(notesJson)
                Log.d(TAG, "Formatted text for widget: $notesText")
                
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
                Log.d(TAG, "Widget $appWidgetId updated successfully")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error updating widget $appWidgetId", e)
            }
        }
    }
    
    private fun formatAllNotes(notesJson: String?): String {
        if (notesJson.isNullOrEmpty() || notesJson == "[]") {
            Log.d(TAG, "No notes to display (empty or null JSON)")
            return "• Нет заметок"
        }
        
        return try {
            val notesArray = JSONArray(notesJson)
            Log.d(TAG, "Found ${notesArray.length()} notes in JSON")
            
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
            val result = stringBuilder.toString()
            Log.d(TAG, "Formatted notes: $result")
            result
        } catch (e: Exception) {
            Log.e(TAG, "Error formatting notes", e)
            "• Ошибка загрузки"
        }
    }
    
    override fun onEnabled(context: Context) {
        Log.d(TAG, "onEnabled - Widget first enabled")
        // При первом включении виджета запрашиваем данные
        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val notesJson = prefs.getString(NOTES_KEY, "[]") ?: "[]"
            Log.d(TAG, "onEnabled - Current notes in prefs: $notesJson")
        } catch (e: Exception) {
            Log.e(TAG, "Error in onEnabled", e)
        }
    }
    
    override fun onDisabled(context: Context) {
        Log.d(TAG, "onDisabled - Last widget removed")
    }
}
