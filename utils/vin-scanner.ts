import Quagga from "@ericblade/quagga2"

export class VinScanner {
  private stream: MediaStream | null = null

  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      videoElement.srcObject = this.stream

      await Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoElement,
          constraints: {
            facingMode: "environment",
          },
        },
        decoder: {
          readers: ["code_128_reader", "ean_reader", "ean_8_reader"],
        },
      })

      Quagga.start()
    } catch (error) {
      console.error("Failed to initialize scanner:", error)
      throw error
    }
  }

  onDetected(callback: (vin: string) => void): void {
    Quagga.onDetected((result) => {
      const code = result.codeResult.code
      if (code && this.isValidVIN(code)) {
        callback(code)
      }
    })
  }

  private isValidVIN(vin: string | null): vin is string {
    if (!vin) return false
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin)
  }

  cleanup(): void {
    Quagga.stop()
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
    }
  }
}

