package com.visioncameradocumentdetector

import com.facebook.react.bridge.*
import org.opencv.core.*
import org.opencv.core.Point
import org.opencv.imgcodecs.Imgcodecs
import org.opencv.imgproc.Imgproc
import java.io.File


class DocumentDetectorManager(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {



    @ReactMethod
    fun transformImage(imagePath: String, bounds: ReadableArray, promise: Promise) {

        try {
            val scaleFactor = 1.5
            val points = bounds.toArrayList().map { element ->
                when (element) {
                    is Double -> element * scaleFactor
                    is Int -> element.toDouble() * scaleFactor
                    is String -> element.toDoubleOrNull()?.let { it * scaleFactor } ?: 0.0
                    else -> 0.0 // Default value for unsupported types
                }
            }.toDoubleArray()


            val coordinates = arrayOf(
                Point(points[4], points[5]), // topLeft
                Point(points[0], points[1]), // topRight
                Point(points[6], points[7]), // bottomLeft
                Point(points[2], points[3]), // bottomRight
            )

            val sourcePoints =
                MatOfPoint2f(coordinates[0], coordinates[1], coordinates[2], coordinates[3])

            val image = Imgcodecs.imread(imagePath)


            val width = Math.max(
                coordinates[1].x - coordinates[0].x,
                coordinates[3].x - coordinates[2].x
            ).toInt()
            val height = Math.max(
                coordinates[2].y - coordinates[0].y,
                coordinates[3].y - coordinates[1].y
            ).toInt()
            val destinationPoints = MatOfPoint2f(
                Point(0.0, 0.0),
                Point(width.toDouble(), 0.0),
                Point(0.0, height.toDouble()),
                Point(width.toDouble(), height.toDouble())
            )

            // Perform the affine transformation
            val transformationMatrix =
                Imgproc.getPerspectiveTransform(sourcePoints, destinationPoints)
            val croppedImage = Mat()
            Imgproc.warpPerspective(
                image,
                croppedImage,
                transformationMatrix,
                Size(width.toDouble(), height.toDouble())
            )

            var file = File(imagePath)

            // Save the cropped image to a new file
            val croppedImagePath = "cropped_" + file.name
            Imgcodecs.imwrite(file.parent + '/' + croppedImagePath, croppedImage)
            val oldFile = File(imagePath)

            oldFile.delete()

            promise.resolve(file.parent + '/' + croppedImagePath)
        }
         catch (e: Exception) {
            e.printStackTrace()
            promise.resolve(imagePath)
        }
    }

    @ReactMethod
    fun rotateImage(imagePath: String, promise: Promise) {
        try {
            // Load the image
            val inputImage: Mat = Imgcodecs.imread(imagePath)

            // Rotate the image by 90 degrees
            val rotatedImage = Mat()
            Core.transpose(inputImage, rotatedImage)
            Core.flip(rotatedImage, rotatedImage, 1)

            var file = File(imagePath)

            // Save the rotated image to a new file
            val rotatedImagePath = "rotated_" + file.name
            Imgcodecs.imwrite( file.parent + '/' + rotatedImagePath, rotatedImage)

            val oldFile = File(imagePath)

            oldFile.delete()

            promise.resolve(file.parent + '/' + rotatedImagePath)

        } catch (e: Exception) {
            e.printStackTrace()
            promise.resolve(imagePath)
        }
    }

    override fun getName() = "DocumentDetectorManager"

}





