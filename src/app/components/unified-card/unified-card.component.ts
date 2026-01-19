import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-unified-card',
  templateUrl: './unified-card.component.html',
  styleUrls: ['./unified-card.component.scss']
})
export class UnifiedCardComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() image?: string;
  @Input() badge?: string;
  @Input() badgeColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  @Input() clickable: boolean = true;
  @Input() actions: Array<{ label: string; icon?: string; action: () => void; class?: string }> = [];
  @Output() cardClick = new EventEmitter<void>();

  onCardClick(): void {
    if (this.clickable) {
      this.cardClick.emit();
    }
  }

  onActionClick(action: { action: () => void }, event: Event): void {
    event.stopPropagation();
    action.action();
  }
}
