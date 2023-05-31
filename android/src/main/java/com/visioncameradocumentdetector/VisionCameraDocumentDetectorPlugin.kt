package com.visioncameradocumentdetector

import android.annotation.SuppressLint
import android.graphics.*
import android.graphics.Rect
import android.media.Image
import androidx.camera.core.ImageProxy
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.google.mlkit.vision.common.InputImage
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin
import com.visioncameradocumentdetector.services.ImageQualityService
import org.opencv.core.*
import org.opencv.core.Point
import org.opencv.imgproc.Imgproc
import java.util.*
import kotlin.collections.ArrayList


class VisionCameraDocumentDetectorPlugin: FrameProcessorPlugin("documentDetector") {

  var KSIZE_BLUR = 3.0
  val TRUNC_THRESH = 150.0
  val CANNY_THRESH_L = 85.0
  val CANNY_THRESH_U = 185.0
  val CUTOFF_THRESH = 155.0
  var KSIZE_CLOSE = 10.0
  private val morph_kernel = Mat(Size(KSIZE_CLOSE, KSIZE_CLOSE), CvType.CV_8UC1, Scalar(255.0))


  fun flipHorizontal(rectangle: Rect, imageWidth: Int): Rect {
    val flippedRectangle = Rect()
    flippedRectangle.left = imageWidth - rectangle.right // New x1
    flippedRectangle.right = imageWidth - rectangle.left // New x2
    flippedRectangle.top = rectangle.top // New y1
    flippedRectangle.bottom = rectangle.bottom // New y2
    return flippedRectangle
  }

  fun Image.yuvToRgba(): Mat {
    val rgbaMat = Mat()

    if (format == ImageFormat.YUV_420_888
      && planes.size == 3) {

      val chromaPixelStride = planes[1].pixelStride

      if (chromaPixelStride == 2) { // Chroma channels are interleaved
        assert(planes[0].pixelStride == 1)
        assert(planes[2].pixelStride == 2)
        val yPlane = planes[0].buffer
        val uvPlane1 = planes[1].buffer
        val uvPlane2 = planes[2].buffer
        val yMat = Mat(height, width, CvType.CV_8UC1, yPlane)
        val uvMat1 = Mat(height / 2, width / 2, CvType.CV_8UC2, uvPlane1)
        val uvMat2 = Mat(height / 2, width / 2, CvType.CV_8UC2, uvPlane2)
        val addrDiff = uvMat2.dataAddr() - uvMat1.dataAddr()
        if (addrDiff > 0) {
          assert(addrDiff == 1L)
          Imgproc.cvtColorTwoPlane(yMat, uvMat1, rgbaMat, Imgproc.COLOR_YUV2RGBA_NV12)
        } else {
          assert(addrDiff == -1L)
          Imgproc.cvtColorTwoPlane(yMat, uvMat2, rgbaMat, Imgproc.COLOR_YUV2RGBA_NV21)
        }
      } else { // Chroma channels are not interleaved
        val yuvBytes = ByteArray(width * (height + height / 2))
        val yPlane = planes[0].buffer
        val uPlane = planes[1].buffer
        val vPlane = planes[2].buffer

        yPlane.get(yuvBytes, 0, width * height)

        val chromaRowStride = planes[1].rowStride
        val chromaRowPadding = chromaRowStride - width / 2

        var offset = width * height
        if (chromaRowPadding == 0) {
          // When the row stride of the chroma channels equals their width, we can copy
          // the entire channels in one go
          uPlane.get(yuvBytes, offset, width * height / 4)
          offset += width * height / 4
          vPlane.get(yuvBytes, offset, width * height / 4)
        } else {
          // When not equal, we need to copy the channels row by row
          for (i in 0 until height / 2) {
            uPlane.get(yuvBytes, offset, width / 2)
            offset += width / 2
            if (i < height / 2 - 1) {
              uPlane.position(uPlane.position() + chromaRowPadding)
            }
          }
          for (i in 0 until height / 2) {
            vPlane.get(yuvBytes, offset, width / 2)
            offset += width / 2
            if (i < height / 2 - 1) {
              vPlane.position(vPlane.position() + chromaRowPadding)
            }
          }
        }

        val yuvMat = Mat(height + height / 2, width, CvType.CV_8UC1)
        yuvMat.put(0, 0, yuvBytes)
        Imgproc.cvtColor(yuvMat, rgbaMat, Imgproc.COLOR_YUV2RGBA_I420, 4)
      }
    }

    return rgbaMat
  }

