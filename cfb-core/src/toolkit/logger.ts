export class Logger {
  static isDebug: boolean = false;

  static error(msg: string) {
    console.error(`[ERROR]: ${msg}`);
  }

  static warn(msg: string) {
    if (!Logger.isDebug) return;
    console.log(`%c[WARNING]: ${msg}`, "color:orange");
  }

  static debug(msg: string) {
    if (!Logger.isDebug) return;
    console.log(`%c[DEBUG]: ${msg}`, "color:blue");
  }

  static log(msg: string) {
    if (!Logger.isDebug) return;
    console.log(`[LOG]: ${msg}`);
  }

  static group(groupName: string, msgs: string[]) {
    if (!Logger.isDebug) return;
    console.group(groupName);
    msgs.forEach((msg) => console.log(msg));
    console.groupEnd();
  }
}
