import { BehaviorSubject, Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";

export class SzStreamingFileChunkReader {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    /** file to read */
    private _file: File;
    private _readStreamReadChunks: any[] = [];
    //private _currentMessage: string = '';
    private onStreamChunkRead: Subject<string[]>    = new Subject<string[]>();
    private _onStreamClosed: Subject<boolean>       = new Subject<boolean>();
    public onStreamClosed                           = this._onStreamClosed.asObservable();
    /**
     * this is the droid you are looking for.. probably
     * returns an array of records as json as they were read from stream.
     **/
    public onStreamChunkParsed  = this.onStreamChunkRead.asObservable();

    /** published every time 1+ chunk is read.
      * returns the total aggregate collection of records.
    */
    private _onChunksRead = new BehaviorSubject<any[]>(this._readStreamReadChunks);
    public onChunksRead = this._onChunksRead.asObservable();
    /** the current file being parsed */
    get file(): File {
        return this._file;
    }
    /** the current file being parsed */
    set file(value: File) {
        this._file = value;
        this._readStreamReadChunks = [];
    }
    /*
    public get currentMessage(): string {
        return this._currentMessage;
    }*/
    public set readStreamReadChunks(chunks: any[]) {
        this._readStreamReadChunks = chunks;
        //let readCount = records && records.length ? records.length : 0;
        //this._currentMessage = `read ${readCount} records from file`;
        this._onChunksRead.next(chunks);
    }

    constructor(file?: File) {
        if(file) {
            this._file = file;
        }
        //console.log('SzStreamingFileChunkReader()');

        this.onStreamChunkRead.asObservable().pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe( (chunks: any[] ) => {
            this.readStreamReadChunks = this._readStreamReadChunks.concat(chunks);
            //console.log('SzStreamingFileChunkReader.onStreamChunkRead: ', chunks, this._readStreamReadChunks);
        });

        this.onStreamClosed.subscribe((status) => {
            //console.warn('SzStreamingFileChunkReader.closed()');
        });
    }
    /*
    private mapStreamChunkToJSON(streamChunkLines: string[]): any[] {
        // double check if any lines are doubled up
        let hasDouble   = streamChunkLines.some((streamChunkLine) => {
            return streamChunkLine.split('}').length >= 3;
        })
        if(!hasDouble) {
            return streamChunkLines.map( (streamChunkLine) => {
                // does line have "," after last "}"
                let lastBracketPos  = streamChunkLine.lastIndexOf("}");
                let lastCommaPos    = streamChunkLine.lastIndexOf(",");
                if(lastCommaPos > lastBracketPos) {
                    // strip off last ","
                    streamChunkLine = streamChunkLine.substring(0, lastCommaPos);
                }
                try{
                    return JSON.parse(streamChunkLine);
                }catch(err){
                    console.warn('SzStreamingFileChunkReader.onStreamChunkRead: Parse Error 1', streamChunkLine);
                }
            })
        } else {
            // split double entries
            let newChunkLines = [];
            streamChunkLines.forEach((streamChunkLine) => {
                if(streamChunkLine.split('}').length >= 3) {
                    // split line and add each item
                    let lineSplit   = streamChunkLine.split('}').map((strLine) => { return (strLine.indexOf('}') > -1) ? strLine : (strLine + '}'); });
                    lineSplit.forEach((splitItemStr) => {
                        try{
                            newChunkLines.push(JSON.parse(splitItemStr));
                        }catch(err){
                            // just ignore
                            console.warn('SzStreamingFileChunkReader.onStreamChunkRead: Parse Error 2 "'+ splitItemStr +'"', err);
                        }
                    });
                } else {
                    newChunkLines.push(JSON.parse(streamChunkLine));
                }
            });
            return newChunkLines
        }
        return [];
    }*/
    /** on destroy close all subscribers */
    destroy() {
        console.log('SzStreamingFileChunkReader.destroy()');
    }
    /**
     * Read a file using streaming interface.
     * @param file the file to parse for records
     */
    read(file?: File) {
        file = file ? file : this._file;
        this.file = file;
        // now we have the file, hand off to webworker
        // this pattern prevents GUI lock up by offloading
        // recursive stream read to separate thread
        //console.log('SzStreamingFileChunkReader.read: ', file);

        if (typeof Worker !== 'undefined') {
            const worker = new Worker(new URL('../workers/stream-reader.worker', import.meta.url), { type: 'module' });
            worker.onmessage = ({ data }) => {
                data = (data && data.trim) ? data.trim() : data;
                //console.log('\tread: ', data);


                if(data || data === '0' || data === 0){
                    if(data === '0' || data === 0){
                        // file stream is complete
                        this._onStreamClosed.next(true);

                    } else {
                        // set "_readStreamReadRecords" to value and publish event
                        this.onStreamChunkRead.next(data);
                        //this._readStreamReadRecords.push(data);
                        //this._onRecordsRead.next( this._readStreamReadRecords );
                    }
                }
            };
            // open up file read
            worker.postMessage(file);

        }
    }
}

/**
 * Helper class for doing a Threaded file stream read.
 * File is passed to WebWorker for processing, and response(s)
 * are handed back to this class and encapsulated in to Observables
 * for easy handling.
 *
 * @example
 let sr = new SzStreamingFileRecordParser(fileHandle)
 sr.read().subscribe((recordsRead) => {})

 */
export class SzStreamingFileRecordParser {
    private _file: File;
    private _readStreamReadRecords: any[] = [];
    //private _currentMessage: string = '';
    private onStreamChunkRead: Subject<string[]>    = new Subject<string[]>();
    private _onStreamClosed: Subject<boolean>       = new Subject<boolean>();
    public onStreamClosed                           = this._onStreamClosed.asObservable();
    /**
     * this is the droid you are looking for.. probably
     * returns an array of records as json as they were read from stream.
     **/
    public onStreamChunkParsed  = this.onStreamChunkRead.asObservable().pipe(
        map( this.mapStreamChunkToJSON )
    )
    /** published every time 1+ record is read.
      * returns the total aggregate collection of records.
    */
    private _onRecordsRead = new BehaviorSubject<any[]>(this._readStreamReadRecords);
    public onRecordsRead = this. _onRecordsRead.asObservable();
    /** the current file being parsed */
    get file(): File {
        return this._file;
    }
    /** the current file being parsed */
    set file(value: File) {
        this._file = value;
        this._readStreamReadRecords = [];
    }
    /*
    public get currentMessage(): string {
        return this._currentMessage;
    }*/
    public set readStreamReadRecords(records: any[]) {
        this._readStreamReadRecords = records;
        let readCount = records && records.length ? records.length : 0;
        //this._currentMessage = `read ${readCount} records from file`;
        this._onRecordsRead.next(records);
    }

    constructor(file?: File) {
        if(file) {
            this._file = file;
        }
        //console.log('SzStreamingFileRecordParser()');

        this.onStreamChunkRead.asObservable().pipe(
            map( this.mapStreamChunkToJSON )
        ).subscribe( (records: any[] ) => {
            this.readStreamReadRecords = this._readStreamReadRecords.concat(records);
            //console.log('onStreamChunkRead: ', records, this._readStreamReadRecords);
        });
        this.onStreamClosed.subscribe((status) => {
            console.warn('SzStreamingFileRecordParser.closed()');
        });
    }
    private mapStreamChunkToJSON(streamChunkLines: string[]): any[] {
        // double check if any lines are doubled up
        let hasDouble   = streamChunkLines.some((streamChunkLine) => {
            return streamChunkLine.split('}').length >= 3;
        })
        if(!hasDouble) {
            return streamChunkLines.map( (streamChunkLine) => {
                // does line have "," after last "}"
                let lastBracketPos  = streamChunkLine.lastIndexOf("}");
                let lastCommaPos    = streamChunkLine.lastIndexOf(",");
                if(lastCommaPos > lastBracketPos) {
                    // strip off last ","
                    streamChunkLine = streamChunkLine.substring(0, lastCommaPos);
                }
                try{
                    return JSON.parse(streamChunkLine);
                }catch(err){
                    console.warn('SzStreamingFileRecordParser.onStreamChunkRead: Parse Error 1', streamChunkLine);
                }
            })
        } else {
            // split double entries
            let newChunkLines = [];
            streamChunkLines.forEach((streamChunkLine) => {
                if(streamChunkLine.split('}').length >= 3) {
                    // split line and add each item
                    let lineSplit   = streamChunkLine.split('}').map((strLine) => { return (strLine.indexOf('}') > -1) ? strLine : (strLine + '}'); });
                    lineSplit.forEach((splitItemStr) => {
                        try{
                            newChunkLines.push(JSON.parse(splitItemStr));
                        }catch(err){
                            // just ignore
                            console.warn('SzStreamingFileRecordParser.onStreamChunkRead: Parse Error 2 "'+ splitItemStr +'"', err);
                        }
                    });
                } else {
                    newChunkLines.push(JSON.parse(streamChunkLine));
                }
            });
            return newChunkLines
        }
        return [];
    }
    /** on destroy close all subscribers */
    destroy() {
        console.log('SzStreamingFileRecordParser.destroy()');
    }
    /**
     * Read a file using streaming interface.
     * @param file the file to parse for records
     */
    read(file?: File) {
        file = file ? file : this._file;
        this.file = file;
        // now we have the file, hand off to webworker
        // this pattern prevents GUI lock up by offloading
        // recursive stream read to separate thread
        console.log('SzStreamingFileRecordParser.read: ', file);

        if (typeof Worker !== 'undefined') {
            const worker = new Worker(new URL('../workers/stream-reader.worker', import.meta.url), { type: 'module' });
            worker.onmessage = ({ data }) => {
                data = (data && data.trim) ? data.trim() : data;
                //console.log('\tread: ', data);


                if(data || data === '0' || data === 0){
                    if(data === '0' || data === 0){
                        // file stream is complete
                        this._onStreamClosed.next(true);

                    } else {
                        // set "_readStreamReadRecords" to value and publish event
                        this.onStreamChunkRead.next(data);
                        //this._readStreamReadRecords.push(data);
                        //this._onRecordsRead.next( this._readStreamReadRecords );
                    }
                }
            };
            // open up file read
            worker.postMessage(file);

        }
    }
}