  fun imageProxyToMat(imageProxy: ImageProxy): Mat {
    val yBuffer = imageProxy.planes[0].buffer
    val ySize = yBuffer.remaining()
    val yByteArray = ByteArray(ySize)
    yBuffer.get(yByteArray)

    val matYuv = Mat(imageProxy.height, imageProxy.width, CvType.CV_8UC1)
    matYuv.put(0, 0, yByteArray)

    return matYuv
  }

  private fun hull2Points(hull: MatOfInt, contour: MatOfPoint): MatOfPoint? {
    val indexes = hull.toList()
    val points: MutableList<Point> = ArrayList()
    val ctrList: List<Point> = contour.toList()
    for (index in indexes) {
      points.add(ctrList[index])
    }
    val point = MatOfPoint()
    point.fromList(points)
    return point
  }

  private fun sortPoints(src: Array<Point>): Array<Point> {
    val srcPoints: List<Point> = src.toList()

    val result = arrayOf<Point?>(null, null, null, null)

    val sumComparator = Comparator<Point> { lhs, rhs ->
      (lhs.y + lhs.x).compareTo(rhs.y + rhs.x)
    }

    val diffComparator = Comparator<Point> { lhs, rhs ->
      (lhs.y - lhs.x).compareTo(rhs.y - rhs.x)
    }

    // top-left corner = minimal sum
    result[0] = Collections.min(srcPoints, sumComparator)
    // bottom-right corner = maximal sum
    result[2] = Collections.max(srcPoints, sumComparator)
    // top-right corner = minimal difference
    result[1] = Collections.min(srcPoints, diffComparator)
    // bottom-left corner = maximal difference
    result[3] = Collections.max(srcPoints, diffComparator)
    return result as Array<Point>
  }

  private fun findQuadrilateral(mContourList: List<MatOfPoint>): Quadrilateral? {
    for (c in mContourList) {
      val c2f = MatOfPoint2f(*c.toArray())
      val peri = Imgproc.arcLength(c2f, true)
      val approx = MatOfPoint2f()
      Imgproc.approxPolyDP(c2f, approx, 0.02 * peri, true)
      val points = approx.toArray()
      // select biggest 4 angles polygon
      if (approx.rows() == 4) {
        val foundPoints: Array<Point> = sortPoints(points)
        return Quadrilateral(approx, foundPoints)
      }
    }
    return null
  }


  private fun findLargestContours(inputMat: Mat, NUM_TOP_CONTOURS: Int): List<MatOfPoint>? {
    val mHierarchy = Mat()
    val mContourList: List<MatOfPoint> = ArrayList()
    //finding contours - as we are sorting by area anyway, we can use RETR_LIST - faster than RETR_EXTERNAL.
    Imgproc.findContours(
      inputMat,
      mContourList,
      mHierarchy,
      Imgproc.RETR_LIST,
      Imgproc.CHAIN_APPROX_SIMPLE
    )

    // Convert the contours to their Convex Hulls i.e. removes minor nuances in the contour
    val mHullList: MutableList<MatOfPoint> = ArrayList()
    val tempHullIndices = MatOfInt()
    for (i in mContourList.indices) {
      Imgproc.convexHull(mContourList[i], tempHullIndices)
      hull2Points(tempHullIndices, mContourList[i])?.let { mHullList.add(it) }
    }
    // Release mContourList as its job is done
    for (c in mContourList) c.release()
    tempHullIndices.release()
    mHierarchy.release()
    if (mHullList.size != 0) {
      Collections.sort(mHullList,
        Comparator<MatOfPoint?> { lhs, rhs ->
          java.lang.Double.compare(
            Imgproc.contourArea(rhs),
            Imgproc.contourArea(lhs)
          )
        })
      return mHullList.subList(0, Math.min(mHullList.size, NUM_TOP_CONTOURS))
    }
    return null
  }

