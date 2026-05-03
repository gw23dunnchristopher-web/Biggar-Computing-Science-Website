import ExcelJS from 'exceljs';
import {
  getCourseAnalytics,
  getLessonAnalytics,
  listStudentsInClass,
  type ClassworkCourse,
} from './classwork-storage.js';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E3A8A' },
};
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' } };
const SUBHEAD_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE0E7FF' },
};

const COURSE_LABELS: Record<string, string> = {
  s1: 'S1', s2: 'S2', s3: 'S3', n4: 'N4', n5: 'N5', higher: 'Higher',
};

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF1E3A8A' } },
    };
  });
  row.height = 22;
}

function addPercentDataBar(sheet: ExcelJS.Worksheet, range: string) {
  // Conditional-formatting "data bar" — gives every average % cell a built-in
  // horizontal bar chart so the sheet is visually scannable without inserting
  // a chart object.
  sheet.addConditionalFormatting({
    ref: range,
    rules: [
      {
        type: 'dataBar',
        priority: 1,
        cfvo: [{ type: 'num', value: 0 }, { type: 'num', value: 100 }],
        color: { argb: 'FF22C55E' },
        gradient: true,
        showValue: true,
      } as any,
    ],
  });
}

function pct(v: number | null | undefined): number | null {
  if (v == null) return null;
  return Math.round(Number(v));
}

