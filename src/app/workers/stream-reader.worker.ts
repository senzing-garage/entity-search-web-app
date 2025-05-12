/// <reference lib="webworker" />

import {
    determineLineEndingStyle,
    getFileTypeFromName,
    lineEndingStyle,
    lineEndingStyleAsEnumKey,
    validImportFileTypes,
    getUtf8ByteLength
  } from '../common/import-utilities';
import { Observable, Subject } from 'rxjs';

export interface AdminStreamLoadSummary {
    fileType: any,
    fileName: string,
    fileSize: number,
    fileLineEndingStyle: lineEndingStyle,
    fileColumns?: string[],
    characterEncoding: any,
    mediaType: any,
    recordCount: number,
    sentRecordCount: number,
    unsentRecordCount: number,
    failedRecordCount: number,
    missingDataSourceCount: number,
    missingEntityTypeCount: number
    bytesRead: number,
    bytesSent: number,
    bytesQueued: number,
    dataSources?: string[],
    complete?: boolean
}

addEventListener('message', ({ data }) => {
    let file: File = (data as File);
    // file related
    let fileSize = file && file.size ? file.size : 0;
    let fileType = getFileTypeFromName(file);
    let fileName = (file && file.name) ? file.name : undefined;
    // stream related
    let fsStream = file.stream();
    var reader = fsStream.getReader();
    let _readChunks: string[] = [];

    // construct summary object that we can report
    // statistics to
    let summary: AdminStreamLoadSummary = {
        fileType: fileType,
        mediaType: fileType,
        fileName: fileName,
        fileSize: fileSize,
        fileLineEndingStyle: lineEndingStyle.unknown,
        characterEncoding: 'utf-8',
        recordCount: 0,
        sentRecordCount: 0,
        unsentRecordCount: 0,
        failedRecordCount: 0,
        missingDataSourceCount: 0,
        missingEntityTypeCount: 0,
        bytesRead: 0,
        bytesSent: 0,
        bytesQueued: 0,
        fileColumns: [],
        dataSources: [],
        complete: false
    }
    //let _readRecords        = [];
    if(fileType === validImportFileTypes.JSONL || fileType === validImportFileTypes.JSON) {
        let recordsReadFromStream = [];

        console.log(`StreamReaderWorker.onMessage: reading json/json-lines ${fileName}`);
        getChunksFromFileStream(file, reader, summary).subscribe((chunk: string) => {
            // records read from stream read
            _readChunks = _readChunks.concat(chunk);
            postMessage(chunk);
            //summary.recordCount = _readRecords.length;
            //this.onLoadResult.next( summary );
            //console.log(`StreamReaderWorker.onChunkRead() read ${_readChunks.length} chunks`);
        });

        //return retStreamSummary;
    } else if(fileType === validImportFileTypes.CSV) {
        //this._onError.next(new Error('CSVs are not supported by stream loading at this point in time.'));
        console.log(`StreamReaderWorker.onMessage: reading CSV ${fileName}`);
        //return this.streamLoadCSVFileToWebsocketServer(file, reader, summary);
        getChunksFromFileStream(file, reader, summary).subscribe((chunk: string) => {
            // records read from stream read
            _readChunks = _readChunks.concat(chunk);
            postMessage(chunk);
            //summary.recordCount = _readRecords.length;
            //this.onLoadResult.next( summary );
            //console.log(`StreamReaderWorker.onChunkRead() read ${_readChunks.length} chunks`);
        });
    } else {
        console.warn('SzBulkDataService.streamLoad: noooooooo', fileType, fileType === validImportFileTypes.CSV);
    }
});

