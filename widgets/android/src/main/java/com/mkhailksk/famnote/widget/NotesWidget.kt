package com.mkhailksk.famnote.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.mkhailksk.famnote.MainActivity
import com.mkhailksk.famnote.R

class NotesWidget : AppWidgetProvider() {
    
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
        // Создаем базовый вид
        val views = RemoteViews(context.packageName, R.layout.widget_notes)
        
        // Intent для открытия приложения
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Устанавливаем клик на весь виджет
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
        
        // Устанавливаем текст
        views.setTextViewText(R.id.widget_text, "FamNote\nНажмите чтобы открыть")
        
        // Обновляем виджет
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
