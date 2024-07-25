import vscode from 'vscode';

export enum ItemType {
    File,
    TestCase
}
export interface Info {
    workspaceFolder: vscode.WorkspaceFolder;
    caseType: ItemType.File | ItemType.TestCase;
    testId: string;
    testItem: vscode.TestItem;
    fileUrl: string;
    filePath: string;
};

export const testData = new WeakMap<vscode.TestItem, Info>();
export const getTestInfo = (testItem: vscode.TestItem): Info => testData.get(testItem)!;
export const EOL: string = '\r\n';

export const ansiColors = {
    "bgBlack": { "open": "\x1B[40m", "close": "\x1B[49m" },
    "bgBlackBright": { "open": "\x1B[100m", "close": "\x1B[49m" },
    "bgBlue": { "open": "\x1B[44m", "close": "\x1B[49m" },
    "bgBlueBright": { "open": "\x1B[104m", "close": "\x1B[49m" },
    "bgCyan": { "open": "\x1B[46m", "close": "\x1B[49m" },
    "bgCyanBright": { "open": "\x1B[106m", "close": "\x1B[49m" },
    "bgGray": { "open": "\x1B[100m", "close": "\x1B[49m" },
    "bgGreen": { "open": "\x1B[42m", "close": "\x1B[49m" },
    "bgGreenBright": { "open": "\x1B[102m", "close": "\x1B[49m" },
    "bgGrey": { "open": "\x1B[100m", "close": "\x1B[49m" },
    "bgMagenta": { "open": "\x1B[45m", "close": "\x1B[49m" },
    "bgMagentaBright": { "open": "\x1B[105m", "close": "\x1B[49m" },
    "bgRed": { "open": "\x1B[41m", "close": "\x1B[49m" },
    "bgRedBright": { "open": "\x1B[101m", "close": "\x1B[49m" },
    "bgWhite": { "open": "\x1B[47m", "close": "\x1B[49m" },
    "bgWhiteBright": { "open": "\x1B[107m", "close": "\x1B[49m" },
    "bgYellow": { "open": "\x1B[43m", "close": "\x1B[49m" },
    "bgYellowBright": { "open": "\x1B[103m", "close": "\x1B[49m" },
    "black": { "open": "\x1B[30m", "close": "\x1B[39m" },
    "blackBright": { "open": "\x1B[90m", "close": "\x1B[39m" },
    "blue": { "open": "\x1B[34m", "close": "\x1B[39m" },
    "blueBright": { "open": "\x1B[94m", "close": "\x1B[39m" },
    "bold": { "open": "\x1B[1m", "close": "\x1B[22m" },
    "cyan": { "open": "\x1B[36m", "close": "\x1B[39m" },
    "cyanBright": { "open": "\x1B[96m", "close": "\x1B[39m" },
    "dim": { "open": "\x1B[2m", "close": "\x1B[22m" },
    "gray": { "open": "\x1B[90m", "close": "\x1B[39m" },
    "green": { "open": "\x1B[32m", "close": "\x1B[39m" },
    "greenBright": { "open": "\x1B[92m", "close": "\x1B[39m" },
    "grey": { "open": "\x1B[90m", "close": "\x1B[39m" },
    "hidden": { "open": "\x1B[8m", "close": "\x1B[28m" },
    "inverse": { "open": "\x1B[7m", "close": "\x1B[27m" },
    "italic": { "open": "\x1B[3m", "close": "\x1B[23m" },
    "magenta": { "open": "\x1B[35m", "close": "\x1B[39m" },
    "magentaBright": { "open": "\x1B[95m", "close": "\x1B[39m" },
    "overline": { "open": "\x1B[53m", "close": "\x1B[55m" },
    "red": { "open": "\x1B[31m", "close": "\x1B[39m" },
    "redBright": { "open": "\x1B[91m", "close": "\x1B[39m" },
    "reset": { "open": "\x1B[0m", "close": "\x1B[0m" },
    "strikethrough": { "open": "\x1B[9m", "close": "\x1B[29m" },
    "underline": { "open": "\x1B[4m", "close": "\x1B[24m" },
    "white": { "open": "\x1B[37m", "close": "\x1B[39m" },
    "whiteBright": { "open": "\x1B[97m", "close": "\x1B[39m" },
    "yellow": { "open": "\x1B[33m", "close": "\x1B[39m" },
    "yellowBright": { "open": "\x1B[93m", "close": "\x1B[39m" }
}