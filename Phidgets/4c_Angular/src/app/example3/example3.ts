import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

declare const phidget22: any;

@Component({
  selector: 'app-example3',
  imports: [FormsModule],
  templateUrl: './example3.html',
  styleUrls: ['../phidget-shared.css', './example3.css'],
})
export class Example3 {
  // Form state, bound to the connection inputs via ngModel
  serverAddress = signal('localhost');
  serverPort = signal(8989);

  // Connection + hardware state, read by the template
  connected = signal(false);
  statusText = signal('Disconnected');
  outputOn = signal(false);
  rawState = signal('Waiting for connection...');

  // Phidget object — created fresh on each connection attempt
  private voltageOutput: any = null;

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

      this.voltageOutput = new phidget22.VoltageOutput();

      this.voltageOutput.isHubPortDevice = true;
      this.voltageOutput.hubPort = 0;

      // Any channel on any hub connected to the server — adjust if you need
      // to target a specific device/channel.
      this.voltageOutput.onAttach = () => {
        this.updateRawState({
          status: 'Attached',
          deviceName: this.voltageOutput.deviceName,
          serialNumber: this.voltageOutput.deviceSerialNumber,
          channel: this.voltageOutput.channel,
          enabled: this.voltageOutput.enabled,
        });
        this.outputOn.set(this.voltageOutput.enabled === true);
      };

      this.voltageOutput.onDetach = () => {
        this.updateRawState({ status: 'Device detached' });
        this.outputOn.set(false);
      };

      await this.voltageOutput.open(5000);
      await this.voltageOutput.setVoltage(4); // Set the voltage as soon as the channel is open

      this.setConnected(true);
    } catch (error) {
      this.updateRawState({ connectionError: String(error) });
      this.setConnected(false);
    }
  }

  async disconnect(): Promise<void> {
    if (this.voltageOutput) {
      try {
        await this.voltageOutput.close();
      } catch {
        // Channel may already be closed — nothing to do here.
      }
      this.voltageOutput = null;
    }

    this.outputOn.set(false);
    this.setConnected(false);
    this.updateRawState({ status: 'Disconnected' });
  }

  // Toggle the voltage output each time the button is pressed
  async toggleOutput(): Promise<void> {
    if (!this.voltageOutput) {
      return;
    }

    const nextState = !this.voltageOutput.enabled;

    try {
      await this.voltageOutput.setEnabled(nextState);
      this.outputOn.set(nextState);
      this.updateRawState({
        status: 'State change',
        deviceName: this.voltageOutput.deviceName,
        serialNumber: this.voltageOutput.deviceSerialNumber,
        channel: this.voltageOutput.channel,
        enabled: nextState,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.updateRawState({ setEnabledError: String(error) });
    }
  }

  private setConnected(isConnected: boolean): void {
    this.connected.set(isConnected);
    this.statusText.set(isConnected ? 'Connected' : 'Disconnected');
  }

  private updateRawState(stateObject: unknown): void {
    this.rawState.set(JSON.stringify(stateObject, null, 2));
  }
}
