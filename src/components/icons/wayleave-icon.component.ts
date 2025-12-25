
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-wayleave-icon',
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" 
            [attr.stroke]="primaryColor()" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 2V8H20" [attr.stroke]="primaryColor()" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 15.5C8.27614 15.5 8.5 15.2761 8.5 15C8.5 14.7239 8.27614 14.5 8 14.5C7.72386 14.5 7.5 14.7239 7.5 15C7.5 15.2761 7.72386 15.5 8 15.5Z" 
            [attr.fill]="secondaryColor()" [attr.stroke]="secondaryColor()"/>
      <path d="M16 12.5C16.2761 12.5 16.5 12.2761 16.5 12C16.5 11.7239 16.2761 11.5 16 11.5C15.7239 11.5 15.5 11.7239 15.5 12C15.5 12.2761 15.7239 12.5 16 12.5Z" 
            [attr.fill]="secondaryColor()" [attr.stroke]="secondaryColor()"/>
      <path d="M8 15C9.5 13.5 11.5 13 12.5 13C13.5 13 14.5 13.5 16 12" 
            [attr.stroke]="secondaryColor()" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WayleaveIconComponent {
  size = input('48');
  primaryColor = input('#6366f1'); // indigo-500
  secondaryColor = input('#67e8f9'); // cyan-300
}
