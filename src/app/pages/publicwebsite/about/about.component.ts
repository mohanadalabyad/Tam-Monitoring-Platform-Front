import { Component, OnInit } from '@angular/core';
import { WebsiteContentService } from '../../../services/website-content.service';
import { WebsiteContentMap } from '../../../models/website-content.model';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  content: WebsiteContentMap = {};

  constructor(private websiteContentService: WebsiteContentService) {}

  ngOnInit(): void {
    this.websiteContentService.getPublicContent().subscribe(c => (this.content = c));
  }

  get aboutMission(): any {
    return this.content['AboutMission'] ?? {};
  }
  get aboutWhatWeDo(): any {
    return this.content['AboutWhatWeDo'] ?? {};
  }
  get aboutHowItWorks(): any {
    return this.content['AboutHowItWorks'] ?? {};
  }
  get aboutContact(): any {
    return this.content['AboutContact'] ?? {};
  }
  get aboutCta(): any {
    return this.content['AboutCta'] ?? {};
  }
}
