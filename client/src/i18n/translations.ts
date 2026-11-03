import { applicationUrdu } from './applicationTranslations';
export type Language = 'en' | 'ur';

export const languageStorageKey = 'rozgar-links-language';

const urdu: Record<string, string> = {
  ...applicationUrdu,
  'Keep your contact details, CV and payment screenshot ready.':
    'اپنی رابطے کی تفصیلات، سی وی اور ادائیگی کا اسکرین شاٹ تیار رکھیں۔',
  'Sample countries': 'نمونہ ممالک',
  'Sample country assignments only; not verified vacancies.':
    'ممالک کی تقسیم صرف نمونہ ہے؛ تصدیق شدہ آسامیاں نہیں۔',
  'About this directory': 'اس ڈائریکٹری کے بارے میں',
  'All categories': 'تمام زمرے',
  'All salary ranges': 'تمام تنخواہ کی حدود',
  'All designations': 'تمام عہدے',
  'Applied filters': 'منتخب فلٹرز',
  Categories: 'زمرے',
  'Choose one category to narrow the directory.':
    'ڈائریکٹری کو محدود کرنے کے لیے ایک زمرہ منتخب کریں۔',
  Category: 'زمرہ',
  'Clear all': 'سب صاف کریں',
  'Clear all filters': 'تمام فلٹرز صاف کریں',
  'Close filters': 'فلٹرز بند کریں',
  'Country availability not yet verified': 'ملک کے لحاظ سے دستیابی کی ابھی تصدیق نہیں ہوئی',
  'Country filtering will be enabled when verified associations are available.':
    'ملک کے لحاظ سے فلٹر تصدیق شدہ معلومات دستیاب ہونے پر فعال کیا جائے گا۔',
  'Custom salary range': 'اپنی تنخواہ کی حد',
  'Default directory order': 'ڈائریکٹری کی اصل ترتیب',
  Designation: 'عہدہ',
  'Directory estimate only — not a vacancy or guaranteed employer offer.':
    'یہ صرف ڈائریکٹری کا تخمینہ ہے — کوئی دستیاب آسامی یا آجر کی یقینی پیشکش نہیں۔',
  'Featured occupations': 'نمایاں پیشے',
  'Featured occupations are temporarily unavailable. The full directory can be retried from the jobs page.':
    'نمایاں پیشے عارضی طور پر دستیاب نہیں۔ مکمل ڈائریکٹری کو ملازمتوں کے صفحے سے دوبارہ لوڈ کریں۔',
  'Filter occupations': 'پیشوں کو فلٹر کریں',
  Filters: 'فلٹرز',
  'Find the right occupation': 'مناسب پیشہ تلاش کریں',
  'GCC occupation directory': 'خلیجی پیشوں کی ڈائریکٹری',
  'Indicative monthly salary': 'تخمینی ماہانہ تنخواہ',
  'Indicative salary in SAR': 'سعودی ریال میں تخمینی تنخواہ',
  'Job title: A to Z': 'عنوان: حروفِ تہجی کے مطابق',
  'Loading featured occupations': 'نمایاں پیشے لوڈ ہو رہے ہیں',
  'Loading occupations': 'پیشے لوڈ ہو رہے ہیں',
  Maximum: 'زیادہ سے زیادہ',
  Minimum: 'کم سے کم',
  'Monthly salary': 'ماہانہ تنخواہ',
  'No matching occupations found': 'منتخب فلٹرز کے مطابق کوئی پیشہ نہیں ملا',
  'Occupation directory': 'پیشوں کی ڈائریکٹری',
  'Occupation directory temporarily unavailable': 'پیشوں کی ڈائریکٹری عارضی طور پر دستیاب نہیں',
  'Occupation results pagination': 'پیشوں کے نتائج کے صفحات',
  'Remove {filter}': '{filter} فلٹر ہٹائیں',
  Search: 'تلاش',
  'Search 64 occupations in English or Urdu and compare indicative monthly salary ranges.':
    'انگریزی یا اردو میں 64 پیشے تلاش کریں اور تخمینی ماہانہ تنخواہوں کا موازنہ کریں۔',
  'Search by occupation': 'پیشے کے نام سے تلاش کریں',
  'Salary ranges are indicative monthly directory figures in SAR, not guaranteed employer offers or verified vacancies.':
    'تنخواہ کی حدود سعودی ریال میں تخمینی ماہانہ اعداد ہیں، یہ آجر کی یقینی پیشکش یا تصدیق شدہ آسامی نہیں۔',
  'Salary: High to Low': 'تنخواہ: زیادہ سے کم',
  'Salary: Low to High': 'تنخواہ: کم سے زیادہ',
  'Sort by': 'ترتیب',
  'These are occupations with indicative SAR salary ranges, not live vacancies or guaranteed employer offers. Country filters remain disabled until verified associations are available.':
    'یہ تخمینی سعودی ریال تنخواہوں کے ساتھ پیشے ہیں، دستیاب آسامیاں یا آجر کی یقینی پیشکشیں نہیں۔ تصدیق شدہ ملکی معلومات آنے تک ملک کا فلٹر بند رہے گا۔',
  'Try changing or clearing one or more filters.':
    'ایک یا زیادہ فلٹر تبدیل یا صاف کر کے دوبارہ کوشش کریں۔',
  'Try Electrician, Driver or an Urdu title':
    'مثلاً الیکٹریشن، ڈرائیور یا کوئی انگریزی عنوان لکھیں',
  'View all occupations': 'تمام پیشے دیکھیں',
  'We could not load the occupation directory. Please try again.':
    'پیشوں کی ڈائریکٹری لوڈ نہیں ہو سکی۔ دوبارہ کوشش کریں۔',
  'Browse popular occupations and compare indicative monthly salary ranges.':
    'نمایاں پیشے دیکھیں اور تخمینی ماہانہ تنخواہوں کا موازنہ کریں۔',
  month: 'ماہ',
  '{count} occupations found': '{count} پیشے ملے',
  '7-day trend': '7 روزہ رجحان',
  '404 error': '404 خرابی',
  'A legitimate service address will appear after owner and legal review.':
    'مالک اور قانونی جانچ کے بعد مستند کاروباری پتہ یہاں درج کیا جائے گا۔',
  'A receipt appears here only after the server confirms that the administrator email was accepted. No application reference was created on this page.':
    'رسید صرف اس وقت یہاں ظاہر ہوتی ہے جب سرور تصدیق کرے کہ منتظم کو ای میل بھیج دی گئی ہے۔ اس صفحے پر درخواست کا کوئی حوالہ نہیں بنایا گیا۔',
  'A simple overview of estimated opportunities by country, trend and job field.':
    'ملک، رجحان اور شعبۂ ملازمت کے لحاظ سے متوقع مواقع کا آسان خلاصہ۔',
  'All fields': 'تمام شعبے',
  'All Gulf countries': 'تمام خلیجی ممالک',
  'Applicant safety notice': 'درخواست گزار کے لیے حفاظتی اطلاع',
  'Application form': 'درخواست فارم',
  'Application progress: step {current} of {total}':
    'درخواست کی پیش رفت: مرحلہ {current} از {total}',
  'Application setup could not be loaded. Please retry.':
    'درخواست کی ضروری معلومات لوڈ نہیں ہو سکیں۔ دوبارہ کوشش کریں۔',
  'Application email is not configured.': 'درخواست کی ای میل سروس ترتیب نہیں دی گئی۔',
  'Application email was not accepted.': 'ای میل سروس نے درخواست قبول نہیں کی۔ دوبارہ کوشش کریں۔',
  'Application submission is disabled in this hosted demo. No data was accepted.':
    'اس ہوسٹ کردہ نمائشی حالت میں درخواست جمع کرنا بند ہے۔ کوئی معلومات وصول نہیں کی گئیں۔',
  'Application submitted': 'درخواست جمع ہو گئی',
  'Are the current jobs live vacancies?': 'کیا موجودہ ملازمتیں اس وقت دستیاب آسامیاں ہیں؟',
  'Apply Now': 'ابھی درخواست دیں',
  Back: 'واپس',
  Bahrain: 'بحرین',
  'Browse jobs': 'ملازمتیں دیکھیں',
  'Business address': 'کاروباری پتہ',
  'Business contact: Pending owner verification': 'کاروباری رابطہ: مالک کی تصدیق باقی ہے',
  'Can I pay a service fee now?': 'کیا میں ابھی سروس فیس ادا کر سکتا/سکتی ہوں؟',
  'Check and finish': 'جانچیں اور مکمل کریں',
  'Check every section before the final action.': 'آخری کارروائی سے پہلے ہر حصہ جانچ لیں۔',
  'Choose a country and type of work that matches your experience.':
    'اپنے تجربے کے مطابق ملک اور کام کی قسم منتخب کریں۔',
  'Choose work': 'کام منتخب کریں',
  'Clear filters': 'فلٹر صاف کریں',
  'Close navigation menu': 'نیویگیشن مینو بند کریں',
  'Collection is disabled': 'رقم وصولی بند ہے',
  Company: 'کمپنی',
  'Confirm details before applying': 'درخواست دینے سے پہلے تفصیلات کی تصدیق کریں',
  Contact: 'رابطہ',
  'Contact information': 'رابطے کی معلومات',
  'Contact Rozgar Links': 'روزگار لنکس سے رابطہ کریں',
  'Continue to {step}': '{step} کی طرف جائیں',
  Countries: 'ممالک',
  'Countries covered': 'شامل ممالک',
  Country: 'ملک',
  'Daily opportunity snapshot': 'روزانہ مواقع کا خلاصہ',
  'Daily summary': 'روزانہ خلاصہ',
  'Dashboard temporarily unavailable': 'اعداد و شمار عارضی طور پر دستیاب نہیں',
  Date: 'تاریخ',
  'Does Rozgar Links guarantee a job?': 'کیا روزگار لنکس ملازمت کی ضمانت دیتا ہے؟',
  'Draft policy': 'ابتدائی پالیسی',
  Edit: 'ترمیم کریں',
  Email: 'ای میل',
  'Employment is not guaranteed. Fee collection remains disabled pending legal and licence approval.':
    'ملازمت کی ضمانت نہیں دی جاتی۔ قانونی اور لائسنس کی منظوری تک فیس وصولی بند رہے گی۔',
  'Explore jobs by country and apply with clear, simple guidance.':
    'ملک کے لحاظ سے ملازمتیں تلاش کریں اور واضح، آسان رہنمائی کے ساتھ درخواست دیں۔',
  'Explore job opportunities across six Gulf countries and filter them by country, work field or keyword.':
    'چھ خلیجی ممالک میں ملازمت کے مواقع دیکھیں اور ملک، شعبے یا مطلوبہ لفظ کے ذریعے نتائج محدود کریں۔',
  'Explore recently added opportunities and confirm current role details before applying.':
    'حال ہی میں شامل کیے گئے مواقع دیکھیں اور درخواست دینے سے پہلے موجودہ تفصیلات کی تصدیق کریں۔',
  'Explore the estimates': 'تخمینوں کی تفصیل دیکھیں',
  FAQ: 'عمومی سوالات',
  'Featured job listings': 'نمایاں ملازمتیں',
  'Featured jobs are temporarily unavailable. The full directory can be retried from the jobs page.':
    'نمایاں ملازمتیں عارضی طور پر دستیاب نہیں۔ ملازمتوں کے صفحے سے مکمل فہرست دوبارہ لوڈ کی جا سکتی ہے۔',
  'Fees & refunds': 'فیس اور رقم واپسی',
  'Fees and refunds': 'فیس اور رقم واپسی',
  Field: 'شعبہ',
  'Find jobs': 'ملازمتیں تلاش کریں',
  'Find your next Gulf opportunity.': 'خلیج میں اپنا اگلا موقع تلاش کریں۔',
  'Five simple steps': 'پانچ آسان مراحل',
  'Frequently asked questions': 'اکثر پوچھے جانے والے سوالات',
  'Get in touch': 'رابطہ کریں',
  'Get simple answers': 'آسان جواب حاصل کریں',
  'Help centre': 'مرکزِ مدد',
  Home: 'مرکزی صفحہ',
  'How it works': 'یہ کیسے کام کرتا ہے',
  'How Rozgar Links works': 'روزگار لنکس کیسے کام کرتا ہے',
  'Follow three simple stages from finding work to submitting your application.':
    'ملازمت تلاش کرنے سے درخواست جمع کرنے تک تین آسان مراحل پر عمل کریں۔',
  'Close how it works guide': 'طریقہ کار کی رہنمائی بند کریں',
  'Guide steps': 'رہنمائی کے مراحل',
  'Go to step {step}: {title}': 'مرحلہ {step} پر جائیں: {title}',
  'Indicative figures — last valid update shown':
    'تخمینی اعداد — آخری درست تازہ کاری دکھائی گئی ہے',
  'Indicative figures, updated daily': 'تخمینی اعداد، روزانہ تازہ کیے جاتے ہیں',
  'Indicative figures, updated daily. Direction arrows are illustrative, not verified trends.':
    'تخمینی اعداد روزانہ تازہ کیے جاتے ہیں۔ سمت کے تیر صرف وضاحت کے لیے ہیں، تصدیق شدہ رجحانات نہیں۔',
  'Indicative job counts are temporarily unavailable.':
    'ملازمتوں کے تخمینی اعداد عارضی طور پر دستیاب نہیں۔',
  'Indicative jobs by country': 'ملک کے لحاظ سے تخمینی ملازمتیں',
  'Indicative only.': 'صرف تخمینی۔',
  'Indicative openings': 'تخمینی مواقع',
  'Information handling': 'معلومات کا استعمال',
  'Job directory temporarily unavailable': 'ملازمتوں کی فہرست عارضی طور پر دستیاب نہیں',
  'Job field': 'ملازمت کا شعبہ',
  'Job fields': 'ملازمت کے شعبے',
  'Job listing': 'ملازمت کی تفصیل',
  'Job market statistics': 'ملازمتوں کے اعداد و شمار',
  Jobs: 'ملازمتیں',
  'Jobs across the Gulf': 'خلیجی ممالک میں ملازمتیں',
  'Keep your passport, contact details and test documents ready.':
    'اپنا پاسپورٹ، رابطے کی معلومات اور مطلوبہ دستاویزات تیار رکھیں۔',
  'Keep your contact details, CNIC, CV and payment screenshot ready.':
    'اپنی رابطے کی معلومات، شناختی کارڈ، سی وی اور ادائیگی کا اسکرین شاٹ تیار رکھیں۔',
  'Keep this server-issued reference for follow-up. Submission does not verify payment or guarantee an interview, visa, offer or placement.':
    'بعد کی کارروائی کے لیے سرور کی جانب سے جاری کردہ یہ حوالہ محفوظ رکھیں۔ درخواست جمع ہونے سے ادائیگی کی تصدیق یا انٹرویو، ویزا، پیشکش یا ملازمت کی ضمانت نہیں ہوتی۔',
  Kuwait: 'کویت',
  Language: 'زبان',
  'Last updated': 'آخری تازہ کاری',
  'Last valid cached catalog shown': 'آخری درست محفوظ فہرست دکھائی گئی ہے',
  'Launch authority': 'اجازتِ آغاز',
  Legal: 'قانونی معلومات',
  'Loading daily opportunity overview': 'روزانہ مواقع کا خلاصہ لوڈ ہو رہا ہے',
  'Loading featured jobs': 'نمایاں ملازمتیں لوڈ ہو رہی ہیں',
  'Loading indicative job counts': 'ملازمتوں کے تخمینی اعداد لوڈ ہو رہے ہیں',
  'Loading indicative statistics': 'تخمینی اعداد و شمار لوڈ ہو رہے ہیں',
  'Loading jobs': 'ملازمتیں لوڈ ہو رہی ہیں',
  Location: 'مقام',
  'New today': 'آج کے نئے مواقع',
  Next: 'اگلا',
  'No indicative openings are recorded for this update.':
    'اس تازہ کاری میں کوئی تخمینی موقع درج نہیں۔',
  'No matching listings': 'کوئی مماثل ملازمت نہیں ملی',
  'No public support email is approved. Do not send personal or identity information.':
    'عوامی معاونتی ای میل ابھی منظور نہیں ہوئی۔ ذاتی یا شناختی معلومات نہ بھیجیں۔',
  'No. Payment details and collection remain a non-operational demonstration until licensing, legal, privacy and fee-policy approvals are complete.':
    'نہیں۔ لائسنس، قانونی، رازداری اور فیس پالیسی کی منظوری مکمل ہونے تک ادائیگی کی تفصیلات اور وصولی صرف غیر فعال نمائش ہیں۔',
  'No. Rozgar Links is an independent assistance service. It does not guarantee interviews, visas, offers or employment.':
    'نہیں۔ روزگار لنکس ایک آزاد معاونتی سروس ہے۔ یہ انٹرویو، ویزا، پیشکش یا ملازمت کی ضمانت نہیں دیتی۔',
  'No listing matches this country, field and keyword combination.':
    'اس ملک، شعبے اور مطلوبہ لفظ کے امتزاج سے کوئی ملازمت نہیں ملی۔',
  'Not sure where to begin?': 'سمجھ نہیں آ رہا کہاں سے شروع کریں؟',
  'Office Assistant': 'دفتری معاون',
  Oman: 'عمان',
  'Open navigation menu': 'نیویگیشن مینو کھولیں',
  'Openings by country': 'ملک کے لحاظ سے مواقع',
  'Openings by job field': 'شعبۂ ملازمت کے لحاظ سے مواقع',
  'Opportunity directory': 'مواقع کی فہرست',
  'Opportunity insight views': 'مواقع کے اعداد دیکھنے کے طریقے',
  'Original source': 'اصل ماخذ',
  'Owner and legal approval required': 'مالک اور قانونی منظوری درکار ہے',
  'Page {page} of {total}': 'صفحہ {page} از {total}',
  'Page not found': 'صفحہ نہیں ملا',
  'Pending verification': 'تصدیق باقی ہے',
  'Prepare details': 'تفصیلات تیار کریں',
  Previous: 'پچھلا',
  Privacy: 'رازداری',
  'Privacy notice': 'رازداری کا نوٹس',
  'Proof is not verification': 'ثبوت، تصدیق نہیں ہے',
  Qatar: 'قطر',
  'Read the common questions first. They explain job listings, documents, fees and why no service can guarantee employment.':
    'پہلے عمومی سوالات پڑھیں۔ ان میں ملازمتوں، دستاویزات، فیس اور اس بات کی وضاحت ہے کہ کوئی سروس ملازمت کی ضمانت کیوں نہیں دے سکتی۔',
  'Recruitment licence: PENDING-VERIFICATION': 'بھرتی کا لائسنس: تصدیق باقی ہے',
  'Reference ID': 'حوالہ نمبر',
  'Refund terms pending': 'رقم واپسی کی شرائط زیرِ التوا ہیں',
  'Retention and deletion': 'معلومات محفوظ رکھنے اور حذف کرنے کا طریقہ',
  Retry: 'دوبارہ کوشش کریں',
  'Return home': 'مرکزی صفحے پر واپس جائیں',
  'Return to application': 'درخواست پر واپس جائیں',
  'Rozgar Links directory': 'روزگار لنکس فہرست',
  'Saudi Arabia': 'سعودی عرب',
  'Search and filters': 'تلاش اور فلٹر',
  'Search jobs': 'ملازمتیں تلاش کریں',
  'Search listings': 'ملازمتیں تلاش کریں',
  'Select language': 'زبان منتخب کریں',
  'Select the language you understand best. You can change it later from the navigation bar.':
    'وہ زبان منتخب کریں جو آپ بہتر سمجھتے ہیں۔ آپ بعد میں نیویگیشن بار سے زبان تبدیل کر سکتے ہیں۔',
  'Seven-day trend': 'سات روزہ رجحان',
  'Skip to main content': 'مرکزی مواد پر جائیں',
  'Start application': 'درخواست شروع کریں',
  'Straight answers about the service, listings, fees, documents and current launch status.':
    'سروس، ملازمتوں، فیس، دستاویزات اور موجودہ آغاز کی حالت کے بارے میں واضح جوابات۔',
  'Submission receipt unavailable': 'درخواست کی رسید دستیاب نہیں',
  'Support availability has not been approved or published.':
    'معاونت کے اوقات ابھی منظور یا شائع نہیں کیے گئے۔',
  'Support hours': 'معاونت کے اوقات',
  Terms: 'شرائط',
  'Terms of service': 'سروس کی شرائط',
  'The page you requested is not available.': 'آپ کا مطلوبہ صفحہ دستیاب نہیں۔',
  'The directory contains opportunities collected by Rozgar Links. Availability and requirements can change, so confirm the current details before applying.':
    'فہرست میں روزگار لنکس کی جمع کردہ ملازمتیں شامل ہیں۔ دستیابی اور شرائط بدل سکتی ہیں، اس لیے درخواست سے پہلے موجودہ تفصیلات کی تصدیق کریں۔',
  'These estimates are not verified vacancies.':
    'یہ تخمینے تصدیق شدہ آسامیوں کی نمائندگی نہیں کرتے۔',
  'Third-party transfer': 'تیسرے فریق کو معلومات کی منتقلی',
  'Three clear stages': 'تین واضح مراحل',
  'Title, company or city': 'عہدہ، کمپنی یا شہر',
  'Total jobs': 'کل ملازمتیں',
  'Total openings': 'کل مواقع',
  'Try broader filters': 'مزید وسیع فلٹر آزمائیں',
  'United Arab Emirates': 'متحدہ عرب امارات',
  'Updated from one validated daily snapshot.': 'ایک جانچ شدہ روزانہ خلاصے سے تازہ کیا گیا۔',
  Verification: 'تصدیق',
  'View all jobs': 'تمام ملازمتیں دیکھیں',
  'View application steps': 'درخواست کے مراحل دیکھیں',
  'View exact values': 'درست اعداد دیکھیں',
  'We could not load the current listings. Please try again.':
    'موجودہ ملازمتیں لوڈ نہیں ہو سکیں۔ دوبارہ کوشش کریں۔',
  'We could not load the indicative figures. No opening count has been invented or substituted.':
    'تخمینی اعداد لوڈ نہیں ہو سکے۔ ان کی جگہ کوئی فرضی تعداد نہیں دکھائی گئی۔',
  'Welcome to Rozgar Links': 'روزگار لنکس میں خوش آمدید',
  '11 digits, starting with 03.': '11 ہندسے درج کریں، نمبر 03 سے شروع ہونا چاہیے۔',
  'Account number': 'اکاؤنٹ نمبر',
  'Account title': 'اکاؤنٹ کا نام',
  Administration: 'انتظامیہ',
  'Administrator delivery accepted': 'منتظم کو ای میل بھیج دی گئی',
  'Application progress': 'درخواست کی پیش رفت',
  'Application submission is disabled in this hosted demo.':
    'اس ہوسٹ کردہ نمونے میں درخواست جمع کرنا بند ہے۔',
  Bank: 'بینک',
  'Bar chart of indicative openings by Gulf country':
    'خلیجی ملک کے لحاظ سے تخمینی مواقع کا بار چارٹ',
  'Bar chart of indicative openings by job field':
    'ملازمت کے شعبے کے لحاظ سے تخمینی مواقع کا بار چارٹ',
  'Basic details': 'بنیادی معلومات',
  'Building Painter': 'عمارتوں کا پینٹر',
  CV: 'سی وی',
  'CV is required.': 'سی وی درکار ہے۔',
  'CV and payment screenshot are required.': 'سی وی اور ادائیگی کا اسکرین شاٹ درکار ہیں۔',
  'CV must be 5 MiB or smaller.': 'سی وی کا حجم 5 MiB یا اس سے کم ہونا چاہیے۔',
  Carpenter: 'بڑھئی',
  Cashier: 'کیشیئر',
  'CCTV Operator': 'سی سی ٹی وی آپریٹر',
  'Check your details. Sensitive identifiers are masked.':
    'اپنی معلومات جانچ لیں۔ حساس شناختی معلومات چھپا دی گئی ہیں۔',
  'Civil Engineering Assistant': 'سول انجینئرنگ معاون',
  'Complete one step at a time. You can review everything before submitting.':
    'ایک وقت میں ایک مرحلہ مکمل کریں۔ جمع کرنے سے پہلے آپ تمام معلومات کا جائزہ لے سکتے ہیں۔',
  Construction: 'تعمیرات',
  'Construction Helper': 'تعمیراتی معاون',
  'Contact details': 'رابطے کی معلومات',
  'Continue with the country and work category already selected for you.':
    'آپ کے لیے پہلے سے منتخب ملک اور کام کے شعبے کے ساتھ آگے بڑھیں۔',
  Copy: 'کاپی کریں',
  'Copy {label}': '{label} کاپی کریں',
  'Could not copy {label}.': '{label} کاپی نہیں ہو سکا۔',
  'Current city': 'موجودہ شہر',
  'Date of birth': 'تاریخِ پیدائش',
  'Delivery Driver': 'ڈلیوری ڈرائیور',
  'Demo fee:': 'نمائشی فیس:',
  'Demo only:': 'صرف نمائش:',
  'Demo values only. Payment is not active.': 'یہ صرف نمائشی معلومات ہیں۔ ادائیگی فعال نہیں ہے۔',
  'Document Controller': 'دستاویزات کنٹرولر',
  Documents: 'دستاویزات',
  'Documents are processed in memory and emailed to the configured administrator only after secure server validation. During this demonstration stage, use test files only; applicant data is not stored in the application database.':
    'دستاویزات محفوظ سرور جانچ کے بعد عارضی طور پر میموری میں پراسیس ہوتی ہیں اور صرف مقررہ منتظم کو ای میل کی جاتی ہیں۔ اس نمائشی مرحلے میں صرف آزمائشی فائلیں استعمال کریں؛ درخواست گزار کا ڈیٹا ایپلیکیشن ڈیٹابیس میں محفوظ نہیں ہوتا۔',
  'Drivers & Transport': 'ڈرائیونگ اور ٹرانسپورٹ',
  Education: 'تعلیم',
  'Email address': 'ای میل پتہ',
  Engineering: 'انجینئرنگ',
  'Enter CNIC as #####-#######-#.': 'شناختی کارڈ نمبر #####-#######-# کی صورت میں درج کریں۔',
  'Enter a valid date in YYYY-MM-DD format.': 'درست تاریخ درج کریں۔',
  'Enter a valid email address.': 'درست ای میل پتہ درج کریں۔',
  'Enter an 11-digit mobile number starting with 03.':
    '03 سے شروع ہونے والا 11 ہندسوں کا موبائل نمبر درج کریں۔',
  Experience: 'تجربہ',
  Female: 'خاتون',
  'First name': 'پہلا نام',
  'Forklift Operator': 'فورک لفٹ آپریٹر',
  'Freight Operations Assistant': 'مال برداری آپریشنز معاون',
  Gender: 'جنس',
  'HSE Assistant': 'صحت، حفاظت و ماحول معاون',
  Healthcare: 'صحت کی دیکھ بھال',
  'Help Desk Technician': 'ہیلپ ڈیسک ٹیکنیشن',
  'Home Care Assistant': 'گھریلو نگہداشت معاون',
  Hospitality: 'مہمان نوازی',
  'Housekeeping Attendant': 'صفائی و ہاؤس کیپنگ معاون',
  IBAN: 'آئی بین',
  Identification: 'شناختی معلومات',
  'Independent service': 'آزاد سروس',
  'Information Technology': 'انفارمیشن ٹیکنالوجی',
  'Inventory Clerk': 'اسٹاک ریکارڈ کلرک',
  'Is Rozgar Links affiliated with external job boards?':
    'کیا روزگار لنکس بیرونی جاب بورڈز سے وابستہ ہے؟',
  'IT Operations Assistant': 'آئی ٹی آپریشنز معاون',
  'Job availability and requirements can change. Rozgar Links is independent and does not claim affiliation with or endorsement by external job boards or employers.':
    'ملازمت کی دستیابی اور شرائط بدل سکتی ہیں۔ روزگار لنکس ایک آزاد سروس ہے اور کسی بیرونی جاب بورڈ یا آجر سے وابستگی یا توثیق کا دعویٰ نہیں کرتی۔',
  'Job results pagination': 'ملازمتوں کے نتائج کے صفحات',
  'Job selected.': 'ملازمت منتخب ہو گئی۔',
  'Junior Electrical Technician': 'جونیئر الیکٹریکل ٹیکنیشن',
  'Junior Process Operator': 'جونیئر پروسیس آپریٹر',
  'Junior Web Support Officer': 'جونیئر ویب سپورٹ افسر',
  'Kitchen Helper': 'باورچی خانے کا معاون',
  'Last name': 'آخری نام',
  'Light Vehicle Driver': 'ہلکی گاڑی کا ڈرائیور',
  'Line chart of indicative openings over seven days': 'سات دنوں کے تخمینی مواقع کا لائن چارٹ',
  'Listings collected and maintained by Rozgar Links. Confirm current details before applying.':
    'یہ ملازمتیں روزگار لنکس نے جمع اور مرتب کی ہیں۔ درخواست دینے سے پہلے موجودہ تفصیلات کی تصدیق کریں۔',
  'Loading validated application options…': 'درخواست کے تصدیق شدہ اختیارات لوڈ ہو رہے ہیں…',
  Logistics: 'لاجسٹکس',
  'Maintenance Technician': 'دیکھ بھال ٹیکنیشن',
  Male: 'مرد',
  'Mechanical Technician': 'مکینیکل ٹیکنیشن',
  'Medical Records Clerk': 'طبی ریکارڈ کلرک',
  'Mobile navigation': 'موبائل نیویگیشن',
  Name: 'نام',
  'National ID': 'قومی شناختی نمبر',
  'Network Support Assistant': 'نیٹ ورک سپورٹ معاون',
  'No employment guarantee': 'ملازمت کی کوئی ضمانت نہیں',
  'No partnership or endorsement is claimed. Rozgar Links is independent from GulfTalent, NaukriGulf and any employer unless written authorization is later documented.':
    'کسی شراکت یا توثیق کا دعویٰ نہیں کیا جاتا۔ تحریری اجازت کی دستاویز موجود ہونے تک روزگار لنکس GulfTalent، NaukriGulf اور تمام آجروں سے آزاد ہے۔',
  'Nursing Assistant': 'نرسنگ معاون',
  'Oil & Gas': 'تیل اور گیس',
  Other: 'دیگر',
  'PDF, DOC or DOCX; maximum 5 MiB.': 'PDF، DOC یا DOCX؛ زیادہ سے زیادہ حجم 5 MiB۔',
  'Pakistan CNIC format: 12345-1234567-1.': 'پاکستانی شناختی کارڈ کی شکل: 12345-1234567-1۔',
  Payment: 'ادائیگی',
  'Payment evidence': 'ادائیگی کا ثبوت',
  'Payment screenshot': 'ادائیگی کا اسکرین شاٹ',
  'Payment screenshot is required.': 'ادائیگی کا اسکرین شاٹ درکار ہے۔',
  'Payment screenshot preview': 'ادائیگی کے اسکرین شاٹ کا پیش منظر',
  'Pharmacy Assistant': 'فارمیسی معاون',
  Phone: 'فون',
  'Phone / WhatsApp': 'فون / واٹس ایپ',
  'Pipeline Helper': 'پائپ لائن معاون',
  'Please fix the following:': 'براہِ کرم درج ذیل مسائل درست کریں:',
  'Prefer not to say': 'بتانا نہیں چاہتا/چاہتی',
  Preferences: 'ترجیحات',
  'Preferences were filled when available and can be changed.':
    'دستیاب ترجیحات پہلے سے بھری گئی ہیں اور آپ انہیں تبدیل کر سکتے ہیں۔',
  'Preferred Gulf countries': 'ترجیحی خلیجی ممالک',
  'Primary navigation': 'مرکزی نیویگیشن',
  'Reception Assistant': 'استقبالیہ معاون',
  Required: 'ضروری',
  'Required JPEG or PNG; maximum 5 MiB. The secure server validates its file signature again.':
    'JPEG یا PNG درکار ہے؛ زیادہ سے زیادہ حجم 5 MiB۔ محفوظ سرور فائل کی اصل ساخت دوبارہ جانچے گا۔',
  'Restaurant Server': 'ریسٹورنٹ سروس اسٹاف',
  Retail: 'خوردہ فروشی',
  Review: 'جائزہ',
  'Review the guided application steps or visit the original source.':
    'رہنمائی والے درخواست مراحل دیکھیں یا اصل ماخذ ملاحظہ کریں۔',
  'Retry setup': 'معلومات دوبارہ لوڈ کریں',
  'Rozgar Links is an independent service and is not affiliated with or endorsed by GulfTalent or NaukriGulf. Listings are shown for convenience; trademarks belong to their owners.':
    'روزگار لنکس ایک آزاد سروس ہے اور GulfTalent یا NaukriGulf سے وابستہ یا ان کی توثیق شدہ نہیں۔ ملازمتیں سہولت کے لیے دکھائی جاتی ہیں؛ تجارتی نام اپنے مالکان کی ملکیت ہیں۔',
  'Rozgar Links is not accepting applications, fees, resumes, passport copies, CNIC values or payment evidence through contact channels during this demonstration stage.':
    'اس نمائشی مرحلے میں روزگار لنکس رابطے کے ذرائع سے درخواستیں، فیس، سی وی، پاسپورٹ کی نقول، شناختی کارڈ نمبر یا ادائیگی کے ثبوت قبول نہیں کر رہی۔',
  'Sales Associate': 'سیلز معاون',
  'School Administration Assistant': 'اسکول انتظامیہ معاون',
  Screenshot: 'اسکرین شاٹ',
  Security: 'سکیورٹی',
  'Security Guard': 'سکیورٹی گارڈ',
  'Select a field': 'شعبہ منتخب کریں',
  'Selected: {file}': 'منتخب فائل: {file}',
  'Should I send my CV or identity documents now?':
    'کیا مجھے ابھی اپنا سی وی یا شناختی دستاویزات بھیجنی چاہییں؟',
  'Site Mason': 'تعمیراتی مستری',
  Status: 'حالت',
  'Steel Fixer': 'سریا باندھنے والا',
  'Step {current} of {total}': 'مرحلہ {current} از {total}',
  Storekeeper: 'اسٹور کیپر',
  'Submit application': 'درخواست جمع کریں',
  'Submission disabled in demo': 'نمائشی حالت میں درخواست بند ہے',
  'Teaching Assistant': 'تدریسی معاون',
  'Test payment details — do not pay': 'آزمائشی ادائیگی کی تفصیلات — رقم ادا نہ کریں',
  'The application could not be submitted. Please try again.':
    'درخواست جمع نہیں ہو سکی۔ دوبارہ کوشش کریں۔',
  'The application contains invalid fields.': 'درخواست میں کچھ معلومات درست نہیں ہیں۔',
  'The application upload is too large.':
    'درخواست کے ساتھ منتخب فائلوں کا مجموعی حجم بہت زیادہ ہے۔',
  'The multipart upload is invalid.': 'فائلیں درست طریقے سے اپ لوڈ نہیں ہو سکیں۔',
  'The selected files are too large for this hosting service. Please choose smaller files and try again.':
    'منتخب فائلیں اس ہوسٹنگ سروس کے لیے بہت بڑی ہیں۔ چھوٹی فائلیں منتخب کر کے دوبارہ کوشش کریں۔',
  'Too many applications. Please try again later.':
    'بہت زیادہ درخواستیں بھیجی گئی ہیں۔ کچھ دیر بعد دوبارہ کوشش کریں۔',
  'One or more uploads are not allowed.': 'ایک یا زیادہ منتخب فائلوں کی اجازت نہیں ہے۔',
  'Tile Installer': 'ٹائل لگانے والا',
  'Unverified demo evidence': 'غیر تصدیق شدہ نمائشی ثبوت',
  'Warehouse Associate': 'گودام معاون',
  'We will use this for application updates.':
    'ہم اسے درخواست سے متعلق تازہ معلومات کے لیے استعمال کریں گے۔',
  'Years of experience': 'تجربے کے سال',
  'Your information and selected files remain available for retry.':
    'دوبارہ کوشش کے لیے آپ کی معلومات اور منتخب فائلیں اسی صفحے پر موجود رہیں گی۔',
  'nothing is submitted. Use test details and files.':
    'کچھ بھی جمع نہیں کیا جائے گا۔ آزمائشی معلومات اور فائلیں استعمال کریں۔',
  '{label} copied.': '{label} کاپی ہو گیا۔',
  '{years} years': '{years} سال',
  'A payment screenshot or transaction reference is unverified evidence only. It must never be described as a confirmed payment without manual offline review.':
    'ادائیگی کا اسکرین شاٹ یا لین دین کا حوالہ صرف غیر تصدیق شدہ ثبوت ہے۔ دستی جانچ کے بغیر اسے تصدیق شدہ ادائیگی قرار نہیں دیا جا سکتا۔',
  'A specific retention period, deletion procedure and subject-access channel must be approved before launch. Temporary files must be removed after processing, including error paths.':
    'آغاز سے پہلے معلومات محفوظ رکھنے کی مدت، حذف کرنے کا طریقہ اور درخواست گزار کی رسائی کا ذریعہ منظور ہونا ضروری ہے۔ پراسیسنگ کے بعد، خرابی کی صورت سمیت، عارضی فائلیں حذف کرنا ضروری ہے۔',
  'Any bank details or fee values shown in this demonstration are test data and must not be used until legal, licensing, identity and payment approvals are complete.':
    'اس نمائش میں دکھائی گئی بینک یا فیس کی معلومات آزمائشی ہیں۔ قانونی، لائسنس، شناخت اور ادائیگی کی منظوری مکمل ہونے تک انہیں استعمال نہ کریں۔',
  'Applicant must be at least 18 years old.': 'درخواست گزار کی عمر کم از کم 18 سال ہونی چاہیے۔',
  'Applicants must be told that an approved SMTP provider will process their submitted information and attachments for administrator delivery.':
    'درخواست گزاروں کو بتایا جانا چاہیے کہ منظور شدہ SMTP فراہم کنندہ ان کی جمع کردہ معلومات اور منسلک فائلیں منتظم تک پہنچانے کے لیے پراسیس کرے گا۔',
  'Choose the countries and types of work you prefer.':
    'اپنی ترجیح کے ممالک اور کام کی اقسام منتخب کریں۔',
  'Eligibility, timelines, deductions, cancellation rights and the support process require owner and legal approval before applicants can accept this policy.':
    'اہلیت، مدت، کٹوتیوں، منسوخی کے حقوق اور معاونتی عمل کو درخواست گزاروں کی منظوری سے پہلے مالک اور قانونی منظوری درکار ہے۔',
  'Follow the five clear application steps and review everything at the end.':
    'درخواست کے پانچ واضح مراحل مکمل کریں اور آخر میں تمام معلومات جانچ لیں۔',
  Personal: 'ذاتی معلومات',
  'Public recruitment assistance and paid services remain blocked until the legal entity, licence number and regulatory authority are independently verified.':
    'قانونی ادارے، لائسنس نمبر اور متعلقہ نگران اتھارٹی کی آزادانہ تصدیق تک عوامی بھرتی معاونت اور بامعاوضہ خدمات بند رہیں گی۔',
  'Review the test payment example and upload the payment screenshot.':
    'آزمائشی ادائیگی کی مثال دیکھیں اور ادائیگی کا اسکرین شاٹ اپ لوڈ کریں۔',
  'Rozgar Links is not affiliated with or endorsed by job boards or employers unless written authorization is published. External trademarks remain their owners’ property.':
    'تحریری اجازت شائع ہونے تک روزگار لنکس کسی جاب بورڈ یا آجر سے وابستہ یا ان کی توثیق شدہ نہیں۔ بیرونی تجارتی نام اپنے مالکان کی ملکیت ہیں۔',
  'Select at least one Gulf country.': 'کم از کم ایک خلیجی ملک منتخب کریں۔',
  'Select a recognized job field.': 'درست ملازمت کا شعبہ منتخب کریں۔',
  'Select the test documents needed for this demonstration.':
    'اس نمائش کے لیے درکار آزمائشی دستاویزات منتخب کریں۔',
  'Tell us who you are and how to contact you.': 'اپنی بنیادی معلومات اور رابطے کا طریقہ بتائیں۔',
  'The planned service will collect application details and documents only with explicit consent. Applicant PII will not be stored in the application database in v1.':
    'منصوبہ بند سروس واضح رضامندی کے ساتھ ہی درخواست کی معلومات اور دستاویزات حاصل کرے گی۔ پہلے ورژن میں درخواست گزار کی ذاتی شناختی معلومات ایپلیکیشن ڈیٹابیس میں محفوظ نہیں ہوں گی۔',
  'This fee and refund policy is a non-operational draft. Rozgar Links is not collecting payments.':
    'فیس اور رقم واپسی کی یہ پالیسی ایک غیر فعال مسودہ ہے۔ روزگار لنکس ادائیگیاں وصول نہیں کر رہی۔',
  'This privacy notice is a reviewable development stub, not an approved public policy.':
    'رازداری کا یہ نوٹس جانچ کے لیے ابتدائی مسودہ ہے، منظور شدہ عوامی پالیسی نہیں۔',
  'These terms are a reviewable development stub and cannot be accepted as final service terms.':
    'یہ شرائط جانچ کے لیے ابتدائی مسودہ ہیں اور انہیں سروس کی حتمی شرائط کے طور پر قبول نہیں کیا جا سکتا۔',
  'Using the service will not guarantee an interview, visa, offer or placement. Applicant information must be accurate and will remain subject to manual review.':
    'سروس کے استعمال سے انٹرویو، ویزا، پیشکش یا ملازمت کی ضمانت نہیں ہوتی۔ درخواست گزار کی معلومات درست ہونی چاہییں اور ان کی دستی جانچ کی جائے گی۔',
  'Verified business contact details will be published only after the owner confirms the legal entity, service address and support channel.':
    'کاروباری رابطے کی تصدیق شدہ معلومات تبھی شائع کی جائیں گی جب مالک قانونی ادارے، سروس کے پتے اور معاونتی ذریعے کی تصدیق کرے گا۔',
  jobs: 'ملازمتیں',
  listing: 'ملازمت',
  listings: 'ملازمتیں',
};

export function translate(
  language: Language,
  message: string,
  values?: Record<string, string | number>,
) {
  let template = language === 'ur' ? (urdu[message] ?? message) : message;

  if (language === 'ur' && template === message) {
    const requiredMatch = message.match(/^(.+) is required\.$/);
    const tooLongMatch = message.match(/^(.+) is too long\.$/);
    const tooLargeMatch = message.match(/^(.+) must be 5 MiB or smaller\.$/);
    const unsupportedMatch = message.match(/^(.+) has an unsupported file type\.$/);

    if (requiredMatch?.[1]) template = `${translate('ur', requiredMatch[1])} درکار ہے۔`;
    if (tooLongMatch?.[1]) template = `${translate('ur', tooLongMatch[1])} بہت طویل ہے۔`;
    if (tooLargeMatch?.[1])
      template = `${translate('ur', tooLargeMatch[1])} کا حجم 5 MiB یا اس سے کم ہونا چاہیے۔`;
    if (unsupportedMatch?.[1])
      template = `${translate('ur', unsupportedMatch[1])} کی فائل کی قسم قابلِ قبول نہیں۔`;
  }

  return Object.entries(values ?? {}).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
