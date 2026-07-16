import { useEffect, useMemo, useRef, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { InfoTooltip } from '@/components/ui/tooltip';
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, AnimatePresence } from 'motion/react';
import {
  AlignLeft,
  Bold,
  ChevronDown,
  ChevronRight,
  Clock3,
  CloudUpload,
  CloudCog,
  Eye,
  ImagePlus,
  Info,
  Italic,
  Link2,
  Lock,
  List,
  ListIndentDecrease,
  ListIndentIncrease,
  ListOrdered,
  Maximize2,
  Minus,
  Plus,
  GripVertical,
  RefreshCw,
  Settings,
  SquarePen,
  Target,
  Underline,
  X,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectInputTrigger,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './MotionSelect';
import { SpringCaretInput, SpringCaretTextarea } from './SpringCaretInput';
import { Switch } from './MotionSwitch';
import { RippleButton } from './RippleButton';
import { RadialButton } from './RadialButton';
import { WheelPicker } from './WheelPicker';
import { getCurrentUser, recoverCurrentUser } from '@/services/authService';
import { getAvailableSections, getTeacherCourses, type TeacherCourse } from '@/services/usersService';
import './NewCoursePage.css';

type NewCoursePageProps = {
  onClose: () => void;
};

type OptionTab = 'general' | 'drip' | 'enrollment';

type MediaPreview = {
  name: string;
  url: string;
};

type LearningOutcome = {
  id: number;
  value: string;
};

const SUPPORTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const ACTIVATION_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const ACTIVATION_HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const ACTIVATION_MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();

const checkmarkVariants = {
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.3, ease: [0.65, 0, 0.35, 1] },
      opacity: { duration: 0.05, delay: 0.06 },
    },
  },
  unchecked: {
    pathLength: 0,
    opacity: 0,
    transition: {
      pathLength: { duration: 0.25, ease: [0.65, 0, 0.35, 1] },
      opacity: { duration: 0.1, delay: 0.18 },
    },
  },
} as const;

const reducedCheckmarkVariants = {
  checked: { pathLength: 1, opacity: 1 },
  unchecked: { pathLength: 0, opacity: 0 },
} as const;

