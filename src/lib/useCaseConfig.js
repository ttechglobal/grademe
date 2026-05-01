/**
 * lib/useCaseConfig.js
 *
 * GradeMee serves the education sector — teachers/tutors and university/
 * college lecturers. These two profiles cover K-12, private tutoring,
 * higher education, and non-formal educational institutions (Bible schools,
 * vocational training etc. all share the course-based lecturer flow).
 */

export const USE_CASE_CONFIGS = {
  k12_tutor: {
    label:               'Teacher / Tutor',
    description:         'K-12, private tutoring, or any school-based teaching',
    icon:                '🎓',
    lucideIcon:          'GraduationCap',
    iconColor:           '#217070',
    showCurriculum:      true,
    showGradeLevel:      true,
    participantLabel:    'Student',
    participantsLabel:   'Students',
    assessmentLabel:     'Assessment',
    classLabel:          'Class / Grade',
    defaultParticipantFields: [
      { key: 'full_name', label: 'Full Name', required: true },
    ],
    suggestedAdditionalFields: [
      { key: 'class_arm',  label: 'Class Arm',  required: false },
      { key: 'student_id', label: 'Student ID', required: false },
    ],
  },

  university: {
    label:               'University / Lecturer',
    description:         'Higher education, colleges, Bible schools, vocational, or any course-based teaching',
    icon:                '🏛️',
    lucideIcon:          'BookOpen',
    iconColor:           '#4f46e5',
    showCurriculum:      false,
    showGradeLevel:      false,
    participantLabel:    'Student',
    participantsLabel:   'Students',
    assessmentLabel:     'Assessment',
    classLabel:          'Course',
    defaultParticipantFields: [
      { key: 'full_name',     label: 'Full Name',     required: true },
      { key: 'matric_number', label: 'Matric Number', required: true },
    ],
    suggestedAdditionalFields: [
      { key: 'department',  label: 'Department',  required: false },
      { key: 'course_code', label: 'Course Code', required: false },
    ],
  },
}

export function getUseCaseConfig(profile = 'k12_tutor') {
  return USE_CASE_CONFIGS[profile] ?? USE_CASE_CONFIGS.k12_tutor
}

export const USE_CASE_OPTIONS = Object.entries(USE_CASE_CONFIGS).map(([value, cfg]) => ({
  value,
  label:       cfg.label,
  description: cfg.description,
  icon:        cfg.icon,
  lucideIcon:  cfg.lucideIcon,
  iconColor:   cfg.iconColor,
  comingSoon:  false,
}))