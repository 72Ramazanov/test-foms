import {
  AfterViewInit,
  Component,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { ModalService } from '../../data/modal-data/services/modal.service';

@Component({
  selector: 'app-modal-host',
  imports: [],
  templateUrl: './modal-host.component.html',
  styleUrl: './modal-host.component.css',
})
export class ModalHostComponent implements AfterViewInit {
  @ViewChild('modal', { read: ViewContainerRef }) viewRef!: ViewContainerRef;

  constructor(private modalService: ModalService) {}

  ngAfterViewInit() {
    if (this.viewRef) {
      this.modalService.registerViewRef(this.viewRef);
    }
  }
}
