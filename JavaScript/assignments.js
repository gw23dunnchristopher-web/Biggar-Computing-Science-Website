let currentUser = null;
let currentClass = null;
let currentAssignment = null;
let currentSubmission = null;
let pyodide = null;
let codeEditor = null;
let submissionCodeEditor = null;

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showApp();
        } else {
            showAuth();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showAuth();
    }
}

function showAuth() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('appSection').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
}

function showApp() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('appSection').style.display = 'block';
    document.getElementById('userInfo').style.display = 'block';
    document.getElementById('userName').textContent = currentUser.fullName + ' (' + currentUser.role + ')';
    
    if (currentUser.role === 'teacher') {
        document.getElementById('teacherDashboard').style.display = 'block';
        document.getElementById('studentDashboard').style.display = 'none';
        loadClasses();
    } else {
        document.getElementById('teacherDashboard').style.display = 'none';
        document.getElementById('studentDashboard').style.display = 'block';
        loadStudentClasses();
    }
}

function switchAuthTab(tab) {
    document.querySelectorAll('#authSection .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#authSection .tab-content').forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelectorAll('#authSection .tab')[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('#authSection .tab')[1].classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showApp();
        } else {
            const error = await response.json();
            alert(error.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed');
    }
}

async function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const fullName = document.getElementById('registerFullName').value;
    const role = document.getElementById('registerRole').value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, fullName, role })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showApp();
        } else {
            const error = await response.json();
            alert(error.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed');
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        currentUser = null;
        showAuth();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    if (tab === 'classes') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('classesTab').classList.add('active');
        loadClasses();
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('createTab').classList.add('active');
    }
}

async function loadClasses() {
    try {
        const response = await fetch('/api/classes');
        const data = await response.json();
        
        const classList = document.getElementById('classesList');
        classList.innerHTML = '';
        
        if (data.classes.length === 0) {
            classList.innerHTML = '<p>No classes yet. Create your first class!</p>';
            return;
        }
        
        data.classes.forEach(cls => {
            const card = document.createElement('div');
            card.className = 'class-card';
            card.innerHTML = `
                <h3>${cls.name} (${cls.level})</h3>
                <button onclick="viewClass(${cls.id})" class="btn btn-primary">Manage Class</button>
            `;
            classList.appendChild(card);
        });
    } catch (error) {
        console.error('Load classes error:', error);
    }
}

async function loadStudentClasses() {
    try {
        const response = await fetch('/api/classes');
        const data = await response.json();
        
        const classList = document.getElementById('studentClassesList');
        classList.innerHTML = '';
        
        if (data.classes.length === 0) {
            classList.innerHTML = '<p>You are not enrolled in any classes yet.</p>';
            return;
        }
        
        data.classes.forEach(cls => {
            const card = document.createElement('div');
            card.className = 'class-card';
            card.innerHTML = `
                <h3>${cls.name} (${cls.level})</h3>
                <button onclick="viewStudentClass(${cls.id})" class="btn btn-primary">View Assignments</button>
            `;
            classList.appendChild(card);
        });
    } catch (error) {
        console.error('Load student classes error:', error);
    }
}

async function createClass() {
    const name = document.getElementById('className').value;
    const level = document.getElementById('classLevel').value;
    
    if (!name) {
        alert('Please enter a class name');
        return;
    }
    
    try {
        const response = await fetch('/api/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, level })
        });
        
        if (response.ok) {
            document.getElementById('className').value = '';
            switchTab('classes');
        } else {
            alert('Failed to create class');
        }
    } catch (error) {
        console.error('Create class error:', error);
        alert('Failed to create class');
    }
}

async function viewClass(classId) {
    currentClass = classId;
    document.getElementById('classModal').style.display = 'block';
    
    const classes = await (await fetch('/api/classes')).json();
    const cls = classes.classes.find(c => c.id === classId);
    document.getElementById('classModalTitle').textContent = cls.name;
    
    switchClassTab('assignments');
}

