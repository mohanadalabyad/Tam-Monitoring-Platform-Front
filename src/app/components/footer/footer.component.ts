import { Component, OnInit } from '@angular/core';
import { WebsiteContentService } from '../../services/website-content.service';
import { FooterContent } from '../../models/website-content.model';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  currentYear = new Date().getFullYear();
  footerContent: FooterContent | null = null;

  constructor(private websiteContentService: WebsiteContentService) {}

  ngOnInit(): void {
    this.websiteContentService.getPublicContent().subscribe(content => {
      this.footerContent = (content?.['Footer'] as FooterContent) ?? null;
    });
  }
}
