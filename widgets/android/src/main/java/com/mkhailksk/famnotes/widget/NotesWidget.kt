package com.mkhailksk.famnotes.widget  // Должно быть famnotes, а не famnote

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.util.Log
import com.mkhailksk.famnotes.MainActivity  // ИСПРАВЛЕНО: famnotes вместо famnote
import com.mkhailksk.famnotes.R  // ИСПРАВЛЕНО: famnotes вместо famnote
import org.json.JSONArray

class NotesWidget : AppWidgetProvider() {
    
    companion object {
        private const val TAG = "FamNotesWidget"
        const val PREFS_NAME = "com.mkhailksk.famnotes.widget"  // ИСПРАВЛЕНО
        const val NOTES_KEY = "widget_notes"
        
        fun updateWidgetNotes(context: Context, notesJson: String) {
            Log.d(TAG, "📥 updateWidgetNotes called")
            
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(NOTES_KEY, notesJson).apply()
            
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = android.content.ComponentName(context, NotesWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
            
            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId)
            }
        }
        
        private fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_notes)  // R будет найден
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val notesJson = prefs.getString(NOTES_KEY, "[]")
            
            val notesText = formatAllNotes(notesJson)
            views.setTextViewText(R.id.widget_notes_list, notesText)  // R.id будет найден
            
            val intent = Intent(context, MainActivity::class.java).apply {  // MainActivity найден
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)  // R.id будет найден
            
            appWidgetManager.updateAppWidget(appWidgetId, views)
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
                "• Ошибка загрузки"
            }
        }
    }
    
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }
    
    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        updateAppWidget(context, appWidgetManager, appWidgetId)
    }
}