function getChunksFromFileStream(fileHandle: File, fileReadStream: ReadableStreamDefaultReader<any>, summary: AdminStreamLoadSummary): Observable<string> {
    // set up return observable
    let retSubject  = new Subject<string>();
    let retObs      = retSubject.asObservable();
    // text decoding
    let decoder = new TextDecoder(summary.characterEncoding);
    let encoder = new TextEncoder();
    let recordCount = 0;
    // current chunk to be sent
    let payloadChunk = '';
    //let payloadChunks = [];
    //let wsRecordsQueue = [];
    let resultChunks = undefined;
    //let fileLineEndingStyle = lineEndingStyle.default;
    let lineEndingLength = 1;
    let isValidJSONL = false;

    // read file
    fileReadStream.read()
    .then(function processChunk({ done, value}) {
        if (done) {
            console.log('-- END OF STREAM --');
            fileReadStream.releaseLock();
            return;
        } else {
            let decodedValue  = decoder.decode(value, {stream: true});
            let firstChunk    = (summary.bytesRead < 1) ? true : false;
            // get default line ending style for processing
            if(firstChunk){
                console.log('-- BEGINNING OF STREAM --');
            }
            let chunk = decodedValue;                 // part of stream read minus any incomplete record
            // add any previous incompletes to payload
            payloadChunk += chunk;
            //payloadChunk = payloadChunk.trim();
            if(value && value.length) {
                summary.bytesRead = summary.bytesRead+value.length;
                //retSubject.next(summary);
            }
            //let lineEndingRegEx = (summary.fileLineEndingStyle === lineEndingStyle.Windows) ? new RegExp(/\r\n/g) : new RegExp(/\n/g);
            retSubject.next(payloadChunk);

            // get number of records in chunk
            /*
            let numberOfRecordsInChunk = (payloadChunk.match( lineEndingRegEx ) || '').length + 1;
            summary.recordCount = summary.recordCount + numberOfRecordsInChunk;
            //retSubject.next(summary);*/
            // clear out payload chunk
            payloadChunk = '';
        }
        return fileReadStream.read().then(processChunk.bind(this));
    }.bind(this))
    .catch((err) => {
        console.warn('error: ', err);
    })
    .finally( () => {
        // publish just '0' and the "streaming-file-record-parser"
        // will intercept as stream close
        postMessage(0);
    });

    // return observable of stream summary info
    return retObs;
}

