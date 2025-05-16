import { Directive, HostListener, HostBinding, EventEmitter, Output } from "@angular/core";

@Directive({
    selector: "[fileDnD]",
    standalone: false
})
export class AppFileDragAndDrop {
    @HostBinding('class.fileover') fileOver: boolean;
    @Output() fileDropped = new EventEmitter<any>();

    @HostListener('dragover', ['$event']) onDragOver(evt: Event) {
        evt.preventDefault();
        evt.stopPropagation();
        console.log('drag over');
        this.fileOver = true;
    }
    @HostListener('dragleave', ['$event']) onDragLeave(evt: Event) {
        evt.preventDefault();
        evt.stopPropagation();
        console.log('drag leave');
        this.fileOver = false;
    }
    @HostListener('drop', ['$event']) onDragDrop(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        console.log('drag drop');
        const files = evt.dataTransfer.files;
        if(files.length > 0) {
            this.fileDropped.emit(files);
        }
        this.fileOver = false;
    }
}