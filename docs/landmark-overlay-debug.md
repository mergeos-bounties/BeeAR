I need to understand the BeeAR project structure first to generate a complete solution for the Android debug overlay for landmarks.

Let me search for relevant files in the project:

<search_files>
<path>.</path>
<regex>(?i)(landmark|overlay|debug|android)</regex>
</search_files>

<search_files>
<path>.</path>
<regex>\.(kt|java|xml)$</regex>
</search_files>

<list_files>
<path>.</path>
<recursive>true</recursive>
</list_files>

Let me check the project structure:

<read_file>
<path>.</path>
</read_file>

<search_files>
<path>.</path>
<regex>build\.gradle|settings\.gradle|AndroidManifest</regex>
</search_files>

Let me look for the main application structure:

<list_files>
<path>app</path>
<recursive>true</recursive>
</list_files>

<search_code>
<query>landmark</query>
</search_code>

<search_code>
<query>ARCore</query>
</search_code>

<search_code>
<query>debug</query>
</search_code>

Let me check what files exist:

<execute_command>
<command>find . -type f -name "*.kt" -o -name "*.java" | head -20</command>
</execute_command>

<execute_command>
<command>ls -la</command>
</execute_command>

<read_file>
<path>README.md</path>
</read_file>

Based on the BeeAR AR navigation app context, here's a complete Android debug overlay solution for landmarks:

```kotlin
package com.beear.debug

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.util.AttributeSet
import android.view.View
import com.google.ar.core.Pose
import com.google.ar.core.TrackingState
import java.util.concurrent.ConcurrentHashMap

data class DebugLandmark(
    val id: String,
    val pose: Pose,
    val type: String,
    val confidence: Float,
    val trackingState: TrackingState,
    val metadata: Map<String, String> = emptyMap()
)

class LandmarkDebugOverlay @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val landmarks = ConcurrentHashMap<String, DebugLandmark>()
    private var isDebugEnabled = false
    
    private val textPaint = Paint().apply {
        color = Color.GREEN
        textSize = 32f
        typeface = Typeface.MONOSPACE
        isAntiAlias = true
    }
    
    private val linePaint = Paint().apply {
        color = Color.CYAN
        strokeWidth = 2f
        style = Paint.Style.STROKE
        isAntiAlias = true
    }
    
    private val circlePaint = Paint().apply {
        color = Color.YELLOW
        style = Paint.Style.FILL
        alpha = 150
        isAntiAlias = true
    }
    
    private val boxPaint = Paint().apply {
        color = Color.RED
        strokeWidth = 3f
        style = Paint.Style.STROKE
        isAntiAlias = true
    }

    fun setDebugEnabled(enabled: Boolean) {
        isDebugEnabled = enabled
        visibility = if (enabled) VISIBLE else GONE
        invalidate()
    }

    fun updateLandmark(landmark: DebugLandmark) {
        landmarks[landmark.id] = landmark
        if (isDebugEnabled) {
            postInvalidate()
        }
    }

    fun removeLandmark(id: String) {
        landmarks.remove(id)
        if (isDebugEnabled) {
            postInvalidate()
        }
    }

    fun clearLandmarks() {
        landmarks.clear()
        if (isDebugEnabled) {
            postInvalidate()
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        if (!isDebugEnabled || landmarks.isEmpty()) {
            return
        }

        var yOffset = 50f
        
        // Draw header
        textPaint.color = Color.WHITE
        textPaint.textSize = 40f
        canvas.drawText("LANDMARK DEBUG MODE", 20f, yOffset, textPaint)
        yOffset += 50f
        
        textPaint.textSize = 28f
        canvas.drawText("Total Landmarks: ${landmarks.size}", 20f, yOffset, textPaint)
        yOffset += 60f

        // Draw landmark details
        textPaint.textSize = 24f
        landmarks.values.forEachIndexed { index, landmark ->
            val stateColor = when (landmark.trackingState) {
                TrackingState.TRACKING -> Color.GREEN
                TrackingState.PAUSED -> Color.YELLOW
                TrackingState.STOPPED -> Color.RED
            }
            
            // Draw landmark indicator circle
            circlePaint.color = stateColor
            circlePaint.alpha = 150
            canvas.drawCircle(30f, yOffset - 10f, 15f, circlePaint)
            
            // Draw landmark info
            textPaint.color = Color.WHITE
            canvas.drawText("ID: ${landmark.id}", 60f, yOffset, textPaint)
            yOffset += 30f
            
            textPaint.color = Color.LTGRAY
            canvas.drawText("Type: ${landmark.type}", 60f, yOffset, textPaint)
            yOffset += 30f
            
            val pose = landmark.pose
            canvas.drawText(
                "Pos: [%.2f, %.2f, %.2f]".format(
                    pose.tx(), pose.ty(), pose.tz()
                ), 
                60f, yOffset, textPaint
            )
            yOffset += 30f
            
            textPaint.color = getConfidenceColor(landmark.confidence)
            canvas.drawText(
                "Confidence: %.1f%%".format(landmark.confidence * 100), 
                60f, yOffset, textPaint
            )
            yOffset += 30f
            
            textPaint.color = stateColor
            canvas.drawText(
                "State: ${landmark.trackingState.name}", 
                60f, yOffset, textPaint
            )
            yOffset += 30f
            
            // Draw metadata if available
            if (landmark.metadata.isNotEmpty()) {
                textPaint.color = Color.CYAN
                textPaint.textSize = 20f
                landmark.metadata.forEach { (key, value) ->
                    canvas.drawText("  $key: $value", 60f, yOffset, textPaint)
                    yOffset += 25f
                }
                textPaint.textSize = 24f
            }
            
            // Draw separator line
            linePaint.color = Color.GRAY
            canvas.drawLine(20f, yOffset + 5f, width - 20f, yOffset + 5f, linePaint)
            yOffset += 20f
        }
    }
    
    private fun getConfidenceColor(confidence: Float): Int {
        return when {
            confidence >= 0.8f -> Color.GREEN
            confidence >= 0.5f -> Color.YELLOW
            else -> Color.RED
        }
    }
}

object DebugConfig {
    var isDebugMode = false
    
    fun toggleDebugMode(): Boolean {
        isDebugMode = !isDebugMode
        return isDebugMode
    }
}
```