function getRecordsFromFileStream(fileHandle: File, fileReadStream: ReadableStreamDefaultReader<any>, summary: AdminStreamLoadSummary): Observable<string[]> {
    // set up return observable
    let retSubject  = new Subject<string[]>();
    let retObs      = retSubject.asObservable();
    //let readRecs    = [];
    // text decoding
    let decoder = new TextDecoder(summary.characterEncoding);
    let encoder = new TextEncoder();
    let recordCount = 0;
    // current chunk to be sent
    let payloadChunk = '';
    //let payloadChunks = [];
    //let wsRecordsQueue = [];
    let resultChunks = undefined;
    //let fileLineEndingStyle = lineEndingStyle.default;
    let lineEndingLength = 1;
    let isValidJSONL = false;

    // read file
    fileReadStream.read()
    .then(function processChunk({ done, value}) {
        if (done) {
            console.log('-- END OF STREAM --');
            fileReadStream.releaseLock();
            return;
        } else {
            let decodedValue  = decoder.decode(value, {stream: true});
            let firstChunk    = (summary.bytesRead < 1) ? true : false;
            // get default line ending style for processing
            if(firstChunk){
                console.log('-- BEGINNING OF STREAM --');
                summary.fileLineEndingStyle = determineLineEndingStyle(decodedValue);
                lineEndingLength = (summary.fileLineEndingStyle === lineEndingStyle.Windows ? 2 : 1);

                console.log('file line ending style: ', lineEndingStyleAsEnumKey(summary.fileLineEndingStyle));
                console.log('file type: ', summary.fileType);
            } else {
                //console.log('no column header in chunk: ', payloadChunks);
            }

            // wheres the last line ending in stream chunk
            let lastRecordPos = decodedValue.lastIndexOf(summary.fileLineEndingStyle);    // last position of line ending in stream chunk
            let chunk = decodedValue.substring(0, lastRecordPos);                 // part of stream read minus any incomplete record
            // add any previous incompletes to payload
            payloadChunk += chunk;
            payloadChunk = payloadChunk.trim();
            if(value && value.length) {
                summary.bytesRead = summary.bytesRead+value.length;
                //retSubject.next(summary);
            }
            let lineEndingRegEx = (summary.fileLineEndingStyle === lineEndingStyle.Windows) ? new RegExp(/\r\n/g) : new RegExp(/\n/g);

            if(firstChunk) {
            // test for validity
                isValidJSONL = (firstChunk && payloadChunk.indexOf('[') > -1) ? false : ((firstChunk && payloadChunk.indexOf('[') >= -1 && payloadChunk.indexOf('{') > -1) ? true : false);
                console.log('testing for valid jsonl: ', isValidJSONL, summary.fileType, payloadChunk.indexOf('['), payloadChunk.indexOf('{'));
            }
            if(!isValidJSONL) {
                // must be json
                // if not jsonl strip "[" out at the beginning, and "]" at the end
                if(firstChunk) {
                    payloadChunk = payloadChunk.trim();
                    payloadChunk = payloadChunk.substring(payloadChunk.indexOf('[')+1);
                    //console.log('cutting "[" out from line 1', payloadChunk);
                }
            } else if(firstChunk){
                console.log('isValidJSONL: '+ isValidJSONL, );
            }

            // split chunk by line endings for per-record streaming
            let chunkLines = payloadChunk.split(summary.fileLineEndingStyle);
            // strip out anything like "]" that may break things
            chunkLines = chunkLines.map((streamChunkLine) => {
                // does line have "," after last "}"
                if(streamChunkLine && streamChunkLine.lastIndexOf) {
                    let lastBracketPos  = streamChunkLine.lastIndexOf("}");
                    let lastCommaPos    = streamChunkLine.lastIndexOf(",");
                    if(lastCommaPos > lastBracketPos) {
                        // strip off last ","
                        streamChunkLine = streamChunkLine.substring(0, lastCommaPos);
                    }
                }
                if(streamChunkLine && streamChunkLine.trim && streamChunkLine.trim() === ']') {
                    streamChunkLine = undefined;
                }
                return streamChunkLine;
            }).filter((chunkLine) => {
                return chunkLine && chunkLine !== undefined;
            });
            //console.log('split records in chunk by line endings: ', chunkLines);

            //wsRecordsQueue.push(chunkLines);
            retSubject.next(chunkLines);

            // get number of records in chunk
            let numberOfRecordsInChunk = (payloadChunk.match( lineEndingRegEx ) || '').length + 1;
            summary.recordCount = summary.recordCount + numberOfRecordsInChunk;
            //retSubject.next(summary);
            payloadChunk = '';
            // add incomplete remainder record to next chunk
            if(lastRecordPos < decodedValue.length) {
                payloadChunk = decodedValue.substring(lastRecordPos).trim();
            }
        }
        return fileReadStream.read().then(processChunk.bind(this));
    }.bind(this))
    .catch((err) => {
        console.warn('error: ', err);
    })
    .finally(() => {
        // sometimes there is a last "hanging chunk"
        payloadChunk = payloadChunk.trim();

        if(payloadChunk && payloadChunk.length > 0) {
            if(summary.fileType === validImportFileTypes.JSONL || summary.fileType === validImportFileTypes.JSON) {
                let payloadChunkHasEndBracket = payloadChunk.lastIndexOf(']') > payloadChunk.indexOf('}');
                if(payloadChunkHasEndBracket) {
                    // was "json" not "jsonl", correct it
                    payloadChunk = payloadChunk.replace(']','').trim();
                    if(payloadChunk.indexOf('{') > -1 && payloadChunk.indexOf('}') > -1) {
                        let plChunkSplit = payloadChunk.split('}');
                        console.log("what's going on here? ", plChunkSplit);
                        summary.recordCount = summary.recordCount + plChunkSplit.length;
                        //retSubject.next(summary);
                    }
                    // split chunk by line endings for per-record streaming
                    let chunkLines = payloadChunk.split(summary.fileLineEndingStyle);
                    //wsRecordsQueue.push(chunkLines);
                    retSubject.next(chunkLines);
                } else {
                    if(payloadChunk.indexOf('{') > -1 && payloadChunk.indexOf('}') > -1) {
                        payloadChunk = payloadChunk.trim();
                        let plChunkSplit = payloadChunk.split('}').filter( (value) => {
                            return (value && value.trim() !== '') ? true : false;
                        }).map((jsonChunk) => {
                            let retVal = jsonChunk;
                            if(retVal.lastIndexOf('}') < 0) {
                                // we need to add '}' back in where we split
                                retVal  = retVal + '}';
                            }
                            return retVal
                        });
                        summary.recordCount = summary.recordCount + plChunkSplit.length;
                        retSubject.next(plChunkSplit);
                    }
                }
            }
        }
    })
    .finally( () => {
        // publish just '0' and the "streaming-file-record-parser"
        // will intercept as stream close
        postMessage(0);
    });

    // return observable of stream summary info
    return retObs;
}
