package com.lumoai.app

import android.content.ContentResolver
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.lumoai.app.specs.NativeImageResizeSpec
import java.io.File
import java.io.FileOutputStream

/**
 * Decodes an image URI to at most MAX_DIM×MAX_DIM using BitmapFactory.inSampleSize
 * (never loads the full bitmap into memory), compresses to JPEG, and writes the result
 * to the given destination path.
 */
@ReactModule(name = NativeImageResizeSpec.NAME)
class ImageResizeModule(reactContext: ReactApplicationContext) :
    NativeImageResizeSpec(reactContext) {

    companion object {
        private const val MAX_DIM = 1280
        private const val JPEG_QUALITY = 85
    }

    override fun getName(): String = NativeImageResizeSpec.NAME

    override fun resizeImage(uri: String, destPath: String, promise: Promise) {
        try {
            val parsedUri = Uri.parse(uri)
            val resolver: ContentResolver = reactApplicationContext.contentResolver

            // Step 1: read only dimensions (zero heap cost)
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            openStream(resolver, parsedUri)?.use { stream ->
                BitmapFactory.decodeStream(stream, null, bounds)
            } ?: run {
                promise.reject("ERR_OPEN", "Cannot open stream for URI: $uri")
                return
            }

            val srcW = bounds.outWidth
            val srcH = bounds.outHeight
            if (srcW <= 0 || srcH <= 0) {
                promise.reject("ERR_BOUNDS", "Cannot read image dimensions from URI: $uri")
                return
            }

            // Step 2: compute inSampleSize so decoded image fits within MAX_DIM
            val sampleSize = computeSampleSize(srcW, srcH, MAX_DIM)

            val decodeOpts = BitmapFactory.Options().apply {
                inSampleSize = sampleSize
                inPreferredConfig = Bitmap.Config.ARGB_8888
            }

            val bitmap: Bitmap = openStream(resolver, parsedUri)?.use { stream ->
                BitmapFactory.decodeStream(stream, null, decodeOpts)
            } ?: run {
                promise.reject("ERR_DECODE", "Failed to decode bitmap from URI: $uri")
                return
            }

            // Step 3: write JPEG
            val destFile = File(destPath)
            destFile.parentFile?.mkdirs()
            FileOutputStream(destFile).use { out ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, out)
            }
            bitmap.recycle()

            promise.resolve(destPath)
        } catch (e: Exception) {
            promise.reject("ERR_RESIZE", e.message ?: "Unknown error", e)
        }
    }

    private fun openStream(resolver: ContentResolver, uri: Uri) =
        when (uri.scheme) {
            ContentResolver.SCHEME_CONTENT -> resolver.openInputStream(uri)
            ContentResolver.SCHEME_FILE    -> File(uri.path!!).inputStream()
            else                           -> File(uri.toString()).inputStream()
        }

    private fun computeSampleSize(w: Int, h: Int, maxDim: Int): Int {
        var sample = 1
        while (w / (sample * 2) >= maxDim || h / (sample * 2) >= maxDim) {
            sample *= 2
        }
        return sample
    }
}
