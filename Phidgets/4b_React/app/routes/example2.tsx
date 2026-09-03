import { useRef, useState } from "react";
import type { Route } from "./+types/example2";
import "../phidget-examples.css";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Phidget Button + Voltage Ratio Monitor" }];
}

export default function Example2() {
  // Form fields
  const [serverAddress, setServerAddress] = useState("localhost");
  const [serverPort, setServerPort] = useState("8989");

  // Connection + display state
  const [isConnected, setIsConnected] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [voltageRatio, setVoltageRatio] = useState<number | null>(null);
  const [rawState, setRawState] = useState<unknown>("Waiting for connection...");

  // The Phidget channel objects — kept in refs so re-renders don't recreate them
  const digitalInputRef = useRef<phidget22.DigitalInput | null>(null);
  const voltageRatioInputRef = useRef<phidget22.VoltageRatioInput | null>(null);

  function updateRawStatePanel(stateObject: unknown) {
    setRawState(stateObject);
  }

  async function connectToPhidgetServer(address: string, port: number) {
    const connection = new window.phidget22.NetworkConnection({
      hostname: address,
      port: port,
      onError: (code, message) => updateRawStatePanel({ connectionError: { code, message } }),
      onConnect: () => updateRawStatePanel({ status: "Connected" }),
      onDisconnect: () => {
        setIsConnected(false);
        updateRawStatePanel({ status: "Disconnected from server" });
      },
    });

    await connection.connect();

    const digitalInput = new window.phidget22.DigitalInput();
    digitalInputRef.current = digitalInput;

    digitalInput.isHubPortDevice = true;
    digitalInput.hubPort = 0;

    // Any channel on any hub connected to the server — adjust if you need
    // to target a specific device/channel.
    digitalInput.onAttach = () => {
      updateRawStatePanel({
        status: "Attached",
        deviceName: digitalInput.deviceName,
        serialNumber: digitalInput.deviceSerialNumber,
        channel: digitalInput.channel,
        state: digitalInput.state,
      });
      setIsButtonPressed(digitalInput.state === true);
    };

    digitalInput.onDetach = () => {
      updateRawStatePanel({ status: "Device detached" });
      setIsButtonPressed(false);
    };

    digitalInput.onStateChange = (state) => {
      setIsButtonPressed(!state);
      updateRawStatePanel({
        status: "State change",
        deviceName: digitalInput.deviceName,
        serialNumber: digitalInput.deviceSerialNumber,
        channel: digitalInput.channel,
        state,
        timestamp: new Date().toISOString(),
      });
    };

    await digitalInput.open(5000);

    const voltageRatioInput = new window.phidget22.VoltageRatioInput();
    voltageRatioInputRef.current = voltageRatioInput;

    voltageRatioInput.isHubPortDevice = true;
    voltageRatioInput.hubPort = 0;

    // Any channel on any hub connected to the server — adjust if you need
    // to target a specific device/channel.
    voltageRatioInput.onAttach = () => {
      updateRawStatePanel({
        status: "Attached",
        deviceName: voltageRatioInput.deviceName,
        serialNumber: voltageRatioInput.deviceSerialNumber,
        channel: voltageRatioInput.channel,
        voltageRatio: voltageRatioInput.voltageRatio,
      });
      setVoltageRatio(voltageRatioInput.voltageRatio);
    };

    voltageRatioInput.onDetach = () => {
      updateRawStatePanel({ status: "Device detached" });
      setVoltageRatio(null);
    };

    voltageRatioInput.onVoltageRatioChange = (ratio) => {
      setVoltageRatio(ratio);
      updateRawStatePanel({
        status: "Voltage ratio change",
        deviceName: voltageRatioInput.deviceName,
        serialNumber: voltageRatioInput.deviceSerialNumber,
        channel: voltageRatioInput.channel,
        voltageRatio: ratio,
        timestamp: new Date().toISOString(),
      });
    };

    await voltageRatioInput.open(5000);

    setIsConnected(true);
  }

  async function disconnectFromPhidgetServer() {
    if (digitalInputRef.current) {
      try {
        await digitalInputRef.current.close();
      } catch (error) {
        // Channel may already be closed — nothing to do here.
      }
      digitalInputRef.current = null;
    }
    if (voltageRatioInputRef.current) {
      try {
        await voltageRatioInputRef.current.close();
      } catch (error) {
        // Channel may already be closed — nothing to do here.
      }
      voltageRatioInputRef.current = null;
    }
    setIsButtonPressed(false);
    setVoltageRatio(null);
    setIsConnected(false);
    updateRawStatePanel({ status: "Disconnected" });
  }

  async function handleConnectSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = serverAddress.trim();
    const port = parseInt(serverPort, 10);

    try {
      updateRawStatePanel({ status: "Connecting..." });
      await connectToPhidgetServer(address, port);
    } catch (error) {
      updateRawStatePanel({ connectionError: String(error) });
      setIsConnected(false);
    }
  }

  // Voltage ratios from this sensor type range roughly 0 - 1
  const clampedRatio = voltageRatio === null ? 0 : Math.min(Math.max(voltageRatio, 0), 1);

  return (
    <div className="phidget-page">
      <h1>Phidget Button + Voltage Ratio Monitor</h1>

      <section>
        <form className="connection-form" onSubmit={handleConnectSubmit}>
          <label>
            Server address
            <input
              type="text"
              value={serverAddress}
              onChange={(event) => setServerAddress(event.target.value)}
              disabled={isConnected}
            />
          </label>
          <label>
            Port
            <input
              type="number"
              value={serverPort}
              onChange={(event) => setServerPort(event.target.value)}
              disabled={isConnected}
              style={{ width: "80px" }}
            />
          </label>
          <button type="submit" disabled={isConnected}>
            Connect
          </button>
          <button type="button" disabled={!isConnected} onClick={disconnectFromPhidgetServer}>
            Disconnect
          </button>
        </form>
        <div className="status-line">
          Status: <span className={isConnected ? "connected" : "disconnected"}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </section>

      <section>
        <h2>Button State</h2>
        <div id="buttonVisual" className={isButtonPressed ? "pressed" : "neutral"}>
          {isButtonPressed ? "PRESSED" : "NEUTRAL"}
        </div>
      </section>

      <section>
        <h2>Voltage Ratio</h2>
        <div id="ratioVisual">
          <div id="ratioValue">{voltageRatio === null ? "--" : voltageRatio.toFixed(4)}</div>
          <div id="ratioBarTrack">
            <div id="ratioBarFill" style={{ width: `${clampedRatio * 100}%` }} />
          </div>
        </div>
      </section>

      <section>
        <h2>Raw Phidget State</h2>
        <div id="rawStatePanel">
          {typeof rawState === "string" ? rawState : JSON.stringify(rawState, null, 2)}
        </div>
      </section>
    </div>
  );
}