async function viewStudentClass(classId) {
    currentClass = classId;
    document.getElementById('classModal').style.display = 'block';
    
    const classes = await (await fetch('/api/classes')).json();
    const cls = classes.classes.find(c => c.id === classId);
    document.getElementById('classModalTitle').textContent = cls.name;
    
    document.getElementById('studentsTab').style.display = 'none';
    document.getElementById('createAssignmentTab').style.display = 'none';
    document.querySelectorAll('#classModal .tab')[1].style.display = 'none';
    document.querySelectorAll('#classModal .tab')[2].style.display = 'none';
    
    loadAssignments();
}

function closeClassModal() {
    document.getElementById('classModal').style.display = 'none';
    currentClass = null;
}

function switchClassTab(tab) {
    document.querySelectorAll('#classModal .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#classModal .tab-content').forEach(t => t.classList.remove('active'));
    
    if (tab === 'assignments') {
        document.querySelectorAll('#classModal .tab')[0].classList.add('active');
        document.getElementById('assignmentsTab').classList.add('active');
        loadAssignments();
    } else if (tab === 'students') {
        document.querySelectorAll('#classModal .tab')[1].classList.add('active');
        document.getElementById('studentsTab').classList.add('active');
        loadStudents();
    } else {
        document.querySelectorAll('#classModal .tab')[2].classList.add('active');
        document.getElementById('createAssignmentTab').classList.add('active');
    }
}

async function loadAssignments() {
    try {
        const response = await fetch(`/api/classes/${currentClass}/assignments`);
        const data = await response.json();
        
        const list = document.getElementById('assignmentsList');
        list.innerHTML = '';
        
        if (data.assignments.length === 0) {
            list.innerHTML = '<p>No assignments yet.</p>';
            return;
        }
        
        data.assignments.forEach(assignment => {
            const card = document.createElement('div');
            card.className = 'assignment-card';
            const dueDate = assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'No due date';
            card.innerHTML = `
                <h3>${assignment.title}</h3>
                <p>${assignment.description}</p>
                <p><strong>Due:</strong> ${dueDate}</p>
                <button onclick="viewAssignment(${assignment.id})" class="btn btn-primary">
                    ${currentUser.role === 'teacher' ? 'View Submissions' : 'Open Assignment'}
                </button>
            `;
            list.appendChild(card);
        });
    } catch (error) {
        console.error('Load assignments error:', error);
    }
}

async function loadStudents() {
    try {
        const response = await fetch(`/api/classes/${currentClass}/students`);
        const data = await response.json();
        
        const list = document.getElementById('studentsList');
        list.innerHTML = '';
        
        if (data.students.length === 0) {
            list.innerHTML = '<p>No students enrolled yet.</p>';
            return;
        }
        
        data.students.forEach(student => {
            const item = document.createElement('div');
            item.className = 'student-item';
            item.innerHTML = `
                <strong>${student.fullName}</strong> (${student.username})<br>
                <small>Enrolled: ${new Date(student.enrolledAt).toLocaleDateString()}</small>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Load students error:', error);
    }
}

async function addStudent() {
    const username = document.getElementById('studentUsername').value;
    
    if (!username) {
        alert('Please enter a student username');
        return;
    }
    
    try {
        const response = await fetch(`/api/classes/${currentClass}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentUsername: username })
        });
        
        if (response.ok) {
            document.getElementById('studentUsername').value = '';
            loadStudents();
            alert('Student added successfully');
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to add student');
        }
    } catch (error) {
        console.error('Add student error:', error);
        alert('Failed to add student');
    }
}

