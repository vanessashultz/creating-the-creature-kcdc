// Minimal ambient typing for the phidget22 browser SDK, loaded globally via
// a <script> tag in app/root.tsx. The real SDK ships its own richer types,
// but a workshop demo only needs enough shape to avoid `any` everywhere.
export {};

declare global {
  interface Window {
    phidget22: typeof phidget22;
  }

  namespace phidget22 {
    class NetworkConnection {
      constructor(options: {
        hostname: string;
        port: number;
        onError?: (code: number, message: string) => void;
        onConnect?: () => void;
        onDisconnect?: () => void;
      });
      onError: (code: number, message: string) => void;
      onDisconnect: () => void;
      connect(): Promise<void>;
    }

    class DigitalInput {
      isHubPortDevice: boolean;
      hubPort: number;
      deviceName: string;
      deviceSerialNumber: number;
      channel: number;
      state: boolean;
      onAttach: () => void;
      onDetach: () => void;
      onStateChange: (state: boolean) => void;
      open(timeoutMs: number): Promise<void>;
      close(): Promise<void>;
    }

    class VoltageRatioInput {
      isHubPortDevice: boolean;
      hubPort: number;
      deviceName: string;
      deviceSerialNumber: number;
      channel: number;
      voltageRatio: number;
      onAttach: () => void;
      onDetach: () => void;
      onVoltageRatioChange: (voltageRatio: number) => void;
      open(timeoutMs: number): Promise<void>;
      close(): Promise<void>;
    }

    class DigitalOutput {
      isHubPortDevice: boolean;
      hubPort: number;
      deviceName: string;
      deviceSerialNumber: number;
      channel: number;
      state: boolean;
      onAttach: () => void;
      onDetach: () => void;
      open(timeoutMs: number): Promise<void>;
      close(): Promise<void>;
      setState(state: boolean): Promise<void>;
    }
  }
}
