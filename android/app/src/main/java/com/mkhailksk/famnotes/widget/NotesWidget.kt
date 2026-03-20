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
            try {
                val file = File(context.filesDir, "widget_notes.json")
                file.writeText(notesJson)
                
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val componentName = android.content.ComponentName(context, NotesWidget::class.java)
                val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
                
                val widget = NotesWidget()
                widget.onUpdate(context, appWidgetManager, appWidgetIds)
            } catch (e: Exception) {
                Log.e(TAG, "Error", e)
            }
        }
    }
    
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        try {
            val file = File(context.filesDir, "widget_notes.json")
            val notesJson = if (file.exists()) file.readText() else "[]"
            
            for (appWidgetId in appWidgetIds) {
                val views = RemoteViews(context.packageName, R.layout.widget_notes)
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
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error updating widgets", e)
        }
    }
    
    private fun formatAllNotes(notesJson: String): String {
        if (notesJson.isEmpty() || notesJson == "[]") {
            return "• Нет заметок"
        }
        
        return try {
            val notesArray = JSONArray(notesJson)
            if (notesArray.length() == 0) return "• Нет заметок"
            
            val result = StringBuilder()
            for (i in 0 until notesArray.length()) {
                val note = notesArray.getJSONObject(i)
                val title = note.optString("title", "Без названия")
                val preview = if (title.length > 25) title.substring(0, 22) + "..." else title
                result.append("• ").append(preview)
                if (i < notesArray.length() - 1) result.append("\n")
            }
            result.toString()
        } catch (e: Exception) {
            "• Ошибка загрузки"
        }
    }
}
