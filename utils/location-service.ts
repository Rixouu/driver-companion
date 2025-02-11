export class LocationService {
  private watchId: number | null = null

  async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"))
        return
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      })
    })
  }

  watchPosition(onChange: (position: GeolocationPosition) => void): void {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported")
    }

    this.watchId = navigator.geolocation.watchPosition(
      onChange,
      (error) => console.error("Error watching position:", error),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    )
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }
}

