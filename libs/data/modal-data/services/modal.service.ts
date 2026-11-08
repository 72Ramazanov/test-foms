import {Injectable, ViewContainerRef} from '@angular/core';
import { outputToObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  #viewRef!: ViewContainerRef;

  registerViewRef(viewRef: ViewContainerRef): void {
    this.#viewRef = viewRef;
  }

  show(component: any, params?: Record<string, any>): any  {
    if (!this.#viewRef) {
      return null;
    }
    this.#viewRef.clear(); 
    const componentRef = this.#viewRef.createComponent(component);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        componentRef.setInput(key, value);
      });
    }

    return outputToObservable((componentRef.instance as any)?.onclose);
  }

  remove(): void {
    if (this.#viewRef) {
      this.#viewRef.clear(); 
    }
  }
}
