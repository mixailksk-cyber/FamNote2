package com.mkhailksk.famnote.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.widget.RemoteViews
import com.mkhailksk.famnote.MainActivity
import com.mkhailksk.famnote.R
import org.json.JSONArray

class NotesWidget : AppWidgetProvider() {
    
    companion object {
        const val PREFS_NAME = "com.mkhailksk.famnote.widget"
        const val NOTES_KEY = "widget_notes"
        
        fun updateWidgetNotes(context: Context, notesJson: String) {
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
            val views = RemoteViews(context.packageName, R.layout.widget_notes)
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val notesJson = prefs.getString(NOTES_KEY, "[]")
            
            // Форматируем список заметок
            val notesText = formatNotesList(notesJson)
            views.setTextViewText(R.id.widget_notes_list, notesText)
            
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
        
        private fun formatNotesList(notesJson: String?): String {
            if (notesJson.isNullOrEmpty() || notesJson == "[]") {
                return "• Нет заметок"
            }
            
            return try {
                val notesArray = JSONArray(notesJson)
                if (notesArray.length() == 0) {
                    return "• Нет заметок"
                }
                
                val stringBuilder = StringBuilder()
                for (i in 0 until Math.min(notesArray.length(), 5)) { // Показываем до 5 заметок
                    val note = notesArray.getJSONObject(i)
                    val title = note.optString("title", "Без названия")
                    val preview = if (title.length > 20) title.substring(0, 17) + "..." else title
                    stringBuilder.append("• ").append(preview)
                    if (i < notesArray.length() - 1 && i < 4) {
                        stringBuilder.append("\n")
                    }
                }
                
                if (notesArray.length() > 5) {
                    stringBuilder.append("\n• +").append(notesArray.length() - 5).append(" еще")
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