async function createAssignment() {
    const title = document.getElementById('assignmentTitle').value;
    const description = document.getElementById('assignmentDescription').value;
    const starterCode = document.getElementById('assignmentStarter').value;
    const dueDate = document.getElementById('assignmentDueDate').value;
    
    if (!title || !description) {
        alert('Please enter title and description');
        return;
    }
    
    try {
        const response = await fetch('/api/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                starterCode,
                classId: currentClass,
                dueDate: dueDate || null
            })
        });
        
        if (response.ok) {
            document.getElementById('assignmentTitle').value = '';
            document.getElementById('assignmentDescription').value = '';
            document.getElementById('assignmentStarter').value = '';
            document.getElementById('assignmentDueDate').value = '';
            switchClassTab('assignments');
            alert('Assignment created successfully');
        } else {
            alert('Failed to create assignment');
        }
    } catch (error) {
        console.error('Create assignment error:', error);
        alert('Failed to create assignment');
    }
}

async function viewAssignment(assignmentId) {
    currentAssignment = assignmentId;
    
    try {
        const response = await fetch(`/api/assignments/${assignmentId}`);
        const data = await response.json();
        
        document.getElementById('assignmentModal').style.display = 'block';
        document.getElementById('assignmentModalTitle').textContent = data.assignment.title;
        document.getElementById('assignmentDescription').textContent = data.assignment.description;
        document.getElementById('assignmentDueDate').textContent = data.assignment.dueDate 
            ? 'Due: ' + new Date(data.assignment.dueDate).toLocaleString() 
            : '';
        
        if (currentUser.role === 'teacher') {
            document.getElementById('studentIDE').style.display = 'none';
            document.getElementById('teacherReview').style.display = 'block';
            loadSubmissions();
        } else {
            document.getElementById('studentIDE').style.display = 'block';
            document.getElementById('teacherReview').style.display = 'none';
            await loadPyodide();
            initCodeEditor(data.assignment.starterCode || '# Write your Python code here\n');
            checkExistingSubmission();
        }
    } catch (error) {
        console.error('View assignment error:', error);
    }
}

function closeAssignmentModal() {
    document.getElementById('assignmentModal').style.display = 'none';
    currentAssignment = null;
    if (codeEditor) {
        codeEditor.toTextArea();
        codeEditor = null;
    }
}

async function loadPyodide() {
    if (!pyodide) {
        document.getElementById('output').textContent = 'Loading Python environment...';
        pyodide = await loadPyodide();
        document.getElementById('output').textContent = 'Python ready!';
    }
}

function initCodeEditor(code) {
    const editorEl = document.getElementById('codeEditor');
    editorEl.innerHTML = '';
    const textarea = document.createElement('textarea');
    editorEl.appendChild(textarea);
    
    codeEditor = CodeMirror.fromTextArea(textarea, {
        mode: 'python',
        lineNumbers: true,
        theme: 'default',
        indentUnit: 4,
        value: code
    });
    codeEditor.setValue(code);
}

async function runCode() {
    if (!pyodide) {
        alert('Python environment not loaded yet');
        return;
    }
    
    const code = codeEditor.getValue();
    const outputEl = document.getElementById('output');
    
    try {
        outputEl.textContent = 'Running...';
        pyodide.setStdout({ batched: (msg) => {
            outputEl.textContent += msg + '\n';
        }});
        
        await pyodide.runPythonAsync(code);
        
        if (outputEl.textContent === 'Running...') {
            outputEl.textContent = 'Code executed (no output)';
        }
    } catch (error) {
        outputEl.textContent = 'Error: ' + error.message;
    }
}

async function submitCode() {
    const code = codeEditor.getValue();
    
    if (!code.trim()) {
        alert('Please write some code first');
        return;
    }
    
    if (!confirm('Submit this assignment?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assignmentId: currentAssignment,
                code
            })
        });
        
        if (response.ok) {
            alert('Assignment submitted successfully!');
            checkExistingSubmission();
        } else {
            alert('Failed to submit assignment');
        }
    } catch (error) {
        console.error('Submit error:', error);
        alert('Failed to submit assignment');
    }
}

