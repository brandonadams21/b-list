import { assertVizioSuccess, parseVizioApiResponse } from "./protocol.js";
import { VIZIO_KEY_COMMAND_PATH, type VizioHttpTransport } from "./types.js";

const ALLOWED_KEY_COMMANDS = {
  volumeDown: { CODESET: 5, CODE: 0 },
  volumeUp: { CODESET: 5, CODE: 1 },
  muteOff: { CODESET: 5, CODE: 2 },
  muteOn: { CODESET: 5, CODE: 3 },
  muteToggle: { CODESET: 5, CODE: 4 },
  cycleInput: { CODESET: 7, CODE: 1 },
  powerOff: { CODESET: 11, CODE: 0 },
  powerOn: { CODESET: 11, CODE: 1 },
} as const;

export type VizioAllowedKeyCommand = keyof typeof ALLOWED_KEY_COMMANDS;

export function buildAllowedKeyPress(command: VizioAllowedKeyCommand): {
  KEYLIST: Array<{ CODESET: number; CODE: number; ACTION: "KEYPRESS" }>;
} {
  const key = ALLOWED_KEY_COMMANDS[command];
  return { KEYLIST: [{ ...key, ACTION: "KEYPRESS" }] };
}

export interface VizioControlClientOptions {
  transport: VizioHttpTransport;
  authToken: string;
  confirm: (command: VizioAllowedKeyCommand) => Promise<boolean>;
}

export class VizioControlClient {
  constructor(private readonly options: VizioControlClientOptions) {
    if (!options.authToken.trim()) throw new Error("VIZIO control requires an auth token");
  }

  async sendKeyPress(command: VizioAllowedKeyCommand): Promise<ReturnType<typeof parseVizioApiResponse>> {
    if (!(await this.options.confirm(command))) {
      throw new Error(`VIZIO control action was not confirmed: ${command}`);
    }
    if (!this.options.transport.put) throw new Error("VIZIO control requires a PUT-capable transport");

    const response = parseVizioApiResponse(
      await this.options.transport.put(
        VIZIO_KEY_COMMAND_PATH,
        buildAllowedKeyPress(command),
        { AUTH: this.options.authToken },
      ),
    );
    assertVizioSuccess(response, "key command");
    return response;
  }
}
