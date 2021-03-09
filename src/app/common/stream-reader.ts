import { BehaviorSubject, Subject } from "rxjs";
import { map } from "rxjs/operators";

export class SzStreamingFileReader {
    private _file: File;
    private _readStreamReadRecords: any[] = [];
    private _currentMessage: string = '';

    private onStreamChunkRead: Subject<string[]> = new Subject<string[]>();

    get file(): File {
        return this._file;
    }
    set file(value: File) {
        this._file = value;
        this._readStreamReadRecords = [];
    }
    public get currentMessage(): string {
        return this._currentMessage;
    }
    public set readStreamReadRecords(records: any[]) {
        this._readStreamReadRecords = records;
        let readCount = records && records.length ? records.length : 0;
        this._currentMessage = `read ${readCount} records from file`;
        this._onRecordsRead.next(records);
    }

    private _onRecordsRead = new BehaviorSubject<any[]>(this._readStreamReadRecords);
    public onRecordsRead = this. _onRecordsRead.asObservable();

    constructor(file?: File) {
        if(file) {
            this._file = file;
        }
        console.log('SzFileStreamReader()');

        this.onStreamChunkRead.asObservable().pipe(
            map( (streamChunkLines: string[]) => {
                return streamChunkLines.map( (streamChunkLine) => {
                    return JSON.parse(streamChunkLine);
                })
            })
        ).subscribe( (records: any[] ) => {
            this.readStreamReadRecords = this._readStreamReadRecords.concat(records);
            //console.log('onStreamChunkRead: ', records, this._readStreamReadRecords);

            //this._onRecordsRead.next( this._readStreamReadRecords );
        });
    }
    destroy() {
        console.log('SzFileStreamReader.destroy()');
    }

    read(file?: File) {
        file = file ? file : this._file;
        this.file = file;
        // now we have the file, hand off to webworker
        // this pattern prevents GUI lock up by offloading
        // recursive stream read to separate thread
        console.log('SzFileStreamReader.read: ', file);

        if (typeof Worker !== 'undefined') {
            const worker = new Worker('../workers/stream-reader.worker', { type: 'module' });
        
            worker.onmessage = ({ data }) => {
                //console.log('\tread: ', data);

                if(data){
                    // set "_readStreamReadRecords" to value and publish event
                    this.onStreamChunkRead.next(data);
                    //this._readStreamReadRecords.push(data);
                    //this._onRecordsRead.next( this._readStreamReadRecords );
                }
            };
            // open up file read
            worker.postMessage(file);
        }
    }
}