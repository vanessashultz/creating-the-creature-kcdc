import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

declare const phidget22: any;

@Component({
  selector: 'app-example2',
  imports: [FormsModule],
  templateUrl: './example2.html',
  styleUrls: ['../phidget-shared.css', './example2.css'],
})
export class Example2 {
  // Form state, bound to the connection inputs via ngModel
  serverAddress = signal('localhost');
  serverPort = signal(8989);

  // Connection + hardware state, read by the template
  connected = signal(false);
  statusText = signal('Disconnected');
  ratio = signal<number | null>(null);
  rawState = signal('Waiting for connection...');

  // Voltage ratios from this sensor type range roughly 0 - 1
  get ratioText(): string {
    const value = this.ratio();
    return value === null ? '--' : value.toFixed(4);
  }

  get ratioBarWidth(): string {
    const value = this.ratio();
    if (value === null) {
      return '0%';
    }
    const clampedRatio = Math.min(Math.max(value, 0), 1);
    return `${clampedRatio * 100}%`;
  }

  // Phidget object — created fresh on each connection attempt
  private voltageRatioInput: any = null;

  async connect(): Promise<void> {
    this.updateRawState({ status: 'Connecting...' });

    try {
      const connection = new phidget22.NetworkConnection({
        hostname: this.serverAddress(),
        port: this.serverPort(),
        onError: (code: number, message: string) =>
          this.updateRawState({ connectionError: { code, message } }),
        onConnect: () => this.updateRawState({ status: 'Connected' }),
        onDisconnect: () => {
          this.setConnected(false);
          this.updateRawState({ status: 'Disconnected from server' });
        },
      });

      await connection.connect();

      this.voltageRatioInput = new phidget22.VoltageRatioInput();

      this.voltageRatioInput.isHubPortDevice = true;
      this.voltageRatioInput.hubPort = 0;

      // Any channel on any hub connected to the server — adjust if you need
      // to target a specific device/channel.
      this.voltageRatioInput.onAttach = () => {
        this.updateRawState({
          status: 'Attached',
          deviceName: this.voltageRatioInput.deviceName,
          serialNumber: this.voltageRatioInput.deviceSerialNumber,
          channel: this.voltageRatioInput.channel,
          voltageRatio: this.voltageRatioInput.voltageRatio,
        });
        this.ratio.set(this.voltageRatioInput.voltageRatio);
      };

      this.voltageRatioInput.onDetach = () => {
        this.updateRawState({ status: 'Device detached' });
        this.ratio.set(null);
      };

      this.voltageRatioInput.onVoltageRatioChange = (voltageRatio: number) => {
        this.ratio.set(voltageRatio);
        this.updateRawState({
          status: 'Voltage ratio change',
          deviceName: this.voltageRatioInput.deviceName,
          serialNumber: this.voltageRatioInput.deviceSerialNumber,
          channel: this.voltageRatioInput.channel,
          voltageRatio,
          timestamp: new Date().toISOString(),
        });
      };

      await this.voltageRatioInput.open(5000);

      this.setConnected(true);
    } catch (error) {
      this.updateRawState({ connectionError: String(error) });
      this.setConnected(false);
    }
  }

  async disconnect(): Promise<void> {
    if (this.voltageRatioInput) {
      try {
        await this.voltageRatioInput.close();
      } catch {
        // Channel may already be closed — nothing to do here.
      }
      this.voltageRatioInput = null;
    }

    this.ratio.set(null);
    this.setConnected(false);
    this.updateRawState({ status: 'Disconnected' });
  }

  private setConnected(isConnected: boolean): void {
    this.connected.set(isConnected);
    this.statusText.set(isConnected ? 'Connected' : 'Disconnected');
  }

  private updateRawState(stateObject: unknown): void {
    this.rawState.set(JSON.stringify(stateObject, null, 2));
  }
}
