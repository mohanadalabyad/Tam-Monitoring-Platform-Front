import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  totalReports = 234;
  publishedReports = 187;
  pendingReports = 47;
  totalUsers = 1240;

  // بيانات الحوادث حسب المدينة (لعرض الإحصائيات فقط)
  jerusalemIncidents = 23;
  ramallahIncidents = 18;
  nablusIncidents = 15;
  bethlehemIncidents = 12;
  hebronIncidents = 14;
  jeninIncidents = 9;
  gazaIncidents = 45;
  jaffaIncidents = 6;
  haifaIncidents = 11;
  
  get totalMapIncidents(): number {
    return 153; // إجمالي الحوادث على جميع المدن المعروضة
  }

  onMapImageError(event: any): void {
    // إذا فشل تحميل الخريطة من الإنترنت، استخدم خريطة بديلة
    event.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Palestinegeographic.png/500px-Palestinegeographic.png';
  }

  latestIncidents = [
    {
      type: 'حقوق المرأة',
      status: 'published',
      statusLabel: 'منشور',
      title: 'بلاغ عن تحرش في مكان عام',
      description: 'تم تلقي بلاغ عن مضايقات لفظية في مكان عام، ويجري توثيق الواقعة وإحالتها للجهات المختصة',
      location: 'رام الله',
      date: '٢٠٢٥/١٢/٠٥'
    },
    {
      type: 'حقوق المرأة',
      status: 'published',
      statusLabel: 'منشور',
      title: 'تمييز في بيئة عمل',
      description: 'بلاغ حول معاملة تمييزية تؤثر على فرص العمل والترقية، مع متابعة لإجراءات الشكوى والتوثيق',
      location: 'بيت لحم',
      date: '٢٠٢٥/١٢/٠٤'
    },
    {
      type: 'حقوق المرأة',
      status: 'published',
      statusLabel: 'منشور',
      title: 'عنف أسري (بلاغ تم التحقق منه)',
      description: 'بلاغ يتعلق بالعنف الأسري؛ تم توثيق المعلومات المتاحة وتوجيهه لمسارات الدعم والحماية حسب الإجراءات',
      location: 'نابلس',
      date: '٢٠٢٥/١٢/٠٣'
    }
  ];

  ngOnInit(): void {
    // Future: Load real statistics and incidents from service
  }
}
