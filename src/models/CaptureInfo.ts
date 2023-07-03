export default class CaptureInfo {
  public bounds: number[]
  public height: number
  public width: number
  public area: number
  public counter?: number
  public previousArea?: number
  public areaStable?: boolean

  constructor (
    bounds = [0, 0, 0, 0, 0, 0, 0, 0],
    height = 0,
    width = 0,
    area = 0,
  ) {
    this.bounds = bounds
    this.height = height
    this.width = width
    this.area = area
    this.counter = 0
    this.previousArea = 0
    this.areaStable = false
  }
}