async function checkExistingSubmission() {
    try {
        const response = await fetch(`/api/assignments/${currentAssignment}/submissions`);
        const data = await response.json();
        
        if (data.submission) {
            codeEditor.setValue(data.submission.code);
            
            if (data.submission.feedback) {
                document.getElementById('feedbackDisplay').style.display = 'block';
                document.getElementById('feedbackText').textContent = data.submission.feedback;
            } else {
                document.getElementById('feedbackDisplay').style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Check submission error:', error);
    }
}

async function loadSubmissions() {
    try {
        const response = await fetch(`/api/assignments/${currentAssignment}/submissions`);
        const data = await response.json();
        
        const list = document.getElementById('submissionsList');
        list.innerHTML = '';
        
        if (data.submissions.length === 0) {
            list.innerHTML = '<p>No submissions yet.</p>';
            return;
        }
        
        data.submissions.forEach(submission => {
            const item = document.createElement('div');
            item.className = 'submission-item';
            item.innerHTML = `
                <strong>${submission.studentName}</strong> (${submission.studentUsername})<br>
                <small>Submitted: ${new Date(submission.submittedAt).toLocaleString()}</small><br>
                ${submission.feedback ? '<span style="color: green;">✓ Feedback provided</span>' : '<span style="color: orange;">No feedback yet</span>'}
                <button onclick="reviewSubmission(${submission.id})" class="btn btn-primary" style="margin-top: 10px;">Review</button>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Load submissions error:', error);
    }
}

async function reviewSubmission(submissionId) {
    try {
        const response = await fetch(`/api/assignments/${currentAssignment}/submissions`);
        const data = await response.json();
        const submission = data.submissions.find(s => s.id === submissionId);
        
        if (!submission) return;
        
        currentSubmission = submissionId;
        document.getElementById('submissionModal').style.display = 'block';
        document.getElementById('submissionStudent').textContent = submission.studentName;
        document.getElementById('submissionDate').textContent = new Date(submission.submittedAt).toLocaleString();
        
        const editorEl = document.getElementById('submissionCodeEditor');
        editorEl.innerHTML = '';
        const textarea = document.createElement('textarea');
        editorEl.appendChild(textarea);
        
        submissionCodeEditor = CodeMirror.fromTextArea(textarea, {
            mode: 'python',
            lineNumbers: true,
            theme: 'default',
            readOnly: true
        });
        submissionCodeEditor.setValue(submission.code);
        
        if (submission.feedback) {
            document.getElementById('existingFeedback').style.display = 'block';
            document.getElementById('existingFeedbackText').textContent = submission.feedback;
            document.getElementById('feedbackInput').value = submission.feedback;
        } else {
            document.getElementById('existingFeedback').style.display = 'none';
            document.getElementById('feedbackInput').value = '';
        }
    } catch (error) {
        console.error('Review submission error:', error);
    }
}

function closeSubmissionModal() {
    document.getElementById('submissionModal').style.display = 'none';
    currentSubmission = null;
    if (submissionCodeEditor) {
        submissionCodeEditor.toTextArea();
        submissionCodeEditor = null;
    }
}

async function runSubmissionCode() {
    if (!pyodide) {
        await loadPyodide();
    }
    
    const code = submissionCodeEditor.getValue();
    const outputEl = document.getElementById('submissionOutput');
    
    try {
        outputEl.textContent = 'Running...';
        pyodide.setStdout({ batched: (msg) => {
            outputEl.textContent += msg + '\n';
        }});
        
        await pyodide.runPythonAsync(code);
        
        if (outputEl.textContent === 'Running...') {
            outputEl.textContent = 'Code executed (no output)';
        }
    } catch (error) {
        outputEl.textContent = 'Error: ' + error.message;
    }
}

async function submitFeedback() {
    const feedback = document.getElementById('feedbackInput').value;
    
    if (!feedback.trim()) {
        alert('Please enter feedback');
        return;
    }
    
    try {
        const response = await fetch(`/api/submissions/${currentSubmission}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback })
        });
        
        if (response.ok) {
            alert('Feedback submitted successfully');
            closeSubmissionModal();
            loadSubmissions();
        } else {
            alert('Failed to submit feedback');
        }
    } catch (error) {
        console.error('Submit feedback error:', error);
        alert('Failed to submit feedback');
    }
}

checkAuth();
