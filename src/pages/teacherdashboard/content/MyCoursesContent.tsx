import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronsUpDown,
  Clock3,
  GraduationCap,
  Layers3,
  Plus,
  Search,
} from 'lucide-react';
import './MyCoursesContent.css';

type Course = {
  id: number;
  title: string;
  date: string;
  students: number;
  duration: string;
  price: number;
  image: string;
  bundle?: string;
};

const COURSES: Course[] = [
  {
    id: 1,
    title: 'Photography Foundations: Mastering Your Camera & Essentials',
    date: 'July 25, 2026 - 4:15 pm',
    students: 156,
    duration: '3h 30m',
    price: 25,
    image: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=900&q=86',
  },
  {
    id: 2,
    title: 'Advanced Concept Art for Science Fiction Productions',
    date: 'July 30, 2026 - 3:19 am',
    students: 2000,
    duration: '1h 55m',
    price: 29,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=86',
  },
  {
    id: 3,
    title: 'Graphic Design for Beginners: Master the Fundamentals with Confidence',
    date: 'June 21, 2026 - 12:00 am',
    students: 3299,
    duration: '2h 30m',
    price: 20,
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=86',
  },
  {
    id: 4,
    title: 'Interior Design Mastery: From Concept to Completion',
    date: 'April 15, 2026 - 04:00 pm',
    students: 72,
    duration: '5h 10m',
    price: 39,
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=86',
    bundle: '3 Course Bundle',
  },
  {
    id: 5,
    title: 'UX/UI Design Mastery: From User Research to Inclusive Interfaces',
    date: 'April 01, 2026 - 02:00 pm',
    students: 1200,
    duration: '6h 30m',
    price: 44,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=86',
  },
  {
    id: 6,
    title: 'Logo Design from Scratch: Crafting Powerful Visual Identities',
    date: 'Nov 24, 2025 - 4:15 pm',
    students: 400,
    duration: '2h 30m',
    price: 49,
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=86',
  },
];

type MyCoursesContentProps = {
  onCreateCourse: () => void;
};

const MyCoursesContent = ({ onCreateCourse }: MyCoursesContentProps) => {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'bundles' | 'courses'>('bundles');
  const [ascending, setAscending] = useState(true);

  const visibleCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = COURSES.filter((course) =>
      course.title.toLowerCase().includes(normalizedQuery),
    );

    return [...filtered].sort((a, b) =>
      ascending ? a.id - b.id : b.id - a.id,
    );
  }, [ascending, query]);

  return (
    <section className="td-courses" aria-labelledby="td-courses-title">
      <h1 id="td-courses-title" className="td-visually-hidden">My Courses</h1>

      <div className="td-courses-toolbar td-courses-toolbar-top">
        <button type="button" className="td-courses-status">
          Published (6)
          <ChevronDown aria-hidden="true" />
        </button>

        <div className="td-courses-create-actions">
          <button type="button" className="td-courses-button secondary">
            New Bundle
          </button>
          <button type="button" className="td-courses-button primary" onClick={onCreateCourse}>
            <Plus aria-hidden="true" />
            New Course
          </button>
        </div>
      </div>

      <div className="td-courses-toolbar td-courses-toolbar-filter">
        <label className="td-course-search">
          <Search aria-hidden="true" />
          <span className="td-visually-hidden">Search courses</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses..."
          />
        </label>

        <div className="td-course-view-actions">
          <label className="td-course-view-select">
            <span>Showing:</span>
            <select
              value={view}
              onChange={(event) => setView(event.target.value as 'bundles' | 'courses')}
              aria-label="Course display type"
            >
              <option value="bundles">Bundles</option>
              <option value="courses">Courses</option>
            </select>
            <ChevronDown aria-hidden="true" />
          </label>
          <button
            type="button"
            className="td-course-sort"
            onClick={() => setAscending((value) => !value)}
            aria-label={`Sort courses ${ascending ? 'descending' : 'ascending'}`}
          >
            <ChevronsUpDown aria-hidden="true" />
          </button>
        </div>
      </div>

      {visibleCourses.length > 0 ? (
        <div className="td-course-grid">
          {visibleCourses.map((course) => (
            <article className="td-course-card" key={course.id}>
              <div className="td-course-cover">
                <img src={course.image} alt="" loading="lazy" />
                {course.bundle && (
                  <span className="td-course-bundle-badge">
                    <Layers3 aria-hidden="true" />
                    {course.bundle}
                  </span>
                )}
              </div>

              <div className="td-course-details">
                <div className="td-course-date">
                  <CalendarDays aria-hidden="true" />
                  <span>{course.date}</span>
                </div>
                <h2 title={course.title}>{course.title}</h2>
                <div className="td-course-meta">
                  <span><GraduationCap aria-hidden="true" />{course.students.toLocaleString()}</span>
                  <span><Clock3 aria-hidden="true" />{course.duration}</span>
                </div>
              </div>

              <div className="td-course-price">${course.price.toFixed(2)}</div>
            </article>
          ))}
        </div>
      ) : (
        <div className="td-course-empty">
          <Search aria-hidden="true" />
          <h2>No courses found</h2>
          <p>Try a different course name.</p>
        </div>
      )}
    </section>
  );
};

export default MyCoursesContent;
