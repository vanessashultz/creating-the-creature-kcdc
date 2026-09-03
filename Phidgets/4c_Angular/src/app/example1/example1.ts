import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

declare const phidget22: any;

@Component({
  selector: 'app-example1',
  imports: [FormsModule],
  templateUrl: './example1.html',
  styleUrls: ['../phidget-shared.css', './example1.css'],
})
export class Example1 {
  // Form state, bound to the connection inputs via ngModel
  serverAddress = signal('localhost');
  serverPort = signal(8989);

  // Connection + hardware state, read by the template
  connected = signal(false);
  statusText = signal('Disconnected');
  buttonPressed = signal(false);
  rawState = signal('Waiting for connection...');

  // Phidget object — created fresh on each connection attempt
  private digitalInput: any = null;

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

      this.digitalInput = new phidget22.DigitalInput();

      this.digitalInput.isHubPortDevice = true;
      this.digitalInput.hubPort = 0;

      // Any channel on any hub connected to the server — adjust if you need
      // to target a specific device/channel.
      this.digitalInput.onAttach = () => {
        this.updateRawState({
          status: 'Attached',
          deviceName: this.digitalInput.deviceName,
          serialNumber: this.digitalInput.deviceSerialNumber,
          channel: this.digitalInput.channel,
          state: this.digitalInput.state,
        });
        this.buttonPressed.set(this.digitalInput.state === true);
      };

      this.digitalInput.onDetach = () => {
        this.updateRawState({ status: 'Device detached' });
        this.buttonPressed.set(false);
      };

      this.digitalInput.onStateChange = (state: boolean) => {
        this.buttonPressed.set(!state);
        this.updateRawState({
          status: 'State change',
          deviceName: this.digitalInput.deviceName,
          serialNumber: this.digitalInput.deviceSerialNumber,
          channel: this.digitalInput.channel,
          state,
          timestamp: new Date().toISOString(),
        });
      };

      await this.digitalInput.open(5000);

      this.setConnected(true);
    } catch (error) {
      this.updateRawState({ connectionError: String(error) });
      this.setConnected(false);
    }
  }

  async disconnect(): Promise<void> {
    if (this.digitalInput) {
      try {
        await this.digitalInput.close();
      } catch {
        // Channel may already be closed — nothing to do here.
      }
      this.digitalInput = null;
    }

    this.buttonPressed.set(false);
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
