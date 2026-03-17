package com.mkhailksk.famnotes.widget // Изменено с famnote на famnotes

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
        private const val TAG = "FamNotesWidget" // Изменено
        const val PREFS_NAME = "com.mkhailksk.famnotes.widget" // Изменено
        const val NOTES_KEY = "widget_notes"
        
        fun updateWidgetNotes(context: Context, notesJson: String) {
            Log.d(TAG, "📥 updateWidgetNotes called with data length: ${notesJson.length}")
            val preview = notesJson.take(200)
            Log.d(TAG, "📄 First 200 chars: $preview")
            
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(NOTES_KEY, notesJson).apply()
            Log.d(TAG, "💾 Saved to SharedPreferences")
            
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = android.content.ComponentName(context, NotesWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
            
            Log.d(TAG, "🔄 Updating ${appWidgetIds.size} widgets")
            
            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId)
            }
        }
        
        private fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            Log.d(TAG, "🔄 Updating widget ID: $appWidgetId")
            
            val views = RemoteViews(context.packageName, R.layout.widget_notes)
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val notesJson = prefs.getString(NOTES_KEY, "[]")
            
            val preview = notesJson?.take(100) ?: "null"
            Log.d(TAG, "📄 Retrieved from SharedPreferences: $preview")
            
            val notesText = formatAllNotes(notesJson)
            Log.d(TAG, "📝 Formatted text:\n$notesText")
            
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
            Log.d(TAG, "✅ Widget $appWidgetId updated")
        }
        
        private fun formatAllNotes(notesJson: String?): String {
            Log.d(TAG, "📝 formatAllNotes called")
            
            if (notesJson.isNullOrEmpty() || notesJson == "[]") {
                Log.d(TAG, "⚠️ No notes found")
                return "• Нет заметок"
            }
            
            return try {
                val notesArray = JSONArray(notesJson)
                Log.d(TAG, "📊 Notes array size: ${notesArray.length()}")
                
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
                Log.d(TAG, "✅ Formatted ${notesArray.length()} notes")
                result
                
            } catch (e: Exception) {
                Log.e(TAG, "❌ Error formatting notes", e)
                "• Ошибка загрузки"
            }
        }
    }
    
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        Log.d(TAG, "📱 onUpdate called for ${appWidgetIds.size} widgets")
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }
    
    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        Log.d(TAG, "✅ Widget enabled")
    }
    
    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        Log.d(TAG, "👋 Widget disabled")
    }
    
    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        updateAppWidget(context, appWidgetManager, appWidgetId)
    }
}
