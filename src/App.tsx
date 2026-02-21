import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  History, 
  Settings, 
  LogOut, 
  Activity, 
  Stethoscope, 
  FlaskConical, 
  AlertTriangle, 
  Brain, 
  Microscope, 
  Hospital, 
  Pill, 
  Calendar,
  Send,
  User as UserIcon,
  Search,
  ChevronRight,
  Loader2,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, MedicalCase, ClinicalReport, Language } from './types';
import { generateClinicalReport } from './services/geminiService';

// --- Translations ---

const translations = {
  en: {
    title: 'Clinical Copilot',
    subtitle: 'Medical Decision Support AI',
    dashboard: 'Dashboard',
    history: 'History',
    settings: 'Settings',
    signOut: 'Sign Out',
    practitioner: 'Practitioner',
    patientAssessment: 'Patient Assessment',
    caseHistory: 'Case History',
    enterData: 'Enter clinical data to generate AI-driven insights.',
    reviewManage: 'Review and manage previous clinical cases.',
    presentation: 'Clinical Presentation',
    chiefComplaint: 'Chief Complaint',
    complaintPlaceholder: 'Describe the primary reason for the visit...',
    symptoms: 'Associated Symptoms',
    symptomsPlaceholder: 'List any other symptoms reported by the patient...',
    vitalsLabs: 'Vitals & Labs',
    vitalSigns: 'Vital Signs',
    vitalsPlaceholder: 'BP: 120/80, HR: 72, Temp: 37.0°C...',
    labs: 'Laboratory Findings',
    labsPlaceholder: 'WBC: 8.5, Hb: 14.2, Na: 140...',
    generate: 'Generate Clinical Report',
    urgency: 'Urgency Assessment',
    differentialDx: 'Differential Diagnosis',
    workup: 'Recommended Workup',
    management: 'Management Plan',
    dosing: 'Dosing & Safety',
    monitoring: 'Monitoring & Follow-up',
    searchPlaceholder: 'Search by complaint or date...',
    date: 'Date',
    actions: 'Actions',
    view: 'View',
    accountSettings: 'Account Settings',
    email: 'Email Address',
    clinicName: 'Clinic Name',
    save: 'Save Changes',
    loginTitle: 'Sign In',
    password: 'Password',
    contactSupport: 'Contact support to change your registered email.',
    clinicPlaceholder: 'City Medical Center'
  },
  ar: {
    title: 'المساعد السريري',
    subtitle: 'ذكاء اصطناعي لدعم القرار الطبي',
    dashboard: 'لوحة التحكم',
    history: 'السجل المرضي',
    settings: 'الإعدادات',
    signOut: 'تسجيل الخروج',
    practitioner: 'ممارس طبي',
    patientAssessment: 'تقييم المريض',
    caseHistory: 'سجل الحالات',
    enterData: 'أدخل البيانات السريرية للحصول على رؤى مدعومة بالذكاء الاصطناعي.',
    reviewManage: 'مراجعة وإدارة الحالات السريرية السابقة.',
    presentation: 'العرض السريري',
    chiefComplaint: 'الشكوى الرئيسية',
    complaintPlaceholder: 'صف السبب الرئيسي للزيارة...',
    symptoms: 'الأعراض المصاحبة',
    symptomsPlaceholder: 'اذكر أي أعراض أخرى أبلغ عنها المريض...',
    vitalsLabs: 'العلامات الحيوية والمختبر',
    vitalSigns: 'العلامات الحيوية',
    vitalsPlaceholder: 'ضغط الدم: 120/80، النبض: 72، الحرارة: 37.0...',
    labs: 'نتائج المختبر',
    labsPlaceholder: 'كريات الدم: 8.5، الهيموجلوبين: 14.2، الصوديوم: 140...',
    generate: 'إنشاء التقرير السريري',
    urgency: 'تقييم درجة الاستعجال',
    differentialDx: 'التشخيص التفريقي',
    workup: 'الفحوصات الموصى بها',
    management: 'خطة العلاج',
    dosing: 'الجرعات والسلامة',
    monitoring: 'المتابعة والمراقبة',
    searchPlaceholder: 'البحث حسب الشكوى أو التاريخ...',
    date: 'التاريخ',
    actions: 'الإجراءات',
    view: 'عرض',
    accountSettings: 'إعدادات الحساب',
    email: 'البريد الإلكتروني',
    clinicName: 'اسم العيادة',
    save: 'حفظ التغييرات',
    loginTitle: 'تسجيل الدخول',
    password: 'كلمة المرور',
    contactSupport: 'اتصل بالدعم لتغيير بريدك الإلكتروني المسجل.',
    clinicPlaceholder: 'مركز المدينة الطبي'
  }
};

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, isAr }: { icon: any, label: string, active: boolean, onClick: () => void, isAr: boolean }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isAr ? 'flex-row-reverse text-right' : 'text-left'} ${
      active 
        ? 'bg-clinical-accent text-white shadow-lg shadow-clinical-accent/20' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const ReportCard = ({ title, icon: Icon, content, color, delay, isAr }: { title: string, icon: any, content: string[], color: string, delay: number, isAr: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`clinical-card border-l-4 ${isAr ? 'border-l-0 border-r-4 text-right' : 'text-left'} ${color}`}
  >
    <div className={`flex items-center gap-3 mb-4 ${isAr ? 'flex-row-reverse' : ''}`}>
      <div className={`p-2 rounded-lg ${color.replace('border-', 'bg-').replace('-500', '-100')} ${color.replace('border-', 'text-')}`}>
        <Icon size={20} />
      </div>
      <h3 className="font-bold text-gray-800 uppercase tracking-wider text-sm">{title}</h3>
    </div>
    <ul className="space-y-2">
      {content.map((item, i) => (
        <li key={i} className={`text-gray-600 text-sm flex gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
          <span className="text-clinical-accent">•</span>
          {item}
        </li>
      ))}
    </ul>
  </motion.div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MedicalCase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const t = translations[lang];
  const isAr = lang === 'ar';

  useEffect(() => {
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    const res = await fetch(`/api/history/${user.id}`);
    const data = await res.json();
    setHistory(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as any).email.value;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password' })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      if (data.user) {
        setUser(data.user);
      } else {
        throw new Error('No user data received');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      alert(lang === 'ar' ? `فشل تسجيل الدخول: ${error.message}` : `Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.complaint) return;
    setLoading(true);
    try {
      const result = await generateClinicalReport(formData, lang);
      setReport(result);

      // Save to DB
      const caseRes = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: user?.id })
      });
      const { id: caseId } = await caseRes.json();

      await fetch('/api/outputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId, content: result })
      });

      fetchHistory();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    complaint: '',
    symptoms: '',
    vitals: '',
    labs: ''
  });
  const [report, setReport] = useState<ClinicalReport | null>(null);

  const toggleLang = () => setLang(prev => prev === 'en' ? 'ar' : 'en');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-clinical-bg p-4">
        <div className="absolute top-4 right-4">
          <button onClick={toggleLang} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-black/5 text-sm font-bold text-clinical-accent">
            <Languages size={18} />
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-black/5 ${isAr ? 'text-right' : 'text-left'}`}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="bg-clinical-accent p-4 rounded-2xl text-white mb-4 shadow-lg shadow-clinical-accent/20">
              <Stethoscope size={40} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-500 text-sm">{t.subtitle}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
              <input name="email" type="email" required className="clinical-input" placeholder="doctor@clinic.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
              <input name="password" type="password" required className="clinical-input" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full bg-clinical-accent text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-all shadow-lg shadow-clinical-accent/20">
              {t.loginTitle}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex bg-clinical-bg ${isAr ? 'flex-row-reverse' : ''}`}>
      {/* Sidebar */}
      <aside className={`w-64 bg-clinical-sidebar text-white flex flex-col p-6 fixed h-full ${isAr ? 'right-0' : 'left-0'}`}>
        <div className={`flex items-center gap-3 mb-12 ${isAr ? 'flex-row-reverse' : ''}`}>
          <div className="bg-clinical-accent p-2 rounded-lg">
            <Stethoscope size={24} />
          </div>
          <span className="font-bold text-lg tracking-tight">{t.title}</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={LayoutDashboard} label={t.dashboard} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isAr={isAr} />
          <SidebarItem icon={History} label={t.history} active={activeTab === 'history'} onClick={() => setActiveTab('history')} isAr={isAr} />
          <SidebarItem icon={Settings} label={t.settings} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} isAr={isAr} />
        </nav>

        <div className="pt-6 border-t border-white/10">
          <div className={`flex items-center gap-3 mb-6 px-2 ${isAr ? 'flex-row-reverse text-right' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <UserIcon size={20} className="text-gray-300" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-gray-400">{t.practitioner}</p>
            </div>
          </div>
          <button onClick={() => setUser(null)} className={`w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all ${isAr ? 'flex-row-reverse' : ''}`}>
            <LogOut size={18} />
            <span className="text-sm font-medium">{t.signOut}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-8 ${isAr ? 'mr-64' : 'ml-64'}`}>
        <header className={`flex justify-between items-center mb-8 ${isAr ? 'flex-row-reverse' : ''}`}>
          <div className={isAr ? 'text-right' : 'text-left'}>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === 'dashboard' ? t.patientAssessment : activeTab === 'history' ? t.caseHistory : t.settings}
            </h2>
            <p className="text-gray-500 text-sm">
              {activeTab === 'dashboard' ? t.enterData : t.reviewManage}
            </p>
          </div>
          <div className={`flex items-center gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
            <button onClick={toggleLang} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-black/5 text-sm font-bold text-clinical-accent">
              <Languages size={18} />
              {lang === 'en' ? 'العربية' : 'English'}
            </button>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-black/5 text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar size={16} />
              {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Input Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`clinical-card space-y-6 ${isAr ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-center gap-2 text-clinical-accent mb-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                    <Activity size={20} />
                    <h3 className="font-bold">{t.presentation}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t.chiefComplaint}</label>
                      <textarea 
                        className={`clinical-input min-h-[100px] resize-none ${isAr ? 'text-right' : 'text-left'}`} 
                        placeholder={t.complaintPlaceholder}
                        value={formData.complaint}
                        onChange={e => setFormData({...formData, complaint: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t.symptoms}</label>
                      <textarea 
                        className={`clinical-input min-h-[100px] resize-none ${isAr ? 'text-right' : 'text-left'}`} 
                        placeholder={t.symptomsPlaceholder}
                        value={formData.symptoms}
                        onChange={e => setFormData({...formData, symptoms: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className={`clinical-card space-y-6 ${isAr ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-center gap-2 text-blue-500 mb-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                    <FlaskConical size={20} />
                    <h3 className="font-bold">{t.vitalsLabs}</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t.vitalSigns}</label>
                      <textarea 
                        className={`clinical-input min-h-[100px] resize-none ${isAr ? 'text-right' : 'text-left'}`} 
                        placeholder={t.vitalsPlaceholder}
                        value={formData.vitals}
                        onChange={e => setFormData({...formData, vitals: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t.labs}</label>
                      <textarea 
                        className={`clinical-input min-h-[100px] resize-none ${isAr ? 'text-right' : 'text-left'}`} 
                        placeholder={t.labsPlaceholder}
                        value={formData.labs}
                        onChange={e => setFormData({...formData, labs: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={handleGenerate}
                  disabled={loading || !formData.complaint}
                  className="bg-clinical-accent text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-green-700 transition-all shadow-xl shadow-clinical-accent/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} className={`${isAr ? 'rotate-180' : ''} group-hover:translate-x-1 transition-transform`} />}
                  {t.generate}
                </button>
              </div>

              {/* Report Display */}
              {report && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                  <ReportCard 
                    title={t.urgency} 
                    icon={AlertTriangle} 
                    content={[report.urgency]} 
                    color={report.urgency === 'High' || report.urgency === 'عالية' ? 'border-red-500' : (report.urgency === 'Medium' || report.urgency === 'متوسطة' ? 'border-yellow-500' : 'border-green-500')} 
                    delay={0.1}
                    isAr={isAr}
                  />
                  <ReportCard 
                    title={t.differentialDx} 
                    icon={Brain} 
                    content={report.differential_dx} 
                    color="border-blue-400" 
                    delay={0.2}
                    isAr={isAr}
                  />
                  <ReportCard 
                    title={t.workup} 
                    icon={Microscope} 
                    content={report.workup} 
                    color="border-blue-800" 
                    delay={0.3}
                    isAr={isAr}
                  />
                  <ReportCard 
                    title={t.management} 
                    icon={Hospital} 
                    content={report.management} 
                    color="border-green-400" 
                    delay={0.4}
                    isAr={isAr}
                  />
                  <ReportCard 
                    title={t.dosing} 
                    icon={Pill} 
                    content={report.dosing_safety} 
                    color="border-purple-400" 
                    delay={0.5}
                    isAr={isAr}
                  />
                  <ReportCard 
                    title={t.monitoring} 
                    icon={Calendar} 
                    content={report.monitoring_followup} 
                    color="border-orange-400" 
                    delay={0.6}
                    isAr={isAr}
                  />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className={`flex items-center gap-4 mb-6 ${isAr ? 'flex-row-reverse' : ''}`}>
                <div className="relative flex-1">
                  <Search className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
                  <input 
                    type="text" 
                    placeholder={t.searchPlaceholder} 
                    className={`clinical-input ${isAr ? 'pr-12 text-right' : 'pl-12 text-left'}`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="clinical-card p-0 overflow-hidden">
                <table className={`w-full ${isAr ? 'text-right' : 'text-left'}`}>
                  <thead className="bg-gray-50 border-bottom border-gray-100">
                    <tr className={isAr ? 'flex-row-reverse' : ''}>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.date}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.chiefComplaint}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.urgency}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history
                      .filter(c => c.complaint.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((item) => {
                        const reportData = item.report ? JSON.parse(item.report) : null;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(item.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate max-w-xs">
                              {item.complaint}
                            </td>
                            <td className="px-6 py-4">
                              {reportData && (
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                                  reportData.urgency === 'High' || reportData.urgency === 'عالية' ? 'bg-red-100 text-red-600' : 
                                  (reportData.urgency === 'Medium' || reportData.urgency === 'متوسطة' ? 'bg-yellow-100 text-yellow-600' : 
                                  'bg-green-100 text-green-600')
                                }`}>
                                  {reportData.urgency}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => {
                                  setFormData({
                                    complaint: item.complaint,
                                    symptoms: item.symptoms,
                                    vitals: item.vitals,
                                    labs: item.labs
                                  });
                                  setReport(reportData);
                                  setActiveTab('dashboard');
                                }}
                                className={`text-clinical-accent hover:text-green-700 flex items-center gap-1 text-sm font-bold ${isAr ? 'flex-row-reverse' : ''}`}
                              >
                                {t.view} <ChevronRight size={14} className={isAr ? 'rotate-180' : ''} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`max-w-2xl ${isAr ? 'mr-0 ml-auto' : ''}`}
            >
              <div className={`clinical-card space-y-6 ${isAr ? 'text-right' : 'text-left'}`}>
                <div className={`flex items-center gap-3 pb-4 border-b border-gray-100 ${isAr ? 'flex-row-reverse' : ''}`}>
                  <Settings size={20} className="text-gray-400" />
                  <h3 className="font-bold">{t.accountSettings}</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
                    <input type="email" disabled className={`clinical-input bg-gray-50 text-gray-500 ${isAr ? 'text-right' : 'text-left'}`} value={user.email} />
                    <p className="text-xs text-gray-400 mt-1">{t.contactSupport}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.clinicName}</label>
                    <input type="text" className={`clinical-input ${isAr ? 'text-right' : 'text-left'}`} placeholder={t.clinicPlaceholder} />
                  </div>
                  <div className="pt-4">
                    <button className="bg-clinical-accent text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-all">
                      {t.save}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
