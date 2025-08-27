// Tipos para APIs del navegador
declare global {
  interface Navigator {
    serial: Serial
  }

  // API de pantallas múltiples
  interface Window {
    getScreenDetails(): Promise<ScreenDetails>
  }

  interface ScreenDetails {
    screens: Screen[]
  }

  interface Screen {
    id: string
    width: number
    height: number
    isPrimary: boolean
    isInternal: boolean
    label?: string
  }

  interface Serial {
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>
    getPorts(): Promise<SerialPort[]>
  }

  interface SerialPortRequestOptions {
    filters?: SerialPortFilter[]
  }

  interface SerialPortFilter {
    usbVendorId?: number
    usbProductId?: number
  }

  interface SerialPort {
    readable: ReadableStream<Uint8Array> | null
    writable: WritableStream<Uint8Array> | null
    open(options: SerialOptions): Promise<void>
    close(): Promise<void>
    getInfo(): SerialPortInfo
  }

  interface SerialOptions {
    baudRate: number
    dataBits?: number
    stopBits?: number
    parity?: string
    bufferSize?: number
    flowControl?: string
  }

  interface SerialPortInfo {
    usbVendorId?: number
    usbProductId?: number
  }
}

export {}
