package com.visioncameradocumentdetector

import org.opencv.core.MatOfPoint2f
import org.opencv.core.Point
import java.util.*
import kotlin.Comparator

class Quadrilateral(val contour: MatOfPoint2f, val points: Array<Point>)


fun sortPoints(src: Array<Point>): Array<Point> {
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