export async function buildAnalyticsWorkbook(course: ClassworkCourse): Promise<ExcelJS.Workbook> {
  const overview = await getCourseAnalytics(course);

  // Per-lesson detail (questions + per-student best-attempts) — fetched
  // sequentially to keep DB load light. There are typically <100 lessons in a
  // course so this is fine.
  const lessonDetails = await Promise.all(
    overview.lessons.map((l: any) => getLessonAnalytics(l.lesson_id).then((d) => ({ row: l, detail: d })))
  );

  const wb = new ExcelJS.Workbook();
  wb.creator = 'BHS Classwork';
  wb.created = new Date();
  wb.title = `Classwork analytics — ${COURSE_LABELS[course] || course}`;

  /* ---------------- Overview sheet ---------------- */
  {
    const sh = wb.addWorksheet('Overview', { views: [{ state: 'frozen', ySplit: 1 }] });
    sh.columns = [
      { header: 'Metric', key: 'metric', width: 36 },
      { header: 'Value', key: 'value', width: 20 },
    ];
    styleHeaderRow(sh.getRow(1));
    sh.addRow({ metric: 'Course', value: COURSE_LABELS[course] || course });
    sh.addRow({ metric: 'Generated at', value: new Date().toLocaleString('en-GB') });
    sh.addRow({ metric: 'Lessons in course', value: overview.lessons.length });
    sh.addRow({ metric: 'Lessons published', value: overview.lessons.filter((l: any) => l.is_published).length });
    sh.addRow({ metric: 'Students who submitted', value: Number(overview.totals.distinct_students || 0) });
    sh.addRow({ metric: 'Total submissions', value: Number(overview.totals.submission_count || 0) });
    sh.addRow({ metric: '', value: '' });
    sh.addRow({ metric: 'Note', value: 'Extension activities are excluded from every figure in this workbook.' });
    sh.getRow(8).getCell('B').alignment = { wrapText: true, vertical: 'top' };
    sh.getRow(8).font = { italic: true, color: { argb: 'FF6B7280' } };
  }

  /* ---------------- Lessons sheet ---------------- */
  {
    const sh = wb.addWorksheet('Lessons', { views: [{ state: 'frozen', ySplit: 1 }] });
    sh.columns = [
      { header: 'Unit', key: 'unit', width: 28 },
      { header: 'Lesson', key: 'lesson', width: 36 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Questions', key: 'questions', width: 12 },
      { header: 'Submissions', key: 'subs', width: 14 },
      { header: 'Distinct students', key: 'students', width: 18 },
      { header: 'Marked', key: 'marked', width: 12 },
      { header: 'Average %', key: 'avg', width: 18 },
    ];
    styleHeaderRow(sh.getRow(1));
    overview.lessons.forEach((l: any) => {
      sh.addRow({
        unit: l.unit_title,
        lesson: l.lesson_title,
        status: l.is_published ? 'Published' : 'Draft',
        questions: Number(l.question_count) || 0,
        subs: Number(l.submission_count) || 0,
        students: Number(l.distinct_students) || 0,
        marked: Number(l.marked_count) || 0,
        avg: pct(l.avg_percent),
      });
    });
    const last = sh.rowCount;
    if (last > 1) {
      addPercentDataBar(sh, `H2:H${last}`);
      sh.getColumn('avg').numFmt = '0"%"';
    }
  }

  /* ---------------- Students sheet ---------------- */
  {
    const sh = wb.addWorksheet('Students', { views: [{ state: 'frozen', ySplit: 1 }] });
    sh.columns = [
      { header: 'Username', key: 'username', width: 28 },
      { header: 'Submissions', key: 'subs', width: 14 },
      { header: 'Lessons touched', key: 'lessons', width: 18 },
      { header: 'Last submitted', key: 'last', width: 22 },
      { header: 'Average %', key: 'avg', width: 18 },
    ];
    styleHeaderRow(sh.getRow(1));
    overview.students.forEach((s: any) => {
      sh.addRow({
        username: s.username || '(unknown)',
        subs: Number(s.submission_count) || 0,
        lessons: Number(s.lessons_touched) || 0,
        last: s.last_submitted_at ? new Date(s.last_submitted_at).toLocaleString('en-GB') : '',
        avg: pct(s.avg_percent),
      });
    });
    const last = sh.rowCount;
    if (last > 1) {
      addPercentDataBar(sh, `E2:E${last}`);
      sh.getColumn('avg').numFmt = '0"%"';
    }
  }

  /* ---------------- Per-question sheet ---------------- */
  {
    const sh = wb.addWorksheet('Questions', { views: [{ state: 'frozen', ySplit: 1 }] });
    sh.columns = [
      { header: 'Unit', key: 'unit', width: 24 },
      { header: 'Lesson', key: 'lesson', width: 30 },
      { header: 'Q#', key: 'qn', width: 6 },
      { header: 'Type', key: 'type', width: 18 },
      { header: 'Prompt', key: 'prompt', width: 60 },
      { header: 'Max marks', key: 'max', width: 12 },
      { header: 'Submissions', key: 'subs', width: 14 },
      { header: 'Distinct students', key: 'students', width: 18 },
      { header: 'Average %', key: 'avg', width: 18 },
    ];
    styleHeaderRow(sh.getRow(1));
    lessonDetails.forEach(({ row, detail }) => {
      if (!detail) return;
      detail.questions.forEach((q: any, i: number) => {
        sh.addRow({
          unit: row.unit_title,
          lesson: row.lesson_title,
          qn: i + 1,
          type: q.question_type,
          prompt: (q.prompt || '').slice(0, 500),
          max: Number(q.max_marks) || 0,
          subs: Number(q.submission_count) || 0,
          students: Number(q.distinct_students) || 0,
          avg: pct(q.avg_percent),
        });
      });
    });
    const last = sh.rowCount;
    if (last > 1) {
      addPercentDataBar(sh, `I2:I${last}`);
      sh.getColumn('avg').numFmt = '0"%"';
    }
  }

  /* ---------------- Per-lesson per-student sheet ---------------- */
  {
    const sh = wb.addWorksheet('Lesson scores', { views: [{ state: 'frozen', ySplit: 1 }] });
    sh.columns = [
      { header: 'Unit', key: 'unit', width: 24 },
      { header: 'Lesson', key: 'lesson', width: 30 },
      { header: 'Student', key: 'student', width: 24 },
      { header: 'Marks', key: 'marks', width: 10 },
      { header: 'Out of', key: 'out', width: 10 },
      { header: 'Percent', key: 'pct', width: 14 },
      { header: 'Questions attempted', key: 'qa', width: 20 },
      { header: 'Last submitted', key: 'last', width: 22 },
    ];
    styleHeaderRow(sh.getRow(1));
    lessonDetails.forEach(({ row, detail }) => {
      if (!detail) return;
      detail.students.forEach((s: any) => {
        const total = Number(s.total_marks) || 0;
        const max = Number(s.max_marks) || 0;
        const p = max > 0 ? Math.round((total / max) * 100) : null;
        sh.addRow({
          unit: row.unit_title,
          lesson: row.lesson_title,
          student: s.username || '(unknown)',
          marks: total,
          out: max,
          pct: p,
          qa: Number(s.questions_attempted) || 0,
          last: s.last_submitted_at ? new Date(s.last_submitted_at).toLocaleString('en-GB') : '',
        });
      });
    });
    const last = sh.rowCount;
    if (last > 1) {
      addPercentDataBar(sh, `F2:F${last}`);
      sh.getColumn('pct').numFmt = '0"%"';
    }
  }

  return wb;
}

export async function buildCredentialsWorkbook(
  classId: string,
): Promise<{ wb: ExcelJS.Workbook; className: string } | null> {
  const students = await listStudentsInClass(classId);
  if (!students || students.length === 0) return null;

  // Pull class name from the first student's classId — we need to query it.
  // listStudentsInClass returns StudentRow[] which doesn't include the class
  // name, so derive a fallback from the id and let the caller label via the
  // workbook title.
  const className = (students as any[])[0]?.className as string | undefined || classId;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'BHS Classwork';
  wb.created = new Date();
  wb.title = `Login Credentials — ${className}`;

  const sh = wb.addWorksheet('Logins', { views: [{ state: 'frozen', ySplit: 2 }] });

  // Row 1 — instruction note spanning all columns
  sh.mergeCells('A1:E1');
  const noteCell = sh.getCell('A1');
  noteCell.value =
    'Fill in the "Name" column with each pupil\'s real name. ' +
    'Keep this file secure — do not share or upload it.';
  noteCell.font = { italic: true, color: { argb: 'FF6B7280' }, size: 10 };
  noteCell.alignment = { vertical: 'middle', wrapText: true };
  sh.getRow(1).height = 30;

  // Row 2 — column headers
  sh.columns = [
    { key: 'name',     width: 28 },
    { key: 'username', width: 28 },
    { key: 'password', width: 22 },
    { key: 'status',   width: 24 },
    { key: 'notes',    width: 32 },
  ];
  const headerRow = sh.getRow(2);
  headerRow.values = ['Name', 'Username', 'Initial password', 'Status', 'Notes'];
  styleHeaderRow(headerRow);

  // Data rows
  for (const s of students as any[]) {
    const changed = !s.mustChangePassword;
    sh.addRow({
      name:     '',
      username: s.username,
      password: s.initialPassword || '',
      status:   changed ? 'Changed own password' : 'Not yet changed',
      notes:    '',
    });
    const row = sh.lastRow!;
    if (changed) {
      // Grey out the password cell for students who have already changed it
      row.getCell('password').font = { color: { argb: 'FF9CA3AF' }, italic: true };
      row.getCell('status').font  = { color: { argb: 'FF9CA3AF' }, italic: true };
    }
    row.getCell('username').font = { name: 'Courier New', size: 11 };
    row.getCell('password').font = { ...row.getCell('password').font, name: 'Courier New', size: 11 };
  }

  // Light border on all data cells
  const lastRow = sh.rowCount;
  for (let r = 2; r <= lastRow; r++) {
    sh.getRow(r).eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left:   { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right:  { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
  }

  return { wb, className };
}
