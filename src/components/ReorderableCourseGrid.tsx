import { useState, useEffect } from 'react';
import { motion, Reorder, useDragControls, useReducedMotion } from 'motion/react';
import CourseCard from './CourseCard';

interface CourseData {
    id: string;
    title: string;
    subtitle?: string;
    image: string;
    progress: number;
    modules: number;
    nextLesson?: string;
    timeEstimate?: string;
    deadline?: {
        title: string;
        dueDate: string;
        daysLeft: number;
    };
    lastAccessed?: string;
    unreadCount?: number;
    grade?: {
        current: number;
        letter: string;
        trend?: 'up' | 'down' | 'stable';
    };
    isBookmarked?: boolean;
    studyStreak?: number;
    instructor?: {
        name: string;
        avatar?: string;
    };
    category?: 'major' | 'ge' | 'elective' | 'nstp' | 'pe';
}

interface ReorderableCourseGridProps {
    courses: CourseData[];
    onReorder: (newOrder: CourseData[]) => void;
    onBookmarkToggle?: (courseId: string, isBookmarked: boolean) => void;
}

const DraggableCourseItem = ({
    course,
    index,
    onBookmarkToggle
}: {
    course: CourseData;
    index: number;
    onBookmarkToggle?: (courseId: string, isBookmarked: boolean) => void;
}) => {
    const dragControls = useDragControls();
    const prefersReducedMotion = useReducedMotion();

    return (
        <Reorder.Item
            value={course}
            id={course.id}
            dragListener={false}
            dragControls={dragControls}
            className="reorderable-course-item"
            layout="position"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
                layout: { type: 'spring', stiffness: 300, damping: 30 }
            }}
            whileDrag={{
                scale: 1.02,
                zIndex: 50,
                boxShadow: '0 20px 40px rgba(59, 130, 246, 0.15)',
                cursor: 'grabbing'
            }}
            style={{ position: 'relative' }}
        >
            {/* Drag Handle */}
            <motion.div
                className="drag-handle"
                onPointerDown={(e) => dragControls.start(e)}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                whileTap={{ scale: 0.95 }}
            >
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="6" r="1.5" />
                    <circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" />
                    <circle cx="15" cy="18" r="1.5" />
                </svg>
            </motion.div>

            <CourseCard
                title={course.title}
                subtitle={course.subtitle}
                image={course.image}
                progress={course.progress}
                modules={course.modules}
                nextLesson={course.nextLesson}
                timeEstimate={course.timeEstimate}
                deadline={course.deadline}
                lastAccessed={course.lastAccessed}
                unreadCount={course.unreadCount}
                grade={course.grade}
                isBookmarked={course.isBookmarked}
                onBookmarkToggle={(isBookmarked) => onBookmarkToggle?.(course.id, isBookmarked)}
                studyStreak={course.studyStreak}
                instructor={course.instructor}
                category={course.category}
                index={index}
            />
        </Reorder.Item>
    );
};


const ReorderableCourseGrid = ({
    courses,
    onReorder,
    onBookmarkToggle
}: ReorderableCourseGridProps) => {
    const [items, setItems] = useState(courses);
    const [isReorderMode, setIsReorderMode] = useState(false);
    const prefersReducedMotion = useReducedMotion();

    // Sync with parent courses
    useEffect(() => {
        setItems(courses);
    }, [courses]);

    const handleReorder = (newOrder: CourseData[]) => {
        setItems(newOrder);
        onReorder(newOrder);
    };

    return (
        <div className="reorderable-course-container">
            {/* Reorder Mode Toggle */}
            <div className="reorder-controls">
                <motion.button
                    className={`reorder-toggle ${isReorderMode ? 'active' : ''}`}
                    onClick={() => setIsReorderMode(!isReorderMode)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isReorderMode ? (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                            <span>Done</span>
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M3 12h18M3 18h18" />
                            </svg>
                            <span>Reorder</span>
                        </>
                    )}
                </motion.button>

                {isReorderMode && (
                    <motion.p
                        className="reorder-hint"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                    >
                        Drag courses to reorder
                    </motion.p>
                )}
            </div>

            {/* Course Grid */}
            {isReorderMode ? (
                <Reorder.Group
                    axis="y"
                    values={items}
                    onReorder={handleReorder}
                    className="reorderable-course-grid reorder-active"
                    layout={false}
                >
                    {items.map((course, index) => (
                        <DraggableCourseItem
                            key={course.id}
                            course={course}
                            index={index}
                            onBookmarkToggle={onBookmarkToggle}
                        />
                    ))}
                </Reorder.Group>
            ) : (
                <motion.div
                    className="reorderable-course-grid"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: prefersReducedMotion ? 0 : 0.05 }
                        }
                    }}
                >
                    {items.map((course, index) => (
                        <motion.div
                            key={course.id}
                            className="course-grid-item"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <CourseCard
                                title={course.title}
                                subtitle={course.subtitle}
                                image={course.image}
                                progress={course.progress}
                                modules={course.modules}
                                nextLesson={course.nextLesson}
                                timeEstimate={course.timeEstimate}
                                deadline={course.deadline}
                                lastAccessed={course.lastAccessed}
                                unreadCount={course.unreadCount}
                                grade={course.grade}
                                isBookmarked={course.isBookmarked}
                                onBookmarkToggle={(isBookmarked) => onBookmarkToggle?.(course.id, isBookmarked)}
                                studyStreak={course.studyStreak}
                                instructor={course.instructor}
                                category={course.category}
                                index={index}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default ReorderableCourseGrid;
