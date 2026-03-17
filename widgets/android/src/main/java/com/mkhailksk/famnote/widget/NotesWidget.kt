package com.mkhailksk.famnote.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.mkhailksk.famnote.MainActivity
import org.json.JSONArray
import org.json.JSONObject

class NotesWidget : AppWidgetProvider() {
    
    companion object {
        const val PREFS_NAME = "com.mkhailksk.famnote.widget"
        const val NOTES_KEY = "widget_notes"
        const val ACTION_OPEN_NOTE = "com.mkhailksk.famnote.widget.OPEN_NOTE"
        const val ACTION_ADD_NOTE = "com.mkhailksk.famnote.widget.ADD_NOTE"
        const val EXTRA_NOTE_ID = "note_id"
        
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
            
            // Обработчик для кнопки "+"
            val addIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                putExtra("action", "create_note")
                putExtra("folder", "Главная")
            }
            val addPendingIntent = PendingIntent.getActivity(
                context, appWidgetId, addIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_add_button, addPendingIntent)
            
            // Обработчик клика по заголовку (открыть приложение)
            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val openAppPendingIntent = PendingIntent.getActivity(
                context, appWidgetId, openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_title, openAppPendingIntent)
            
            // Добавляем заметки в контейнер
            try {
                val notesArray = JSONArray(notesJson)
                val notesContainer = RemoteViews(context.packageName, R.layout.widget_notes)
                
                // Очищаем контейнер
                notesContainer.removeAllViews(R.id.widget_notes_container)
                
                // Добавляем каждую заметку
                for (i in 0 until notesArray.length()) {
                    val note = notesArray.getJSONObject(i)
                    val noteView = createNoteView(context, note, appWidgetId)
                    notesContainer.addView(R.id.widget_notes_container, noteView)
                }
                
                // Если нет заметок, показываем сообщение
                if (notesArray.length() == 0) {
                    val emptyView = RemoteViews(context.packageName, R.layout.widget_note_item)
                    emptyView.setTextViewText(R.id.note_title, "Нет заметок")
                    emptyView.setTextViewText(R.id.note_preview, "Нажмите + чтобы создать")
                    emptyView.setViewVisibility(R.id.note_preview, android.view.View.VISIBLE)
                    notesContainer.addView(R.id.widget_notes_container, emptyView)
                }
                
                appWidgetManager.updateAppWidget(appWidgetId, notesContainer)
                
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        
        private fun createNoteView(context: Context, note: JSONObject, appWidgetId: Int): RemoteViews {
            val noteView = RemoteViews(context.packageName, R.layout.widget_note_item)
            
            val noteId = note.optString("id", "")
            val title = note.optString("title", "Без названия")
            val content = note.optString("content", "...")
            
            noteView.setTextViewText(R.id.note_title, title)
            noteView.setTextViewText(R.id.note_preview, content.take(50) + if (content.length > 50) "..." else "")
            
            // Intent для открытия конкретной заметки
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                putExtra("action", "edit_note")
                putExtra("note_id", noteId)
                putExtra("note_data", note.toString())
            }
            
            val pendingIntent = PendingIntent.getActivity(
                context, (appWidgetId.toString() + noteId).hashCode(), intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            noteView.setOnClickPendingIntent(R.id.note_item_container, pendingIntent)
            
            return noteView
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
    
    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        
        when (intent.action) {
            ACTION_OPEN_NOTE -> {
                val noteId = intent.getStringExtra(EXTRA_NOTE_ID)
                val openIntent = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    putExtra("action", "edit_note")
                    putExtra("note_id", noteId)
                }
                context.startActivity(openIntent)
            }
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
