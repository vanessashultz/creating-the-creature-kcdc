<script setup>
import { ref, computed } from 'vue'
import * as phidget22 from 'phidget22'

// Phidget channel objects live outside Vue's reactive state.
// They're not values the template displays directly — they're handles
// used to talk to hardware, and their callbacks update reactive state
// (declared below) instead of being observed by Vue directly.
let networkConnection = null
let digitalInput = null
let voltageRatioInput = null
let voltageOutput = null

const serverAddress = ref('localhost')
const serverPort = ref(8989)
const connected = ref(false)
const buttonPressed = ref(false)
const voltageRatio = ref(null)
const outputOn = ref(false)
const rawState = ref({ status: 'Waiting for connection...' })

const rawStateText = computed(() => JSON.stringify(rawState.value, null, 2))

const ratioDisplay = computed(() =>
  voltageRatio.value === null ? '--' : voltageRatio.value.toFixed(4)
)

const ratioBarWidth = computed(() => {
  if (voltageRatio.value === null) {
    return '0%'
  }
  const clampedRatio = Math.min(Math.max(voltageRatio.value, 0), 1)
  return `${clampedRatio * 100}%`
})

async function connect() {
  try {
    rawState.value = { status: 'Connecting...' }
    await connectToPhidgetServer(serverAddress.value, serverPort.value)
  } catch (error) {
    rawState.value = { connectionError: String(error) }
    connected.value = false
  }
}

async function connectToPhidgetServer(address, port) {
  networkConnection = new phidget22.NetworkConnection({
    hostname: address,
    port: port,
    onError: (code, message) => {
      rawState.value = { connectionError: { code, message } }
    },
    onDisconnect: () => {
      connected.value = false
      rawState.value = { status: 'Disconnected from server' }
    }
  })

  await networkConnection.connect()

  // Like the plain-HTML version, we only have one wire for this demo, so
  // only the voltage output channel is opened here. openDigitalInput() and
  // openVoltageRatioInput() are left in place below — swap the call here
  // to try them instead.
  // await openDigitalInput()
  // await openVoltageRatioInput()
  await openVoltageOutput()

  connected.value = true
}

async function openDigitalInput() {
  digitalInput = new phidget22.DigitalInput()
  digitalInput.isHubPortDevice = true
  digitalInput.hubPort = 0

  digitalInput.onAttach = () => {
    rawState.value = {
      status: 'Attached',
      deviceName: digitalInput.deviceName,
      serialNumber: digitalInput.deviceSerialNumber,
      channel: digitalInput.channel,
      state: digitalInput.state
    }
    buttonPressed.value = digitalInput.state === true
  }

  digitalInput.onDetach = () => {
    rawState.value = { status: 'Device detached' }
    buttonPressed.value = false
  }

  digitalInput.onStateChange = (state) => {
    // This particular button/wiring reports `false` when physically
    // pressed and `true` when released — invert for display.
    buttonPressed.value = !state
    rawState.value = {
      status: 'State change',
      deviceName: digitalInput.deviceName,
      serialNumber: digitalInput.deviceSerialNumber,
      channel: digitalInput.channel,
      state: state,
      timestamp: new Date().toISOString()
    }
  }

  await digitalInput.open(5000)
}

async function openVoltageRatioInput() {
  voltageRatioInput = new phidget22.VoltageRatioInput()
  voltageRatioInput.isHubPortDevice = true
  voltageRatioInput.hubPort = 0

  voltageRatioInput.onAttach = () => {
    rawState.value = {
      status: 'Attached',
      deviceName: voltageRatioInput.deviceName,
      serialNumber: voltageRatioInput.deviceSerialNumber,
      channel: voltageRatioInput.channel,
      voltageRatio: voltageRatioInput.voltageRatio
    }
    voltageRatio.value = voltageRatioInput.voltageRatio
  }

  voltageRatioInput.onDetach = () => {
    rawState.value = { status: 'Device detached' }
    voltageRatio.value = null
  }

  voltageRatioInput.onVoltageRatioChange = (ratio) => {
    voltageRatio.value = ratio
    rawState.value = {
      status: 'Voltage ratio change',
      deviceName: voltageRatioInput.deviceName,
      serialNumber: voltageRatioInput.deviceSerialNumber,
      channel: voltageRatioInput.channel,
      voltageRatio: ratio,
      timestamp: new Date().toISOString()
    }
  }

  await voltageRatioInput.open(5000)
}

async function openVoltageOutput() {
  voltageOutput = new phidget22.VoltageOutput()
  voltageOutput.isHubPortDevice = true
  voltageOutput.hubPort = 0

  voltageOutput.onAttach = () => {
    rawState.value = {
      status: 'Attached',
      deviceName: voltageOutput.deviceName,
      serialNumber: voltageOutput.deviceSerialNumber,
      channel: voltageOutput.channel,
      enabled: voltageOutput.enabled
    }
    outputOn.value = voltageOutput.enabled === true
  }

  voltageOutput.onDetach = () => {
    rawState.value = { status: 'Device detached' }
    outputOn.value = false
  }

  await voltageOutput.open(5000)
  await voltageOutput.setVoltage(4) // Set the voltage as soon as the channel is open
}

