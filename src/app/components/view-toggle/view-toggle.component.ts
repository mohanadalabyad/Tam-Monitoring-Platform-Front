import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Table2, Grid3x3 } from 'lucide-angular';

export type ViewMode = 'table' | 'cards';

@Component({
  selector: 'app-view-toggle',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './view-toggle.component.html',
  styleUrls: ['./view-toggle.component.scss']
})
export class ViewToggleComponent implements OnInit {
  @Input() storageKey: string = 'default-view-mode';
  @Input() defaultView: ViewMode = 'table';
  @Output() viewChange = new EventEmitter<ViewMode>();

  currentView: ViewMode = 'table';
  
  // Icons
  Table2 = Table2;
  Grid3x3 = Grid3x3;

  ngOnInit(): void {
    // Load saved preference from localStorage
    const saved = localStorage.getItem(this.storageKey);
    if (saved === 'table' || saved === 'cards') {
      this.currentView = saved;
    } else {
      this.currentView = this.defaultView;
    }
    this.viewChange.emit(this.currentView);
  }

  toggleView(view: ViewMode): void {
    if (this.currentView !== view) {
      this.currentView = view;
      localStorage.setItem(this.storageKey, view);
      this.viewChange.emit(view);
    }
  }
}
