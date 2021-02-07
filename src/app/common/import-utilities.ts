
export enum lineEndingStyle {
    Windows = '\r\n',
    MacOs = '\n',
    Linux = '\n',
    default = '\n',
    unknown = '\r'
}
export type LineEndingStyleStrings = keyof typeof lineEndingStyle;

export enum validImportFileTypes {
    CSV = 'csv',
    JSONL = 'jsonl',
    JSON = 'json'
}

export function determineLineEndingStyle(text: string): lineEndingStyle.Linux | lineEndingStyle.MacOs | lineEndingStyle.Windows | lineEndingStyle.default | lineEndingStyle.unknown {
    let retVal = lineEndingStyle.default;
    const indexOfLF = text.indexOf('\n', 1);  // No need to check first-character
    if(indexOfLF === -1) {
        if(text.indexOf('\r') !== -1) {
            retVal = lineEndingStyle.unknown;
        } else {
            retVal = lineEndingStyle.Linux;
        }
    } else {
        if (text[indexOfLF - 1] === '\r'){
            retVal = lineEndingStyle.Windows; // is '\r\n'
        }
    }
    return retVal;
}

export function lineEndingStyleAsEnumKey(value: lineEndingStyle.Linux | lineEndingStyle.MacOs | lineEndingStyle.Windows | lineEndingStyle.default | lineEndingStyle.unknown): "Linux" | "Windows" | "MacOs" | "default" | "unknown" {
    let retVal;
    if(value === lineEndingStyle.Linux){ retVal = "Linux"; }
    if(value === lineEndingStyle.MacOs){ retVal = "MacOs"; }
    if(value === lineEndingStyle.Windows){ retVal = "Windows"; }
    if(value === lineEndingStyle.unknown){ retVal = "unknown"; }
    if(retVal === undefined){ retVal = "default";}
    return retVal;
}

export function getFileTypeFromName(file: File): validImportFileTypes.JSONL | validImportFileTypes.JSON | validImportFileTypes.CSV | undefined {
    let retVal = undefined;
    if(file && file.name) {
        let fileName    = file.name;
        let fileExt     = fileName.substr(fileName.lastIndexOf('.')+1);
        fileExt         = fileExt.toLowerCase().trim();
        switch(fileExt) {
            case validImportFileTypes.CSV:
                retVal = validImportFileTypes.CSV;
                break;
            case validImportFileTypes.JSONL:
                retVal = validImportFileTypes.JSONL;
                break;
            case validImportFileTypes.JSON:
                retVal = validImportFileTypes.JSON;
                break;
        }
    } else {
        // I dunno, maybe infer from content sample???
    }
    return retVal;
}