async function disconnect() {
  for (const channel of [digitalInput, voltageRatioInput, voltageOutput]) {
    if (channel) {
      try {
        await channel.close()
      } catch (error) {
        // Channel may already be closed — nothing to do here.
      }
    }
  }
  digitalInput = null
  voltageRatioInput = null
  voltageOutput = null

  buttonPressed.value = false
  voltageRatio.value = null
  outputOn.value = false
  connected.value = false
  rawState.value = { status: 'Disconnected' }
}

async function toggleOutput() {
  if (!voltageOutput) {
    return
  }

  const nextState = !voltageOutput.enabled

  try {
    await voltageOutput.setEnabled(nextState)
    outputOn.value = nextState
    rawState.value = {
      status: 'State change',
      deviceName: voltageOutput.deviceName,
      serialNumber: voltageOutput.deviceSerialNumber,
      channel: voltageOutput.channel,
      enabled: nextState,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    rawState.value = { setEnabledError: String(error) }
  }
}
</script>

<template>
  <h1>Phidget Monitor</h1>

  <section>
    <form class="connection-form" @submit.prevent="connect">
      <label>
        Server address
        <input v-model="serverAddress" type="text" :disabled="connected" />
      </label>
      <label>
        Port
        <input v-model.number="serverPort" type="number" style="width: 80px" :disabled="connected" />
      </label>
      <button type="submit" :disabled="connected">Connect</button>
      <button type="button" :disabled="!connected" @click="disconnect">Disconnect</button>
    </form>
    <div class="status-line">
      Status:
      <span :class="connected ? 'connected' : 'disconnected'">
        {{ connected ? 'Connected' : 'Disconnected' }}
      </span>
    </div>
  </section>

  <section>
    <h2>Button State</h2>
    <div class="button-visual" :class="buttonPressed ? 'pressed' : 'neutral'">
      {{ buttonPressed ? 'PRESSED' : 'NEUTRAL' }}
    </div>
  </section>

  <section>
    <h2>Voltage Ratio</h2>
    <div class="ratio-visual">
      <div class="ratio-value">{{ ratioDisplay }}</div>
      <div class="ratio-bar-track">
        <div class="ratio-bar-fill" :style="{ width: ratioBarWidth }"></div>
      </div>
    </div>
  </section>

  <section>
    <h2>Voltage Output</h2>
    <button
      class="output-button"
      :class="outputOn ? 'on' : 'off'"
      type="button"
      :disabled="!connected"
      @click="toggleOutput"
    >
      {{ outputOn ? 'ON' : 'OFF' }}
    </button>
  </section>

  <section>
    <h2>Raw Phidget State</h2>
    <div class="raw-state-panel">{{ rawStateText }}</div>
  </section>
</template>

<style scoped>
h1 {
  font-size: 1.4rem;
}

/* Connection form */
.connection-form {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.connection-form input {
  padding: 6px 8px;
  font-size: 1rem;
}

.connection-form button {
  padding: 6px 14px;
  font-size: 1rem;
  cursor: pointer;
}

.status-line {
  margin-bottom: 24px;
  font-size: 0.95rem;
}

.status-line .connected {
  color: #1a7f37;
  font-weight: bold;
}

.status-line .disconnected {
  color: #b42318;
  font-weight: bold;
}

/* Button visual */
.button-visual {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  margin: 32px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  background: #8a8f98;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition: background-color 0.1s ease, transform 0.1s ease;
  user-select: none;
}

.button-visual.pressed {
  background: #d3322b;
  transform: scale(0.94);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) inset;
}

.button-visual.neutral {
  background: #3a9d4f;
}

/* Voltage ratio visual */
.ratio-visual {
  margin: 32px auto;
  max-width: 480px;
}

.ratio-value {
  font-size: 2.4rem;
  font-weight: bold;
  text-align: center;
  font-family: 'Courier New', monospace;
}

.ratio-bar-track {
  width: 100%;
  height: 24px;
  background: #d9dce1;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 12px;
}

.ratio-bar-fill {
  height: 100%;
  width: 0%;
  background: #3a9d4f;
  transition: width 0.1s ease;
}

/* Output control button */
.output-button {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  margin: 32px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  background: #8a8f98;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition: background-color 0.1s ease, transform 0.1s ease;
  user-select: none;
  border: none;
  cursor: pointer;
}

.output-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.output-button.on {
  background: #3a9d4f;
}

.output-button.off {
  background: #8a8f98;
}

.output-button:active:not(:disabled) {
  transform: scale(0.94);
}

/* Raw state panel */
.raw-state-panel {
  background: #10131a;
  color: #b6ffb6;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

section {
  margin-bottom: 28px;
}

label {
  font-size: 0.9rem;
}
</style>
