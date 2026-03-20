package com.mkhailksk.famnotes.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.util.Log
import android.widget.Toast
import com.mkhailksk.famnotes.MainActivity
import com.mkhailksk.famnotes.R
import org.json.JSONArray
import java.io.File

class NotesWidget : AppWidgetProvider() {
    
    companion object {
        private const val TAG = "FamNotesWidget"
        private var lastToastTime = 0L
        
        fun showDebugToast(context: Context, message: String) {
            try {
                val now = System.currentTimeMillis()
                if (now - lastToastTime > 3000) {
                    Toast.makeText(context, message, Toast.LENGTH_LONG).show()
                    lastToastTime = now
                }
                Log.d(TAG, message)
            } catch (e: Exception) {
                Log.e(TAG, "Toast error", e)
            }
        }
        
        fun updateWidgetNotes(context: Context, notesJson: String) {
            Log.d(TAG, "📥 updateWidgetNotes called")
            showDebugToast(context, "Виджет: получены данные (${notesJson.length} символов)")
            
            try {
                // Сохраняем в файл
                val file = File(context.filesDir, "widget_notes.json")
                file.writeText(notesJson)
                Log.d(TAG, "💾 Saved to: ${file.absolutePath}, exists: ${file.exists()}, size: ${file.length()}")
                showDebugToast(context, "Виджет: данные сохранены в файл")
                
                // Обновляем виджеты
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val componentName = android.content.ComponentName(context, NotesWidget::class.java)
                val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
                
                Log.d(TAG, "Found ${appWidgetIds.size} widgets")
                showDebugToast(context, "Виджет: найдено виджетов: ${appWidgetIds.size}")
                
                if (appWidgetIds.isNotEmpty()) {
                    val widget = NotesWidget()
                    widget.onUpdate(context, appWidgetManager, appWidgetIds)
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error updating widget", e)
                showDebugToast(context, "Виджет: ошибка - ${e.message}")
            }
        }
        
        private fun getNotesFromFile(context: Context): String {
            try {
                val file = File(context.filesDir, "widget_notes.json")
                Log.d(TAG, "Looking for file: ${file.absolutePath}, exists: ${file.exists()}")
                
                if (file.exists()) {
                    val content = file.readText()
                    Log.d(TAG, "File content length: ${content.length}")
                    return content
                } else {
                    Log.d(TAG, "File does not exist")
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
        showDebugToast(context, "Виджет: onUpdate вызван для ${appWidgetIds.size} виджетов")
        
        for (appWidgetId in appWidgetIds) {
            try {
                val views = RemoteViews(context.packageName, R.layout.widget_notes)
                
                val notesJson = getNotesFromFile(context)
                Log.d(TAG, "Notes JSON: ${notesJson.take(200)}")
                
                val notesText = formatAllNotes(notesJson)
                Log.d(TAG, "Formatted text: $notesText")
                
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
                showDebugToast(context, "Виджет: обновлен")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error updating widget $appWidgetId", e)
                showDebugToast(context, "Виджет: ошибка - ${e.message}")
            }
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
            "• Ошибка загрузки: ${e.message}"
        }
    }
    
    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        showDebugToast(context, "Виджет: включен")
    }
    
    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        showDebugToast(context, "Виджет: отключен")
    }
}