const RollingNumber = ({ value, suffix = '', reduceMotion, immediate = false }: { value: number; suffix?: string; reduceMotion: boolean; immediate?: boolean }) => {
  const motionValue = useMotionValue(reduceMotion ? value : 0);
  const roundedValue = useTransform(motionValue, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(reduceMotion ? value : 0);
  const isFirstRender = useRef(true);

  useMotionValueEvent(roundedValue, 'change', setDisplayValue);

  useEffect(() => {
    if (reduceMotion) {
      motionValue.jump(value);
      setDisplayValue(value);
      return;
    }

    if (isFirstRender.current && !immediate) {
      motionValue.jump(0);
      setDisplayValue(0);
    }
    isFirstRender.current = false;

    let numberAnimation: ReturnType<typeof animate> | undefined;
    const delayTimer = window.setTimeout(() => {
      numberAnimation = animate(motionValue, value, {
        duration: immediate ? 0.6 : 2,
        ease: [0.22, 1, 0.36, 1],
      });
    }, immediate ? 0 : 1000);

    return () => {
      window.clearTimeout(delayTimer);
      numberAnimation?.stop();
    };
  }, [motionValue, reduceMotion, value, immediate]);

  return (
    <span className="ncp-number-ticker" aria-label={`${value}${suffix}`}>
      <NumberFlow
        aria-hidden="true"
        animated={!reduceMotion}
        className="ncp-number-ticker-value"
        format={{ useGrouping: false }}
        locales="en-US"
        suffix={suffix}
        trend={1}
        value={displayValue}
        willChange
      />
    </span>
  );
};

const AiSparklesIcon = () => (
  <svg
    className="ncp-heading-sparkles"
    viewBox="180 160 670 670"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ff9d00" />
        <stop offset="30%" stopColor="#ff3366" />
        <stop offset="70%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#4361ee" />
      </linearGradient>
    </defs>
    <path
      d="M501.085724,427.904205 C525.800232,448.796417 554.027527,461.693054 585.061829,468.733856 C593.334778,470.610718 601.679688,472.207092 610.039551,473.654846 C619.925781,475.366852 626.952209,482.697815 627.335754,492.127838 C627.819641,504.025543 622.324036,511.952087 611.476868,514.171143 C601.861328,516.138184 592.194153,517.810059 582.642029,520.131042 C515.828430,536.365601 469.807098,576.283203 445.278259,640.637878 C438.924316,657.308350 434.458008,674.537170 431.127258,692.066833 C429.361969,701.357422 420.886353,707.988647 411.276062,707.848022 C401.346252,707.702759 393.737274,700.260742 391.693481,689.791260 C386.217407,661.740112 378.551361,634.437866 363.883881,609.506775 C343.371613,574.641113 314.794556,548.960083 277.819641,532.531006 C257.102661,523.325867 235.237488,518.348450 213.064835,514.448364 C202.246384,512.545471 195.563324,504.599182 195.686111,493.435944 C195.797577,483.302551 202.992676,475.433685 213.370865,473.644196 C238.728256,469.271912 263.588470,463.208618 286.700562,451.398712 C329.973236,429.287018 359.439911,394.961487 376.329193,349.666779 C383.675446,329.965179 388.479492,309.561890 391.830505,288.810608 C394.657043,271.307312 411.333221,263.632690 424.127716,273.950989 C428.172241,277.212769 430.473846,281.539520 431.300690,286.704834 C435.521729,313.073181 441.384735,338.976746 452.583679,363.427002 C464.004944,388.362488 480.166077,409.692474 501.085724,427.904205 z"
      fill="url(#sparkleGradient)"
    />
    <path
      d="M681.918884,422.958496 C674.030701,386.576599 655.140869,358.664307 622.271729,341.064941 C608.622253,333.756531 593.776978,329.942902 578.616699,327.379242 C570.014465,325.924591 564.841614,320.808533 564.789795,313.024384 C564.739136,305.413971 569.484192,300.058014 577.901978,298.585114 C600.140137,294.694000 621.197021,288.076599 639.268616,273.760010 C660.046753,257.299225 673.238953,236.110641 679.612000,210.543259 C681.179260,204.255783 682.399109,197.881271 683.757141,191.542175 C685.279846,184.434464 690.548096,179.804184 697.271423,179.697601 C704.369995,179.585068 709.857727,183.946152 711.382263,191.359161 C714.537964,206.704041 717.954590,221.932510 725.116455,236.058090 C740.775940,266.943756 765.808167,286.002380 798.997437,294.742737 C805.106018,296.351440 811.365173,297.385345 817.549622,298.708923 C825.766602,300.467529 830.142151,305.546051 830.046692,313.172852 C829.956116,320.408936 824.949890,325.944427 817.055908,327.307129 C798.879761,330.444763 781.338867,335.378387 765.517090,345.253204 C738.976318,361.817963 722.960632,385.891449 715.261780,415.860291 C713.854248,421.339355 712.670288,426.875580 711.354736,432.378601 C709.711426,439.252930 704.007446,443.922821 697.464905,443.787506 C690.411011,443.641632 684.997559,438.876129 683.668579,431.679657 C683.155212,428.900146 682.576721,426.132721 681.918884,422.958496 z"
      fill="url(#sparkleGradient)"
    />
    <path
      d="M612.781494,743.221436 C594.766113,723.845398 572.129211,714.209473 547.032593,709.371094 C545.398315,709.055969 543.755798,708.781433 542.125916,708.445435 C535.462524,707.071533 531.126221,702.231628 531.107971,696.172668 C531.086731,689.133667 535.532898,684.072693 542.779480,682.763855 C551.948853,681.107910 561.037354,679.112061 569.823853,675.932861 C607.441467,662.321594 629.878174,635.504700 638.614807,596.795715 C639.638916,592.258240 640.402039,587.661072 641.465820,583.133789 C643.017883,576.527893 647.946594,572.646118 654.308533,572.806763 C660.510315,572.963318 665.019104,576.753235 666.321411,583.446045 C668.578430,595.045288 670.734741,606.649414 675.343018,617.627014 C689.177979,650.584167 714.000366,670.628235 748.221436,679.539978 C753.680054,680.961487 759.280090,681.849426 764.827026,682.920166 C771.732849,684.253113 775.826111,688.822876 776.076660,695.586365 C776.301147,701.646851 771.743835,707.279480 765.119568,708.548096 C751.030151,711.246216 737.102600,714.336487 724.178955,720.930359 C695.888428,735.364685 678.452576,758.377563 670.311401,788.763489 C668.848999,794.221680 667.754028,799.777466 666.423096,805.272095 C664.771851,812.089539 660.778442,815.337830 654.151794,815.360718 C647.066833,815.385254 643.134521,812.335388 641.387024,805.253845 C638.756409,794.593811 636.456299,783.859314 632.259644,773.632812 C627.649597,762.399231 621.236084,752.381287 612.781494,743.221436 z"
      fill="url(#sparkleGradient)"
    />
  </svg>
);

const editorTools = [
  { label: 'Bold', icon: Bold, hideBorder: true },
  { label: 'Italic', icon: Italic, hideBorder: true },
  { label: 'Underline', icon: Underline, hideBorder: true },
  { label: 'Add link', icon: Link2 },
  { label: 'Align text', icon: AlignLeft, hideBorder: true },
  { label: 'Horizontal rule', icon: Minus },
  { label: 'Bulleted list', icon: List, hideBorder: true },
  { label: 'Numbered list', icon: ListOrdered },
  { label: 'Increase indent', icon: ListIndentIncrease, hideBorder: true },
  { label: 'Decrease indent', icon: ListIndentDecrease },
  { label: 'Add image', icon: ImagePlus, hideBorder: true },
  { label: 'Formula', icon: null, hideBorder: true },
  { label: 'Full screen', icon: Maximize2 },
];

const NewCoursePage = ({ onClose }: NewCoursePageProps) => {
  const initialActivationDate = useMemo(() => new Date(), []);
  const [subjectCode, setSubjectCode] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assignedCourses, setAssignedCourses] = useState<TeacherCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesMessage, setCoursesMessage] = useState('Loading assigned subjects…');
  const [section, setSection] = useState('');
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [activeOption, setActiveOption] = useState<OptionTab>('general');
  const [visibility, setVisibility] = useState('public');
  const [scheduled, setScheduled] = useState(false);
  const [activationMonth, setActivationMonth] = useState(ACTIVATION_MONTHS[initialActivationDate.getMonth()]);
  const [activationDay, setActivationDay] = useState(String(initialActivationDate.getDate()));
  const [activationYear, setActivationYear] = useState(String(initialActivationDate.getFullYear()));
  const [activationHour, setActivationHour] = useState(String(initialActivationDate.getHours() % 12 || 12));
  const [activationMinute, setActivationMinute] = useState(String(initialActivationDate.getMinutes()).padStart(2, '0'));
  const [activationPeriod, setActivationPeriod] = useState(initialActivationDate.getHours() >= 12 ? 'PM' : 'AM');
  const [publicCourse, setPublicCourse] = useState(true);
  const [contentDrip, setContentDrip] = useState(false);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [hidePrereqTooltip, setHidePrereqTooltip] = useState(false);
  const [hideSyncTooltip, setHideSyncTooltip] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<MediaPreview | null>(null);
  const [videoPreview, setVideoPreview] = useState<MediaPreview | null>(null);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState('');
  const [videoError, setVideoError] = useState('');
  const [saved, setSaved] = useState(false);
  const [published, setPublished] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const activationYears = useMemo(
    () => Array.from({ length: 11 }, (_, index) => String(initialActivationDate.getFullYear() + index)),
    [initialActivationDate],
  );
  const activationDays = useMemo(() => {
    const monthIndex = ACTIVATION_MONTHS.indexOf(activationMonth);
    const dayCount = daysInMonth(monthIndex, Number(activationYear));
    return Array.from({ length: dayCount }, (_, index) => String(index + 1));
  }, [activationMonth, activationYear]);
  const reduceMotion = useReducedMotion() ?? false;
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const nextOutcomeId = useRef(1);
  const mediaMorphTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 360, damping: 34, mass: 0.75 };

  useEffect(() => {
    let active = true;

    const loadAssignedCourses = async () => {
      let teacher = getCurrentUser();

      // A cached student/admin profile can survive an account switch in the
      // same tab. In that case, resolve the current Supabase teacher session
      // instead of incorrectly sending the user back to login.
      if (!teacher || teacher.role !== 'teacher') {
        teacher = await recoverCurrentUser(true);
      }

      if (!teacher || teacher.role !== 'teacher') {
        if (active) {
          setCoursesLoading(false);
          setCoursesMessage('Teacher session unavailable. Please return to the login page.');
        }
        return;
      }

      const [courses, availableSections] = await Promise.all([
        getTeacherCourses(teacher.full_name),
        getAvailableSections(),
      ]);
      if (!active) return;

      setAssignedCourses(courses);
      setSectionOptions(availableSections);
      setCoursesLoading(false);
      setCoursesMessage(
        courses.length > 0
          ? 'Choose a subject assigned to you by the academic office.'
          : 'No assigned subjects found. Contact your academic head.',
      );
    };

    void loadAssignedCourses();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => {
    if (thumbnailPreview?.url) URL.revokeObjectURL(thumbnailPreview.url);
  }, [thumbnailPreview?.url]);

  useEffect(() => () => {
    if (videoPreview?.url) URL.revokeObjectURL(videoPreview.url);
  }, [videoPreview?.url]);

  const filteredSectionOptions = useMemo(() => {
    const query = section.trim().toUpperCase();
    return sectionOptions.filter((sectionOption) => !query || sectionOption.includes(query));
  }, [section, sectionOptions]);

  const handleApprovalRequiredChange = (checked: boolean) => {
    setApprovalRequired(checked);
    setHidePrereqTooltip(true);
    setTimeout(() => setHidePrereqTooltip(false), 10);
  };

  const handleSyncWithSISChange = (checked: boolean) => {
    setPublicCourse(checked);
    setHideSyncTooltip(true);
    setTimeout(() => setHideSyncTooltip(false), 10);
  };

  const categories = ['BSIT', 'BSCS', 'BSCpE', 'BMMA', 'BSBA', 'Senior High School'];

  const handleCourseSelection = (courseId: string) => {
    const course = assignedCourses.find((assignedCourse) => assignedCourse.id === courseId);
    if (!course) return;

    const courseParts = course.subtitle.split(/[Â·•]/).map((part) => part.trim()).filter(Boolean);

    setSelectedCourseId(courseId);
    setSubjectCode(courseParts[0] || course.short_title);
    if (courseParts[1]) setSection(courseParts[1].toUpperCase());
  };

  const focusEditor = () => editorRef.current?.focus();

  const addLearningOutcome = () => {
    if (learningOutcomes.length >= 8) return;
    setLearningOutcomes((current) => [
      ...current,
      { id: nextOutcomeId.current++, value: '' },
    ]);
  };

  const updateLearningOutcome = (id: number, value: string) => {
    setLearningOutcomes((current) => current.map((outcome) => (
      outcome.id === id ? { ...outcome, value } : outcome
    )));
  };

  const removeLearningOutcome = (id: number) => {
    setLearningOutcomes((current) => current.filter((outcome) => outcome.id !== id));
  };

  const completedOutcomeCount = learningOutcomes.filter((outcome) => outcome.value.trim().length > 0).length;
  const readinessItems = [
    { label: 'Assigned subject', complete: Boolean(selectedCourseId), required: true },
    { label: 'Section', complete: Boolean(section.trim()), required: true },
    { label: 'Class description', complete: description.trim().length >= 20, required: true },
    { label: 'Learning outcome', complete: completedOutcomeCount > 0, required: true },
    { label: 'Cover image', complete: Boolean(thumbnailPreview), required: false },
    { label: 'Course syllabus', complete: Boolean(videoPreview), required: false },
  ];
  const readinessComplete = readinessItems.filter((item) => item.complete).length;
  const readinessPercent = Math.round((readinessComplete / readinessItems.length) * 100);

  const handleThumbnailChange = (file?: File) => {
    if (!file) return;
    const supported = /\.(jpe?g|png|gif|webp)$/i.test(file.name)
      && (!file.type || SUPPORTED_IMAGE_MIME_TYPES.has(file.type));
    if (!supported) {
      setThumbnailError('Choose a JPG, PNG, GIF, or WebP image.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setThumbnailError('Choose an image smaller than 12 MB.');
      return;
    }
    setThumbnailError('');
    setThumbnailLoaded(false);
    setThumbnailPreview({ name: file.name, url: URL.createObjectURL(file) });
  };

  const handleVideoChange = (file?: File) => {
    if (!file) return;
    const supported = /\.(pdf|doc|docx)$/i.test(file.name) || file.type === 'application/pdf';
    if (!supported) {
      setVideoError('Choose a PDF or Word document.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setVideoError('Choose a file smaller than 50 MB.');
      return;
    }
    setVideoError('');
    setVideoPreview({ name: file.name, url: URL.createObjectURL(file) });
  };

  return (
    <div className="ncp-page">
      <header className="ncp-header">
        <div className="ncp-header-inner">
          <div className="ncp-brand" aria-label="STILMS">
            <span className="ncp-brand-mark">STI</span>
            <span>STILMS</span>
          </div>

          <div className="ncp-header-center">
            <div className="ncp-header-title">Class Builder</div>

            <div className="ncp-steps" aria-label="Class creation progress">
              <div className="ncp-step active"><span>1</span>Setup</div>
              <i />
              <div className="ncp-step"><span>2</span>Modules</div>
              <i />
              <div className="ncp-step"><span>3</span>Review</div>
            </div>

            <button type="button" className="ncp-ai-button">
              <AiSparklesIcon />
              <span>Generate with AI</span>
            </button>

            <div className="ncp-header-actions">
              <button
                type="button"
                className={`ncp-save-button${saved ? ' saved' : ''}`}
                onClick={() => setSaved(true)}
              >
                <CloudUpload aria-hidden="true" />
                {saved ? 'Draft Saved' : 'Save as Draft'}
              </button>
              <div className="ncp-publish-group">
                <button type="button" onClick={() => setPublished(true)}>
                  {published ? 'Published' : 'Publish'}
                </button>
                <button type="button" className="ncp-publish-menu-button" aria-label="More publishing options">
                  <ChevronDown aria-hidden="true" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

            <button type="button" className="ncp-close-button" onClick={onClose} aria-label="Close class builder">
            <X aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="ncp-workspace">
        <main className="ncp-main">
          <section className="ncp-section ncp-basics">
            <label className="ncp-field-label" htmlFor="assigned-subject">
              Assigned Subject <AiSparklesIcon />
            </label>
            <Select
              id="assigned-subject"
              className="ncp-course-title-select"
              value={selectedCourseId}
              onValueChange={handleCourseSelection}
              onOpenChange={setIsSelectOpen}
              disabled={coursesLoading || assignedCourses.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={coursesLoading ? 'Loading assigned subjects…' : 'Select an assigned subject'} />
              </SelectTrigger>
              <SelectContent>
                {assignedCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {`${course.title} · ${course.subtitle.split(/[Â·•]/)[0]?.trim() || course.short_title}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className={`ncp-field-support${assignedCourses.length === 0 && !coursesLoading ? ' is-warning' : ''}`} role="status">
              {coursesMessage}
            </p>
            
            <div className="ncp-class-meta-grid">
              <div style={{ flex: 1 }}>
                <label className="ncp-field-label" htmlFor="subject-code">
                  Subject Code
                </label>
                <SpringCaretInput
                  id="subject-code"
                  className="ncp-setting-input ncp-derived-input"
                  style={{ fontSize: '1rem', padding: '12px 16px', marginTop: '8px', borderRadius: '8px', width: '100%' }}
                  value={subjectCode}
                  placeholder="Selected automatically"
                  readOnly
                  aria-readonly="true"
                  aria-describedby="subject-code-help"
                />
                <span id="subject-code-help" className="ncp-derived-field-help">
                  Filled from the selected subject.
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <label className="ncp-field-label" htmlFor="section">
                  Section
                </label>
                <Select
                  id="section"
                  className="ncp-section-motion-select"
                  value={section}
                  onValueChange={setSection}
                >
                  <SelectInputTrigger
                    value={section}
                    onValueChange={(nextValue) => setSection(nextValue.toUpperCase())}
                    placeholder="Type or select a section"
                    autoComplete="off"
                  />
                  <SelectContent>
                    {filteredSectionOptions.length > 0 ? (
                      filteredSectionOptions.map((sectionOption) => (
                        <SelectItem key={sectionOption} value={sectionOption}>
                          {sectionOption}
                        </SelectItem>
                      ))
                    ) : (
                      <li className="ncp-section-empty">No matching section. You can keep the custom code.</li>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="ncp-editor-heading">
              <label className="ncp-field-label" htmlFor="course-description">
                Description
              </label>
              <div className="ncp-editor-assist">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Edit with AI <AiSparklesIcon />
                </span>
              </div>
            </div>

            <div className="ncp-editor">
              <div className="ncp-editor-toolbar">
                <RippleButton className="ncp-format-button" onClick={focusEditor}>
                  Format <ChevronDown aria-hidden="true" />
                </RippleButton>
                {editorTools.map(({ label, icon: Icon, hideBorder }) => (
                  <RippleButton key={label} onClick={focusEditor} aria-label={label} title={label} className={hideBorder ? 'ncp-no-border' : ''}>
                    {Icon ? <Icon aria-hidden="true" /> : <span className="ncp-formula-icon" aria-hidden="true">f<sup>(x)</sup></span>}
                  </RippleButton>
                ))}
              </div>
              <SpringCaretTextarea
                id="course-description"
                ref={editorRef}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-label="Class description"
              />
              <span className="ncp-editor-resize" />
            </div>
          </section>

          <motion.section
            layout="size"
            transition={{ layout: mediaMorphTransition }}
            className="ncp-outcomes-section"
            aria-labelledby="learning-outcomes-title"
          >
            <div className="ncp-outcomes-heading">
              <div className="ncp-outcomes-title-group">
                <span className="ncp-outcomes-icon"><Target aria-hidden="true" /></span>
                <div>
                  <h2 id="learning-outcomes-title">Learning outcomes</h2>
                  <p>Describe what students should be able to demonstrate after completing this class.</p>
                </div>
              </div>
              <span className="ncp-outcomes-count">{completedOutcomeCount} of 8 added</span>
            </div>

            <div className="ncp-outcomes-body-wrapper" style={{ position: 'relative' }}>
              <AnimatePresence mode="popLayout" initial={false}>
                {learningOutcomes.length === 0 ? (
                  <motion.button
                    key="empty"
                    type="button"
                    className="ncp-outcomes-empty"
                    onClick={addLearningOutcome}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(4px)" }}
                    transition={reduceMotion ? { duration: 0.1 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{ width: '100%' }}
                  >
                    <div>
                      <strong>Add the first learning outcome</strong>
                      <span>Clear outcomes help teachers align modules and assessments.</span>
                    </div>
                  </motion.button>
                ) : (
                  <motion.div
                    key="list"
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(4px)" }}
                    transition={reduceMotion ? { duration: 0.1 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{ width: '100%' }}
                  >
                    <div className="ncp-outcomes-list">
                      <AnimatePresence initial={false}>
                        {learningOutcomes.map((outcome, index) => (
                          <motion.div
                            key={outcome.id}
                            layout
                            className="ncp-outcome-row"
                            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -8, overflow: 'hidden' }}
                            animate={{ opacity: 1, height: 'auto', y: 0, transitionEnd: { overflow: 'visible' } }}
                            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -8, overflow: 'hidden' }}
                            transition={{ duration: reduceMotion ? 0.1 : 0.24, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <GripVertical className="ncp-outcome-grip" aria-hidden="true" />
                            <span className="ncp-outcome-number">{index + 1}</span>
                            <SpringCaretInput
                              value={outcome.value}
                              onChange={(event) => updateLearningOutcome(outcome.id, event.target.value)}
                              placeholder="e.g. Apply core concepts to solve a practical problem"
                              aria-label={`Learning outcome ${index + 1}`}
                            />
                            <button
                              type="button"
                              className="ncp-outcome-remove"
                              onClick={() => removeLearningOutcome(outcome.id)}
                              aria-label={`Remove learning outcome ${index + 1}`}
                            >
                              <X aria-hidden="true" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    <div className="ncp-outcomes-footer">
                      <p>Use observable verbs such as explain, create, analyze, or demonstrate.</p>
                      <button type="button" onClick={addLearningOutcome} disabled={learningOutcomes.length >= 8}>
                        <Plus aria-hidden="true" /> Add outcome
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          <section className="ncp-options-section">
            <div className="ncp-options-heading">
              <div>
                <h2>Class settings</h2>
                <p>Set up the academic term, module access, and student roster for this class.</p>
              </div>
              <RadialButton className="ncp-continue-button">Continue to modules <ChevronRight aria-hidden="true" /></RadialButton>
            </div>

            <motion.div layout className="ncp-options-card">
              <div className="ncp-option-tabs" role="tablist" aria-label="Class settings">
                <button
                  type="button"
                  className={activeOption === 'general' ? 'active' : ''}
                  onClick={() => setActiveOption('general')}
                  role="tab"
                  aria-selected={activeOption === 'general'}
                  aria-controls="general-options-panel"
                >
                  <span className="ncp-option-tab-icon"><Settings aria-hidden="true" strokeWidth={2.3} /></span>
                  <span className="ncp-option-tab-copy"><strong>Class setup</strong><small>Term and delivery mode</small></span>
                  <ChevronRight className="ncp-option-tab-arrow" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={activeOption === 'drip' ? 'active' : ''}
                  onClick={() => setActiveOption('drip')}
                  role="tab"
                  aria-selected={activeOption === 'drip'}
                  aria-controls="drip-options-panel"
                >
                  <span className="ncp-option-tab-icon"><Clock3 aria-hidden="true" /></span>
                  <span className="ncp-option-tab-copy"><strong>Module Progression</strong><small>Sequential unlocking</small></span>
                  <ChevronRight className="ncp-option-tab-arrow" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={activeOption === 'enrollment' ? 'active' : ''}
                  onClick={() => setActiveOption('enrollment')}
                  role="tab"
                  aria-selected={activeOption === 'enrollment'}
                  aria-controls="enrollment-options-panel"
                >
                  <span className="ncp-option-tab-icon"><RefreshCw aria-hidden="true" /></span>
                  <span className="ncp-option-tab-copy"><strong>Roster &amp; access</strong><small>Enrollment rules</small></span>
                  <ChevronRight className="ncp-option-tab-arrow" aria-hidden="true" />
                </button>
              </div>

              <motion.div layout="position" className="ncp-option-content" role="tabpanel" id={`${activeOption}-options-panel`} style={{ position: "relative" }}>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={activeOption}
                    initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  >
                {activeOption === 'general' && (
                  <>
                    <div className="ncp-option-panel-heading">
                      <span><Settings aria-hidden="true" /></span>
                       <div><h3>Class setup</h3><p>Set the academic term and how instruction will be delivered.</p></div>
                    </div>
                    <div className="ncp-settings-table">
                      <div className="ncp-setting-row">
                        <div className="ncp-setting-copy"><label htmlFor="term">Term / Semester</label><p>Select the academic term for this class.</p></div>
                        <Select id="term" defaultValue="1st" className="ncp-setting-control" onOpenChange={setIsSelectOpen}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1st">1st Term</SelectItem>
                            <SelectItem value="2nd">2nd Term</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="ncp-setting-row">
                        <div className="ncp-setting-copy">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Sync with SIS 
                             <InfoTooltip content={publicCourse ? "Automatically enrolls students registered in the Student Information System." : "Students must be added manually or through a class code."} side="right" forceHide={isSelectOpen || hideSyncTooltip} variant={publicCourse ? 'primary' : 'default'}>
                              <button type="button" className="inline-flex items-center justify-center text-[#9aa2af] hover:text-[#5b6170] transition-colors cursor-help rounded-full" aria-label="More info about Sync with SIS">
                                <Info aria-hidden="true" size={16} fill="currentColor" color="white" />
                              </button>
                            </InfoTooltip>
                           </span>
                           <p>Roster membership stays aligned with official STI enrollment records.</p>
                         </div>
                         <div className="ncp-toggle-control"><small>{publicCourse ? 'Institution managed' : 'Manual'}</small><Switch checked={publicCourse} onCheckedChange={handleSyncWithSISChange} disabled aria-label="SIS synchronization is institution managed" /></div>
                      </div>
                      <div className="ncp-setting-row">
                        <div className="ncp-setting-copy"><label htmlFor="delivery-mode">Delivery mode</label><p>Control how this class is conducted.</p></div>
                        <Select id="delivery-mode" defaultValue="blended" className="ncp-setting-control" onOpenChange={setIsSelectOpen}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blended">Blended Learning</SelectItem>
                            <SelectItem value="online">Full Online</SelectItem>
                            <SelectItem value="onsite">On-site</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                {activeOption === 'drip' && (
                  <>
                    <div className="ncp-option-panel-heading">
                      <span><Clock3 aria-hidden="true" /></span>
                       <div><h3>Module progression</h3><p>Control when students can access learning modules during the term.</p></div>
                    </div>
                    <div className="ncp-settings-table">
                      <div className="ncp-setting-row">
                       <div className="ncp-setting-copy"><span>Sequential unlocking</span><p>Require students to complete modules in their intended order.</p></div>
                        <div className="ncp-toggle-control"><small>{contentDrip ? 'Enabled' : 'Disabled'}</small><Switch checked={contentDrip} onCheckedChange={setContentDrip} aria-label="Toggle sequential unlocking" /></div>
                      </div>
                      <div className="ncp-setting-row">
                        <div className="ncp-setting-copy"><label htmlFor="drip-start">Unlock conditions</label><p>Choose when subsequent modules become available.</p></div>
                        <Select id="drip-start" defaultValue="completion" className="ncp-setting-control" onOpenChange={setIsSelectOpen}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completion">Upon previous completion</SelectItem>
                            <SelectItem value="course-date">By specific date</SelectItem>
                            <SelectItem value="grading-period">By grading period</SelectItem>
                            <SelectItem value="manual">Manual release</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="ncp-setting-row">
                       <div className="ncp-setting-copy"><label htmlFor="drip-cadence">Grading period</label><p>Align module availability with STI grading periods.</p></div>
                        <Select id="drip-cadence" defaultValue="prelims" className="ncp-setting-control" onOpenChange={setIsSelectOpen}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="prelims">Prelims</SelectItem>
                            <SelectItem value="midterms">Midterms</SelectItem>
                            <SelectItem value="prefinals">Pre-Finals</SelectItem>
                            <SelectItem value="finals">Finals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                {activeOption === 'enrollment' && (
                  <>
                    <div className="ncp-option-panel-heading">
                      <span><RefreshCw aria-hidden="true" /></span>
                       <div><h3>Roster &amp; access</h3><p>Review enrollment rules, capacity, and prerequisite requirements.</p></div>
                    </div>
                    <div className="ncp-settings-table">
                      <div className="ncp-setting-row">
                       <div className="ncp-setting-copy"><label htmlFor="enrollment-method">Enrollment method</label><p>Choose how students are added to this class.</p></div>
                        <Select id="enrollment-method" defaultValue="sync" disabled className="ncp-setting-control">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sync">SIS Auto-enroll</SelectItem>
                            <SelectItem value="code">Class Code</SelectItem>
                            <SelectItem value="manual">Manual Add</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="ncp-setting-row">
                       <div className="ncp-setting-copy"><label htmlFor="course-capacity">Class size limit</label><p>Leave blank when this class has no enrollment limit.</p></div>
                        <SpringCaretInput id="course-capacity" className="ncp-setting-input" inputMode="numeric" placeholder="Unlimited" />
                      </div>
                      <div className="ncp-setting-row">
                        <div className="ncp-setting-copy">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Require Prerequisites 
                             <InfoTooltip content={approvalRequired ? "Only students who passed the required subjects can join." : "Prerequisite validation is currently off."} side="right" forceHide={isSelectOpen || hidePrereqTooltip} variant={approvalRequired ? 'primary' : 'default'}>
                              <button type="button" className="inline-flex items-center justify-center text-[#9aa2af] hover:text-[#5b6170] transition-colors cursor-help rounded-full" aria-label="More info about prerequisites">
                                <Info aria-hidden="true" size={16} fill="currentColor" color="white" />
                              </button>
                            </InfoTooltip>
                           </span>
                           <p>Verify prerequisite subjects before a student is enrolled.</p>
                         </div>
                        <div className="ncp-toggle-control"><small>{approvalRequired ? 'Required' : 'Not required'}</small><Switch checked={approvalRequired} onCheckedChange={handleApprovalRequiredChange} aria-label="Toggle prerequisites" /></div>
                      </div>
                    </div>
                  </>
                )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* Removed ncp-options-footer here */}
          </section>
        </main>

        <aside className="ncp-sidebar">
          <section className="ncp-side-section">
            <label className="ncp-side-label" htmlFor="visibility">Class status</label>
            <Select
              id="visibility"
              value={visibility}
              onValueChange={setVisibility}
              className="ncp-motion-select--visibility"
            >
              <SelectTrigger>
                <Eye aria-hidden="true" strokeWidth={1.75} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Active</SelectItem>
                <SelectItem value="private">Draft</SelectItem>
                <SelectItem value="password">Archived</SelectItem>
              </SelectContent>
            </Select>
            <p className="ncp-updated">Last updated on 25th March, 2026</p>
          </section>

          <section className="ncp-side-section">
            <div className="ncp-schedule-row">
              <span className="ncp-schedule-copy">
                <span className="ncp-schedule-title-line">
                  <strong>Schedule activation</strong>
                  <InfoTooltip
                    content="Students receive access automatically on the selected date and time."
                    side="top"
                    variant="neutral"
                  >
                    <button type="button" className="ncp-schedule-info" aria-label="About scheduled activation">
                      <Info aria-hidden="true" />
                    </button>
                  </InfoTooltip>
                </span>
                <small>Open this class on a future date</small>
              </span>
              <Switch checked={scheduled} onCheckedChange={setScheduled} aria-label="Schedule class activation" />
            </div>
            <AnimatePresence initial={false}>
              {scheduled ? (
                <motion.div
                  className="ncp-schedule-fields"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
                  transition={{ duration: reduceMotion ? 0.1 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="ncp-activation-picker">
                    <div className="ncp-activation-picker__header">
                      <span>Activation date</span>
                      <strong>{activationMonth} {activationDay}, {activationYear}</strong>
                    </div>
                    <div className="ncp-activation-wheel-group ncp-activation-wheel-group--date">
                      <WheelPicker
                        options={ACTIVATION_MONTHS}
                        value={activationMonth}
                        onValueChange={(nextMonth) => {
                          setActivationMonth(nextMonth);
                          setActivationDay((currentDay) => String(Math.min(
                            Number(currentDay),
                            daysInMonth(ACTIVATION_MONTHS.indexOf(nextMonth), Number(activationYear)),
                          )));
                        }}
                        className="ncp-wheel-picker--month"
                        aria-label="Activation month"
                      />
                      <WheelPicker
                        key={`${activationMonth}-${activationYear}`}
                        options={activationDays}
                        value={activationDay}
                        onValueChange={setActivationDay}
                        className="ncp-wheel-picker--day"
                        aria-label="Activation day"
                      />
                      <WheelPicker
                        options={activationYears}
                        value={activationYear}
                        onValueChange={(nextYear) => {
                          setActivationYear(nextYear);
                          setActivationDay((currentDay) => String(Math.min(
                            Number(currentDay),
                            daysInMonth(ACTIVATION_MONTHS.indexOf(activationMonth), Number(nextYear)),
                          )));
                        }}
                        className="ncp-wheel-picker--year"
                        aria-label="Activation year"
                      />
                    </div>

                    <div className="ncp-activation-picker__header ncp-activation-picker__header--time">
                      <span>Activation time</span>
                      <strong>{activationHour}:{activationMinute} {activationPeriod}</strong>
                    </div>
                    <div className="ncp-activation-wheel-group ncp-activation-wheel-group--time">
                      <WheelPicker
                        options={ACTIVATION_HOURS}
                        value={activationHour}
                        onValueChange={setActivationHour}
                        aria-label="Activation hour"
                      />
                      <span className="ncp-activation-time-separator" aria-hidden="true">:</span>
                      <WheelPicker
                        options={ACTIVATION_MINUTES}
                        value={activationMinute}
                        onValueChange={setActivationMinute}
                        aria-label="Activation minute"
                      />
                      <WheelPicker
                        options={['AM', 'PM']}
                        value={activationPeriod}
                        onValueChange={setActivationPeriod}
                        aria-label="Activation period"
                      />
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>

          <section className="ncp-side-section ncp-readiness" aria-labelledby="readiness-title">
            <div className="ncp-readiness-heading">
              <div>
                <h2 id="readiness-title">Setup readiness</h2>
                <p>{readinessComplete === readinessItems.length ? 'Ready for review' : 'Complete the essentials before publishing'}</p>
              </div>
              <strong><RollingNumber value={readinessPercent} suffix="%" reduceMotion={reduceMotion} immediate /></strong>
            </div>
            <div
              className="ncp-readiness-track"
              role="progressbar"
              aria-label="Class setup readiness"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={readinessPercent}
            >
              <motion.span
                initial={reduceMotion ? false : { scaleX: 0.025 }}
                animate={{ scaleX: readinessPercent / 100 }}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 180, damping: 24 }}
              />
            </div>
            <ul className="ncp-readiness-list">
              {readinessItems.map((item) => (
                <li key={item.label} className={item.complete ? 'is-complete' : ''}>
                  <span className="ncp-readiness-check">
                    <svg
                      aria-hidden
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <motion.path
                        animate={item.complete ? "checked" : "unchecked"}
                        d="M5 12.5l4.5 4.5L19 7.5"
                        variants={reduceMotion ? reducedCheckmarkVariants : checkmarkVariants}
                        initial={false}
                      />
                    </svg>
                  </span>
                  <span>{item.label}</span>
                  <small>{item.required ? 'Required' : 'Recommended'}</small>
                </li>
              ))}
            </ul>
          </section>

          <section className="ncp-side-section">
            <h2>Class cover image <AiSparklesIcon /></h2>
            <motion.div
              layout="size"
              className="ncp-media-height-morph"
              transition={{ layout: mediaMorphTransition }}
            >
              {thumbnailPreview && !thumbnailLoaded ? (
                <img
                  className="ncp-media-preloader"
                  src={thumbnailPreview.url}
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    const loadedUrl = thumbnailPreview.url;
                    void image.decode().catch(() => undefined).then(() => {
                      if (image.currentSrc === loadedUrl || image.src === loadedUrl) {
                        setThumbnailLoaded(true);
                      }
                    });
                  }}
                />
              ) : null}
              {thumbnailPreview && thumbnailLoaded ? (
                <label
                  className={`ncp-media-preview ncp-media-preview--image${thumbnailLoaded ? ' is-loaded' : ''}`}
                  title="Replace featured image"
                  aria-busy={!thumbnailLoaded}
                >
                  <span className="ncp-media-placeholder" aria-hidden="true">
                    <ImagePlus />
                    <span className="ncp-upload-button">Upload cover image</span>
                    <small>Supported file formats: .jpg, .jpeg, .png, .gif, .webp</small>
                  </span>
                  <motion.span
                    className="ncp-media-surface"
                    initial={reduceMotion ? false : { scale: 0.015 }}
                    animate={{ scale: 1 }}
                    transition={mediaMorphTransition}
                  >
                    <img
                      src={thumbnailPreview.url}
                      alt={`Featured image preview: ${thumbnailPreview.name}`}
                      decoding="async"
                    />
                    <span className="ncp-media-replace"><SquarePen aria-hidden="true" /> Change image</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.webp"
                      onChange={(event) => {
                        handleThumbnailChange(event.target.files?.[0]);
                        event.currentTarget.value = '';
                      }}
                    />
                  </motion.span>
                </label>
              ) : (
                <label className="ncp-upload-box">
                  <ImagePlus aria-hidden="true" />
                  <span className="ncp-upload-button">Upload cover image</span>
                  <small>Supported file formats: .jpg, .jpeg, .png, .gif, .webp</small>
                  <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp" onChange={(event) => handleThumbnailChange(event.target.files?.[0])} />
                </label>
              )}
            </motion.div>
            {thumbnailError ? <p className="ncp-media-error" role="alert">{thumbnailError}</p> : null}
          </section>
          <section className="ncp-side-section">
            <h2>Class syllabus</h2>
            <motion.div
              layout="size"
              className="ncp-media-height-morph"
              transition={{ layout: mediaMorphTransition }}
            >
              {videoPreview ? (
                <div className="ncp-media-preview ncp-media-preview--file is-loaded">
                  <div className="ncp-media-surface" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'var(--ic-muted)', borderRadius: '8px' }}>
                    <SquarePen aria-hidden="true" style={{ opacity: 0.5, width: '32px', height: '32px' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, textAlign: 'center', wordBreak: 'break-all' }}>{videoPreview.name}</span>
                    <label className="ncp-media-replace" title="Replace syllabus" style={{ marginTop: '8px', position: 'relative' }}>
                      <SquarePen aria-hidden="true" /> Change file
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(event) => {
                          handleVideoChange(event.target.files?.[0]);
                          event.currentTarget.value = '';
                        }}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="ncp-upload-box ncp-video-upload">
                  <span className="ncp-upload-button">
                    <span className="ncp-video-button-icon" aria-hidden="true"><SquarePen /></span>
                    Upload Syllabus
                  </span>
                  <span className="ncp-add-video-url">Add from URL</span>
                  <small>Supported file formats: .pdf, .docx</small>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={(event) => handleVideoChange(event.target.files?.[0])} />
                </label>
              )}
            </motion.div>
            {videoError ? <p className="ncp-media-error" role="alert">{videoError}</p> : null}
          </section>

          <section className="ncp-side-section ncp-pricing">
            <div className="ncp-section-heading">
              <div>
                <h2>Grading system</h2>
                <p>Institution-managed class grading</p>
              </div>
              <span className="ncp-managed-badge"><Lock aria-hidden="true" /> Managed by STI</span>
            </div>

            <div className="ncp-grading-card">
              <div className="ncp-grading-summary">
                <span className="ncp-setting-icon" aria-hidden="true"><Lock /></span>
                <div className="ncp-grading-copy">
                  <strong>STI tertiary grading</strong>
                  <span className="ncp-grading-subtitle">1.00–5.00 institutional scale</span>
                </div>
              </div>

              <div className="ncp-grade-scale">
                <div className="ncp-grade-scale-header">
                  <span>Minimum passing score</span>
                  <strong><RollingNumber value={75} suffix="%" reduceMotion={reduceMotion} /></strong>
                </div>
                <div
                  className="ncp-grade-scale-track"
                  role="meter"
                  aria-label="Minimum passing score"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={75}
                >
                  <motion.span
                    className="ncp-grade-scale-fill"
                    initial={reduceMotion ? false : { scaleX: 0.025 }}
                    animate={{ scaleX: 1 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 2, ease: [0.22, 1, 0.36, 1], delay: 1 }
                    }
                  />
                  <span className="ncp-grade-scale-tick" aria-hidden="true" />
                </div>
                <div className="ncp-grade-scale-labels">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <p className="ncp-setting-note">A grade of 3.00 is passing. Course components and weights must follow the approved syllabus.</p>
            </div>
          </section>

          <section className="ncp-side-section ncp-categories">
            <div className="ncp-section-heading">
              <div>
                <h2>Programs &amp; departments</h2>
                <p>Class audience and ownership</p>
              </div>
            </div>
            {publicCourse ? (
              <div className="ncp-sis-card">
                <span className="ncp-setting-icon ncp-setting-icon--sync" aria-hidden="true"><CloudCog /></span>
                <div className="ncp-sis-copy">
                  <div className="ncp-sis-title-row">
                    <strong>Synced from SIS</strong>
                    <span className="ncp-sync-status"><i /> Live</span>
                  </div>
                  <p>Program access updates automatically from current enrollment records.</p>
                </div>
              </div>
            ) : (
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {categories.slice(0, 3).map((tag) => (
                    <span key={tag} style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ic-text)', backgroundColor: 'var(--ic-muted)', padding: '4px 10px', borderRadius: '16px', border: '1px solid var(--ic-border)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                       {tag}
                       <button type="button" aria-label="Remove tag" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ic-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>&times;</button>
                    </span>
                  ))}
                  <button type="button" style={{ fontSize: '12px', fontWeight: 500, color: '#3268df', backgroundColor: 'transparent', padding: '4px 10px', borderRadius: '16px', border: '1px dashed #3268df', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                     <Plus size={12} /> Add Program
                  </button>
               </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default NewCoursePage;