  fun detectLargestQuadrilateral(originalMat: Mat): Quadrilateral? {
//    Imgproc.cvtColor(originalMat, originalMat, Imgproc.COLOR_BGR2GRAY, 4)

    // Just OTSU/Binary thresholding is not enough.
    //Imgproc.threshold(mGrayMat, mGrayMat, 150, 255, THRESH_BINARY + THRESH_OTSU);

    /*
        *  1. We shall first blur and normalize the image for uniformity,
        *  2. Truncate light-gray to white and normalize,
        *  3. Apply canny edge detection,
        *  4. Cutoff weak edges,
        *  5. Apply closing(morphology), then proceed to finding contours.
        */

    // step 1.
    Imgproc.blur(originalMat, originalMat, Size(KSIZE_BLUR, KSIZE_BLUR))
    Core.normalize(originalMat, originalMat, 0.0, 255.0, Core.NORM_MINMAX)
    // step 2.
    // As most papers are bright in color, we can use truncation to make it uniformly bright.
    Imgproc.threshold(originalMat, originalMat, TRUNC_THRESH, 255.0, Imgproc.THRESH_TRUNC)
    Core.normalize(originalMat, originalMat, 0.0, 255.0, Core.NORM_MINMAX)
    // step 3.
    // After above preprocessing, canny edge detection can now work much better.
    Imgproc.Canny(originalMat, originalMat, CANNY_THRESH_U, CANNY_THRESH_L)
    // step 4.
    // Cutoff the remaining weak edges
    Imgproc.threshold(originalMat, originalMat, CUTOFF_THRESH, 255.0, Imgproc.THRESH_TOZERO)
    // step 5.
    // Closing - closes small gaps. Completes the edges on canny image; AND also reduces stringy lines near edge of paper.
    Imgproc.morphologyEx(originalMat, originalMat, Imgproc.MORPH_CLOSE, morph_kernel,
      org.opencv.core.Point(-1.0, -1.0),
      1
    )

    // Get only the 10 largest contours (each approximated to their convex hulls)
    val largestContour: List<MatOfPoint>? = findLargestContours(originalMat, 10)
    if (null != largestContour) {
      findQuadrilateral(largestContour)?.let {
        return it
      }
    }
    return null
  }

  fun getPolygonDefaultPoints(bitmap: Bitmap): ArrayList<PointF> {
    val points: ArrayList<PointF>
    points = ArrayList()
    points.add(PointF(bitmap.width * 0.14f, bitmap.height.toFloat() * 0.13f))
    points.add(PointF(bitmap.width * 0.84f, bitmap.height.toFloat() * 0.13f))
    points.add(PointF(bitmap.width * 0.14f, bitmap.height.toFloat() * 0.83f))
    points.add(PointF(bitmap.width * 0.84f, bitmap.height.toFloat() * 0.83f))
    return points
  }


  override fun callback(frame: ImageProxy, params: Array<Any>): Any? {
    @SuppressLint("UnsafeOptInUsageError")

    val camera: String = if (params.size > 0 && params[0] is String) params[0].toString() else "unknown"
    val rotationDegrees: Int = frame.imageInfo.rotationDegrees
    val mediaImage: Image? = frame.image

    val rotated: Boolean = (rotationDegrees == 90 || rotationDegrees == 270)
    val flipped: Boolean = (camera=="front")

    val array = WritableNativeArray()

    frame.image?.let {
      if (it.format == ImageFormat.YUV_420_888
        && it.planes.size == 3
      ) {
        val originalMat = imageProxyToMat(frame)
        val outputBitmap = Bitmap.createBitmap(originalMat.cols(), originalMat.rows(), Bitmap.Config.ARGB_8888)
        var points: ArrayList<PointF> = ArrayList()
        val pointFs: MutableMap<Int, PointF> = HashMap()
        try {
          detectLargestQuadrilateral(originalMat)?.let{

              val resultArea = Math.abs(Imgproc.contourArea(it.contour))
              val previewArea: Double = (originalMat.rows() * originalMat.cols()).toDouble()
              if (resultArea > previewArea * 0.08) {
                points = ArrayList()
                points.add(PointF(it.points.get(0).x.toFloat(), it.points.get(0).y.toFloat()))
                points.add(PointF(it.points.get(1).x.toFloat(), it.points.get(1).y.toFloat()))
                points.add(PointF(it.points.get(3).x.toFloat(), it.points.get(3).y.toFloat()))
                points.add(PointF(it.points.get(2).x.toFloat(), it.points.get(2).y.toFloat()))
              } else {
                points = getPolygonDefaultPoints(outputBitmap)
              }
            } ?: run {
              points = getPolygonDefaultPoints(outputBitmap)
            }

            var index = -1
            val map = WritableNativeMap()
            val bounds = WritableNativeArray()
            for (pointF in points) {
              pointFs[++index] = pointF
              bounds.pushInt(pointF.x.toInt())
              bounds.pushInt(pointF.y.toInt())
            }
          map.putArray("bounds", bounds)
          array.pushMap(map)



        } catch (e: Exception) {

        }

      } else {
        // Manage other image formats
        // TODO - https://developer.android.com/reference/android/media/Image.html
      }
    }

    return array
  }
}
