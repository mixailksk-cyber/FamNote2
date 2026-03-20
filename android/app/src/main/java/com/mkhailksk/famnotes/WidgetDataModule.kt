package com.mkhailksk.famnotes

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.util.Log
import java.io.File

class WidgetDataModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String = "WidgetDataModule"
    
    @ReactMethod
    fun updateWidgetNotes(notesJson: String) {
        Log.d("WidgetDataModule", "📥 updateWidgetNotes called")
        
        try {
            val context = reactApplicationContext.applicationContext
            val file = File(context.filesDir, "widget_notes.json")
            file.writeText(notesJson)
            Log.d("WidgetDataModule", "💾 Saved to: ${file.absolutePath}")
            
            // Обновляем виджет
            val intent = android.content.Intent(context, com.mkhailksk.famnotes.widget.NotesWidget::class.java)
            intent.action = android.appwidget.AppWidgetManager.ACTION_APPWIDGET_UPDATE
            context.sendBroadcast(intent)
            
        } catch (e: Exception) {
            Log.e("WidgetDataModule", "Error", e)
        }
    }
}
