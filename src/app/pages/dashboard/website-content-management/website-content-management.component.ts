import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WebsiteContentService } from '../../../services/website-content.service';

export interface WebsiteContentCard {
  moduleKey: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-website-content-management',
  templateUrl: './website-content-management.component.html',
  styleUrls: ['./website-content-management.component.scss']
})
export class WebsiteContentManagementComponent implements OnInit {
  contentCards: WebsiteContentCard[] = [
    { moduleKey: 'Header', label: 'الهيدر', icon: 'M4 6h16M4 12h16M4 18h7' },
    { moduleKey: 'Footer', label: 'الفوتر', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { moduleKey: 'HomeHero', label: 'الصفحة الرئيسية – البانر', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { moduleKey: 'HomeStats', label: 'الصفحة الرئيسية – الإحصائيات', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 6a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6zm6 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { moduleKey: 'HomeFeatures', label: 'الصفحة الرئيسية – المميزات', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { moduleKey: 'HomeIncidents', label: 'الصفحة الرئيسية – الحوادث المنشورة', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { moduleKey: 'HomeHowItWorks', label: 'الصفحة الرئيسية – كيف يعمل', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { moduleKey: 'HomeAbout', label: 'الصفحة الرئيسية – عن تام', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { moduleKey: 'HomeMap', label: 'الصفحة الرئيسية – الخريطة', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
    { moduleKey: 'HomeCta', label: 'الصفحة الرئيسية – دعوة للعمل', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' },
    { moduleKey: 'AboutMission', label: 'عن المنصة – رسالتنا', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { moduleKey: 'AboutWhatWeDo', label: 'عن المنصة – ماذا نفعل', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { moduleKey: 'AboutHowItWorks', label: 'عن المنصة – كيف يعمل النظام', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { moduleKey: 'AboutContact', label: 'عن المنصة – تواصل معنا', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { moduleKey: 'AboutCta', label: 'عن المنصة – دعوة للعمل', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' }
  ];

  selectedModuleKey: string | null = null;
  loading = false;

  constructor(
    private websiteContentService: WebsiteContentService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  onCardClick(card: WebsiteContentCard): void {
    this.selectedModuleKey = card.moduleKey;
  }

  closeEdit(): void {
    this.selectedModuleKey = null;
  }

  getSelectedCardLabel(): string {
    if (!this.selectedModuleKey) return '';
    const card = this.contentCards.find(c => c.moduleKey === this.selectedModuleKey);
    return card?.label ?? this.selectedModuleKey;
  }
}
